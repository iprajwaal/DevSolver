"""
Service for document retrieval and RAG.
"""
import json
import time
import numpy as np
from pathlib import Path
import requests
from typing import List, Dict, Any, Optional, Tuple
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.feature_extraction.text import TfidfVectorizer

# Import providers conditionally
try:
    import openai
    from openai import OpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False

from app.core.config import (
    TOP_K_RETRIEVAL,
    SEMANTIC_WEIGHT,
    USE_WEB_GROUNDING,
    OPENAI_API_KEY,
    COMPLETION_MODEL,
    USE_VERTEX_AI
)
from app.core.logging_config import get_logger
from app.api.models import (
    DocumentChunk,
    SearchResult,
    DocumentSource,
    Technology,
    ResponseSource,
    SolutionResponse
)
from app.services.embedding_service import EmbeddingService
from app.services.document_service import DocumentService
from app.utils.rate_limiter import rate_limited, llm_rate_limiter

# Import Vertex AI service if enabled
if USE_VERTEX_AI:
    from app.services.vertex_service import VertexAIService

logger = get_logger(__name__)


class RetrievalService:
    """Service for retrieving documents and generating responses."""
    
    def __init__(self, document_service: DocumentService, embedding_service: EmbeddingService):
        """
        Initialize the retrieval service.
        
        Args:
            document_service: Document service for accessing documents
            embedding_service: Embedding service for generating embeddings
        """
        self.document_service = document_service
        self.embedding_service = embedding_service
        self.top_k = TOP_K_RETRIEVAL
        self.semantic_weight = SEMANTIC_WEIGHT
        self.use_web_grounding = USE_WEB_GROUNDING
        
        # Initialize the appropriate text generation service
        if USE_VERTEX_AI:
            logger.info("Using Vertex AI for text generation")
            self.vertex_service = VertexAIService()
            self.use_vertex = True
        elif OPENAI_AVAILABLE and OPENAI_API_KEY:
            logger.info(f"Using OpenAI for text generation: {COMPLETION_MODEL}")
            self.client = OpenAI(api_key=OPENAI_API_KEY)
            self.completion_model = COMPLETION_MODEL
            self.use_vertex = False
        else:
            logger.warning("No text generation service available")
            self.client = None
            self.use_vertex = False
    
    def keyword_search(
        self,
        query: str,
        chunks: List[DocumentChunk],
        sources: Dict[str, DocumentSource],
        top_k: int = None
    ) -> List[SearchResult]:
        """
        Perform keyword-based search using TF-IDF.
        
        Args:
            query: Query to search for
            chunks: List of document chunks to search
            sources: Dictionary mapping document IDs to source information
            top_k: Number of results to return
            
        Returns:
            List of search results with scores
        """
        if not chunks:
            logger.warning("No chunks to search")
            return []
        
        if top_k is None:
            top_k = self.top_k
        
        # Create corpus for TF-IDF
        corpus = [chunk.content for chunk in chunks]
        chunk_ids = [chunk.id for chunk in chunks]
        
        # Vectorize
        vectorizer = TfidfVectorizer(
            lowercase=True,
            strip_accents='unicode',
            stop_words='english'
        )
        
        try:
            tfidf_matrix = vectorizer.fit_transform(corpus)
            query_vector = vectorizer.transform([query])
            
            # Calculate similarities
            similarities = cosine_similarity(query_vector, tfidf_matrix)[0]
            
            # Create list of (chunk, score) tuples
            chunk_scores = [
                (chunks[i], similarities[i]) 
                for i in range(len(chunks))
            ]
            
            # Sort by score
            chunk_scores.sort(key=lambda x: x[1], reverse=True)
            
            # Return top k results
            results = []
            for chunk, score in chunk_scores[:top_k]:
                # Get source information
                doc_id = chunk.document_id
                source = sources.get(doc_id, DocumentSource(
                    title=f"Document {doc_id}",
                    description="No source information available"
                ))
                
                results.append(SearchResult(
                    document_chunk=chunk,
                    score=float(score),
                    source=source
                ))
            
            logger.info(f"Keyword search returned {len(results)} results")
            return results
            
        except Exception as e:
            logger.error(f"Error in keyword search: {str(e)}")
            return []
    
    def semantic_search(
        self,
        query_embedding: np.ndarray,
        chunks: List[DocumentChunk],
        chunk_embeddings: Dict[str, np.ndarray],
        sources: Dict[str, DocumentSource],
        top_k: int = None
    ) -> List[SearchResult]:
        """
        Perform semantic search using embeddings.
        
        Args:
            query_embedding: Embedding of the query
            chunks: List of document chunks to search
            chunk_embeddings: Dictionary mapping chunk IDs to embeddings
            sources: Dictionary mapping document IDs to source information
            top_k: Number of results to return
            
        Returns:
            List of search results with scores
        """
        if not chunks or not chunk_embeddings:
            logger.warning("No chunks or embeddings to search")
            return []
        
        if top_k is None:
            top_k = self.top_k
        
        # Calculate similarities for chunks that have embeddings
        similarities = []
        for chunk in chunks:
            if chunk.id in chunk_embeddings:
                chunk_embedding = chunk_embeddings[chunk.id]
                
                # Reshape embeddings to 2D arrays for cosine_similarity
                query_2d = query_embedding.reshape(1, -1)
                chunk_2d = chunk_embedding.reshape(1, -1)
                
                # Calculate similarity
                similarity = cosine_similarity(query_2d, chunk_2d)[0][0]
                similarities.append((chunk, similarity))
        
        # Sort by similarity score
        similarities.sort(key=lambda x: x[1], reverse=True)
        
        # Return top k results
        results = []
        for chunk, score in similarities[:top_k]:
            # Get source information
            doc_id = chunk.document_id
            source = sources.get(doc_id, DocumentSource(
                title=f"Document {doc_id}",
                description="No source information available"
            ))
            
            results.append(SearchResult(
                document_chunk=chunk,
                score=float(score),
                source=source
            ))
        
        logger.info(f"Semantic search returned {len(results)} results")
        return results
    
    def hybrid_search(
        self,
        query: str,
        technology: Technology,
        top_k: int = None,
        filter_source_type: Optional[str] = None
    ) -> List[SearchResult]:
        """
        Perform hybrid search combining semantic and keyword search.
        
        Args:
            query: Query to search for
            technology: Technology to search documentation for
            top_k: Number of results to return
            filter_source_type: Optional filter for source type ('official' or 'community')
            
        Returns:
            List of search results
        """
        if top_k is None:
            top_k = self.top_k
        
        logger.info(f"Performing hybrid search for '{query}' in {technology.value} documentation")
        
        # Load chunks and embeddings
        chunks = self.document_service.load_document_chunks(technology)
        chunk_embeddings = self.embedding_service.load_embeddings(technology)
        
        # Load document sources
        sources = {}
        tech_dir = self.document_service.documentation_dir / technology.value
        if tech_dir.exists():
            for metadata_file in tech_dir.glob("*-metadata.json"):
                with open(metadata_file, 'r', encoding='utf-8') as f:
                    metadata = json.load(f)
                    doc_id = metadata["document_id"]
                    sources[doc_id] = DocumentSource(**metadata["source"])
        
        # Filter chunks by source type if specified
        if filter_source_type:
            filtered_chunks = []
            for chunk in chunks:
                doc_id = chunk.document_id
                if doc_id in sources and sources[doc_id].source_type == filter_source_type:
                    filtered_chunks.append(chunk)
            chunks = filtered_chunks
            logger.info(f"Filtered to {len(chunks)} chunks with source type '{filter_source_type}'")
        
        # If no chunks, return empty results
        if not chunks:
            logger.warning(f"No chunks found for {technology.value}")
            return []
        
        try:
            # Generate query embedding
            query_embedding = self.embedding_service.generate_embedding(query)
            
            # Perform semantic search
            semantic_results = self.semantic_search(
                query_embedding,
                chunks,
                chunk_embeddings,
                sources,
                top_k
            )
            
            # Perform keyword search
            keyword_results = self.keyword_search(
                query,
                chunks,
                sources,
                top_k
            )
            
            # Combine results
            combined_scores = {}
            
            # Add semantic results
            for result in semantic_results:
                chunk_id = result.document_chunk.id
                combined_scores[chunk_id] = self.semantic_weight * result.score
                
            # Add keyword results
            for result in keyword_results:
                chunk_id = result.document_chunk.id
                if chunk_id in combined_scores:
                    combined_scores[chunk_id] += (1 - self.semantic_weight) * result.score
                else:
                    combined_scores[chunk_id] = (1 - self.semantic_weight) * result.score
            
            # Create result dictionary for easy lookup
            all_results = {r.document_chunk.id: r for r in semantic_results + keyword_results}
            
            # Sort by combined score
            sorted_ids = sorted(
                combined_scores.keys(),
                key=lambda chunk_id: combined_scores[chunk_id],
                reverse=True
            )
            
            # Return top k results
            results = [all_results[chunk_id] for chunk_id in sorted_ids[:top_k] if chunk_id in all_results]
            
            # If we don't have enough results, add more from semantic or keyword results
            if len(results) < top_k:
                # Add remaining results from semantic search
                for result in semantic_results:
                    if result.document_chunk.id not in combined_scores:
                        results.append(result)
                        if len(results) >= top_k:
                            break
                
                # Add remaining results from keyword search
                for result in keyword_results:
                    if result.document_chunk.id not in combined_scores:
                        results.append(result)
                        if len(results) >= top_k:
                            break
            
            logger.info(f"Hybrid search returned {len(results)} results")
            
            # Update scores in results to reflect combined scores
            for result in results:
                chunk_id = result.document_chunk.id
                if chunk_id in combined_scores:
                    result.score = combined_scores[chunk_id]
            
            return results
            
        except Exception as e:
            logger.error(f"Error in hybrid search: {str(e)}")
            
            # Fall back to keyword search only
            logger.info("Falling back to keyword search only")
            return self.keyword_search(query, chunks, sources, top_k)
    
    def generate_context(self, results: List[SearchResult], max_tokens: int = 3000) -> str:
        """
        Generate context from search results.
        
        Args:
            results: List of search results
            max_tokens: Maximum number of tokens for context
            
        Returns:
            Generated context string
        """
        if not results:
            return ""
        
        context = ""
        
        # Group results by source
        source_groups = {}
        for result in results:
            source_title = result.source.title
            if source_title not in source_groups:
                source_groups[source_title] = []
            source_groups[source_title].append(result)
        
        # Add content from each source group
        for source_title, group_results in source_groups.items():
            context += f"# Source: {source_title}\n\n"
            
            for result in group_results:
                context += result.document_chunk.content.strip() + "\n\n"
                context += "---\n\n"
        
        return context
    
    def retrieve_community_solutions(self, query: str, technology: Technology, code_context: str = "") -> List[SearchResult]:
        """
        Retrieve community solutions from the web.
        
        Args:
            query: Query to search for
            technology: Technology to search for
            code_context: Optional code context
            
        Returns:
            List of search results
        """
        if not self.use_web_grounding:
            logger.info("Web grounding is disabled, using internal documents only")
            return self.hybrid_search(query, technology, filter_source_type="community")
        
        logger.info(f"Retrieving community solutions for '{query}' in {technology.value}")
        
        try:
            # For now, we'll use the internal community documents
            # In a production system, this would connect to Stack Overflow API,
            # GitHub Discussions, or a specialized web search
            community_results = self.hybrid_search(query, technology, filter_source_type="community")
            
            # If we have community results, return them
            if community_results:
                return community_results
            
            # Otherwise, fetch new community content
            content, source = self.document_service.fetch_community_content(
                technology,
                query
            )
            
            # Create document ID
            import uuid
            document_id = f"community-{technology.value}-{uuid.uuid4()}"
            
            # Chunk the content
            chunks = self.document_service.chunk_document(content, document_id)
            
            # Save chunks
            self.document_service.save_document_chunks(chunks, technology, source)
            
            # Generate embeddings
            self.embedding_service.process_chunks_with_embeddings(chunks, technology)
            
            # Return as search results
            results = []
            for i, chunk in enumerate(chunks):
                results.append(SearchResult(
                    document_chunk=chunk,
                    score=1.0 - (i * 0.1),  # Decreasing scores for chunks
                    source=source
                ))
            
            return results
            
        except Exception as e:
            logger.error(f"Error retrieving community solutions: {str(e)}")
            return []
    
    def retrieve_official_documentation(self, query: str, technology: Technology) -> List[SearchResult]:
        """
        Retrieve official documentation.
        
        Args:
            query: Query to search for
            technology: Technology to search documentation for
            
        Returns:
            List of search results
        """
        logger.info(f"Retrieving official documentation for '{query}' in {technology.value}")
        
        # Use hybrid search with filter for official documentation
        return self.hybrid_search(query, technology, filter_source_type="official")
    
    @rate_limited(llm_rate_limiter)
    def generate_solution(
        self,
        query: str,
        results: List[SearchResult],
        code_context: str = "",
        source_type: str = "official"
    ) -> SolutionResponse:
        """
        Generate a solution based on retrieved results.
        
        Args:
            query: Original query
            results: Retrieved search results
            code_context: Optional code context
            source_type: Type of source ('official' or 'community')
            
        Returns:
            Generated solution response
        """
        if not results:
            logger.warning(f"No {source_type} results to generate solution from")
            return SolutionResponse(
                source_type=ResponseSource.OFFICIAL if source_type == "official" else ResponseSource.COMMUNITY,
                answer=f"I couldn't find relevant {source_type} documentation for your query.",
                confidence_score=0.0
            )
        
        # Generate context from results
        context = self.generate_context(results)
        
        # Include code context if provided
        if code_context:
            prompt_context = f"CODE CONTEXT:\n{code_context}\n\nDOCUMENTATION CONTEXT:\n{context}"
        else:
            prompt_context = f"DOCUMENTATION CONTEXT:\n{context}"
        
        # Create prompt for solution generation
        prompt = f"""
        You are a helpful programming assistant that provides accurate and specific solutions.
        
        Answer the user's question based ONLY on the provided context. If the answer cannot be found
        in the context, say "I don't have enough information to answer this question."
        
        Clearly distinguish between official documentation and community solutions in your answer.
        
        {prompt_context}
        
        USER QUESTION: {query}
        
        When providing code examples, make sure they are complete, correct, and follow best practices.
        Cite your sources by mentioning which documentation or community solution you're referencing.
        """
        
        try:
            # Generate the solution using the appropriate service
            if self.use_vertex:
                answer = self.vertex_service.generate_text(prompt, temperature=0.1)
                
                # Confidence score is always high for Vertex AI responses
                confidence_score = 0.9
            elif OPENAI_AVAILABLE and self.client:
                # Call OpenAI to generate the solution
                response = self.client.chat.completions.create(
                    model=self.completion_model,
                    messages=[
                        {"role": "system", "content": prompt},
                        {"role": "user", "content": query}
                    ],
                    temperature=0.1
                )
                
                answer = response.choices[0].message.content
                
                # Calculate confidence score based on token usage
                max_tokens = 4000  # Typical context window
                confidence_score = min(1.0, response.usage.total_tokens / max_tokens)
            else:
                answer = "I'm sorry, no text generation service is available."
                confidence_score = 0.0
            
            # Extract potential code changes
            code_changes = None
            if "```" in answer:
                # Simple extraction of code blocks
                import re
                code_blocks = re.findall(r"```(?:[\w]*)\n(.*?)```", answer, re.DOTALL)
                if code_blocks:
                    code_changes = "\n\n".join(code_blocks)
            
            return SolutionResponse(
                source_type=ResponseSource.OFFICIAL if source_type == "official" else ResponseSource.COMMUNITY,
                answer=answer,
                code_changes=code_changes,
                references=results,
                confidence_score=confidence_score
            )
            
        except Exception as e:
            logger.error(f"Error generating solution: {str(e)}")
            return SolutionResponse(
                source_type=ResponseSource.OFFICIAL if source_type == "official" else ResponseSource.COMMUNITY,
                answer=f"I encountered an error while generating a solution: {str(e)}",
                confidence_score=0.0
            )
    
    def rag_with_grounding(
        self,
        query: str,
        technology: Technology,
        code_context: str = "",
        response_source_preference: ResponseSource = ResponseSource.BOTH
    ) -> Tuple[Optional[SolutionResponse], Optional[SolutionResponse]]:
        """
        Perform RAG with grounding.
        
        Args:
            query: Query to search for
            technology: Technology to search documentation for
            code_context: Optional code context
            response_source_preference: Preference for response source
            
        Returns:
            Tuple of official and community solutions
        """
        logger.info(f"Performing RAG with grounding for '{query}' in {technology.value}")
        
        official_solution = None
        community_solution = None
        
        # Retrieve official documentation if requested
        if response_source_preference in [ResponseSource.OFFICIAL, ResponseSource.BOTH]:
            official_results = self.retrieve_official_documentation(query, technology)
            official_solution = self.generate_solution(
                query,
                official_results,
                code_context,
                "official"
            )
        
        # Retrieve community solutions if requested
        if response_source_preference in [ResponseSource.COMMUNITY, ResponseSource.BOTH]:
            community_results = self.retrieve_community_solutions(query, technology, code_context)
            community_solution = self.generate_solution(
                query,
                community_results,
                code_context,
                "community"
            )
        
        return official_solution, community_solution