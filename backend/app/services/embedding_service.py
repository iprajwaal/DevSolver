"""
Service for generating and managing embeddings.
"""
import json
import time
import numpy as np
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple, Union
import pickle

# Import sentence-transformers as fallback option
from sentence_transformers import SentenceTransformer

from app.core.config import (
    EMBEDDINGS_DIR, 
    EMBEDDING_MODEL, 
    USE_VERTEX_AI, 
    RATE_LIMIT_BATCH_SIZE
)
from app.core.logging_config import get_logger
from app.api.models import DocumentChunk, Technology
from app.utils.rate_limiter import rate_limited, embedding_rate_limiter

# Import Vertex AI service if enabled
if USE_VERTEX_AI:
    from app.services.vertex_service import VertexAIService

logger = get_logger(__name__)


class EmbeddingService:
    """Service for generating and managing embeddings."""
    
    def __init__(self):
        """Initialize the embedding service."""
        self.embeddings_dir = EMBEDDINGS_DIR
        self.embedding_model_name = EMBEDDING_MODEL
        
        # Initialize the embedding model based on what's available and configured
        if USE_VERTEX_AI:
            logger.info("Using Vertex AI for embeddings")
            self.vertex_service = VertexAIService()
            self.use_vertex = True
        else:
            # Use sentence-transformers as fallback
            self.model = SentenceTransformer('all-MiniLM-L6-v2')
            logger.info("Using sentence-transformers embedding model")
            self.use_vertex = False
    
    def generate_embedding(self, text: str) -> np.ndarray:
        """
        Generate an embedding for text.
        
        Args:
            text: Text to generate embedding for
            
        Returns:
            Embedding vector as numpy array
        """
        if not text:
            logger.warning("Empty text provided for embedding")
            # Return zero vector with appropriate dimension
            dim = 768  # Default dimension for sentence-transformers or Vertex embeddings
            return np.zeros(dim)
        
        max_retries = 3
        backoff_factor = 2
        
        for attempt in range(max_retries):
            try:
                if self.use_vertex:
                    # Use Vertex AI
                    return self.vertex_service.generate_single_embedding(text)
                else:
                    # Use sentence-transformers
                    embedding = self.model.encode(text)
                
                return embedding
                
            except Exception as e:
                logger.warning(f"Error generating embedding (attempt {attempt+1}/{max_retries}): {str(e)}")
                if attempt < max_retries - 1:
                    sleep_time = backoff_factor ** attempt
                    logger.info(f"Retrying in {sleep_time} seconds...")
                    time.sleep(sleep_time)
                else:
                    logger.error(f"Failed to generate embedding after {max_retries} attempts")
                    # Return zero vector with appropriate dimension as fallback
                    dim = 768  # Default dimension for sentence-transformers or Vertex embeddings
                    return np.zeros(dim)
    
    def generate_embeddings_for_chunks(self, chunks: List[DocumentChunk], technology: Technology) -> Dict[str, np.ndarray]:
        """
        Generate embeddings for a list of document chunks.
        
        Args:
            chunks: List of document chunks to generate embeddings for
            technology: Technology the chunks are for
            
        Returns:
            Dictionary mapping chunk IDs to embeddings
        """
        embeddings = {}
        batch_size = RATE_LIMIT_BATCH_SIZE  # Process in small batches to avoid rate limits
        
        logger.info(f"Generating embeddings for {len(chunks)} chunks")
        
        # Collect texts for batch processing if using Vertex AI
        if self.use_vertex:
            texts = []
            chunk_ids = []
            
            for chunk in chunks:
                texts.append(chunk.content)
                chunk_ids.append(chunk.id)
            
            # Generate embeddings in batches
            for i in range(0, len(texts), batch_size):
                batch_texts = texts[i:i+batch_size]
                batch_ids = chunk_ids[i:i+batch_size]
                
                try:
                    batch_embeddings = self.vertex_service.generate_embeddings(batch_texts)
                    
                    # Map embeddings to chunk IDs
                    for j, chunk_id in enumerate(batch_ids):
                        if j < len(batch_embeddings):
                            embeddings[chunk_id] = batch_embeddings[j]
                    
                    # Small delay between batches if not the last batch
                    if i + batch_size < len(texts):
                        time.sleep(1)
                except Exception as e:
                    logger.error(f"Error generating batch embeddings: {str(e)}")
        else:
            # Process one at a time for sentence-transformers
            for i in range(0, len(chunks), batch_size):
                batch = chunks[i:i+batch_size]
                
                for chunk in batch:
                    try:
                        embedding = self.generate_embedding(chunk.content)
                        embeddings[chunk.id] = embedding
                        # Add a small delay to avoid rate limits
                        time.sleep(0.5)
                    except Exception as e:
                        logger.error(f"Error generating embedding for chunk {chunk.id}: {str(e)}")
        
        logger.info(f"Generated {len(embeddings)} embeddings")
        return embeddings
    
    def save_embeddings(self, embeddings: Dict[str, np.ndarray], technology: Technology, document_id: str) -> None:
        """
        Save embeddings to storage.
        
        Args:
            embeddings: Dictionary mapping chunk IDs to embeddings
            technology: Technology the embeddings are for
            document_id: ID of the document the embeddings are for
        """
        # Create directory structure
        tech_dir = self.embeddings_dir / technology.value
        tech_dir.mkdir(exist_ok=True)
        
        # Save embeddings
        embeddings_path = tech_dir / f"{document_id}-embeddings.pkl"
        with open(embeddings_path, 'wb') as f:
            pickle.dump(embeddings, f)
        
        # Save metadata
        metadata = {
            "document_id": document_id,
            "technology": technology.value,
            "embedding_model": self.embedding_model_name,
            "chunk_count": len(embeddings),
            "created_at": time.time()
        }
        
        metadata_path = tech_dir / f"{document_id}-embeddings-metadata.json"
        with open(metadata_path, 'w', encoding='utf-8') as f:
            json.dump(metadata, f, indent=2)
        
        logger.info(f"Saved {len(embeddings)} embeddings for document {document_id}")
    
    def load_embeddings(self, technology: Technology, document_id: Optional[str] = None) -> Dict[str, np.ndarray]:
        """
        Load embeddings from storage.
        
        Args:
            technology: Technology to load embeddings for
            document_id: Optional document ID to load specific embeddings
            
        Returns:
            Dictionary mapping chunk IDs to embeddings
        """
        tech_dir = self.embeddings_dir / technology.value
        
        if not tech_dir.exists():
            logger.warning(f"No embeddings directory for {technology.value}")
            return {}
        
        all_embeddings = {}
        
        # If document_id is provided, load only that document's embeddings
        if document_id:
            embeddings_path = tech_dir / f"{document_id}-embeddings.pkl"
            if not embeddings_path.exists():
                logger.warning(f"Embeddings not found for document {document_id}")
                return {}
                
            with open(embeddings_path, 'rb') as f:
                embeddings = pickle.load(f)
                all_embeddings.update(embeddings)
        
        # Otherwise, load all embeddings for the technology
        else:
            for embeddings_file in tech_dir.glob("*-embeddings.pkl"):
                with open(embeddings_file, 'rb') as f:
                    embeddings = pickle.load(f)
                    all_embeddings.update(embeddings)
        
        logger.info(f"Loaded {len(all_embeddings)} embeddings for {technology.value}")
        return all_embeddings
    
    def process_chunks_with_embeddings(self, chunks: List[DocumentChunk], technology: Technology) -> Dict[str, np.ndarray]:
        """
        Process chunks and generate embeddings.
        
        Args:
            chunks: List of document chunks to process
            technology: Technology the chunks are for
            
        Returns:
            Dictionary mapping chunk IDs to embeddings
        """
        if not chunks:
            logger.warning("No chunks to process for embeddings")
            return {}
        
        # Get document ID from first chunk
        document_id = chunks[0].document_id
        
        # Generate embeddings
        embeddings = self.generate_embeddings_for_chunks(chunks, technology)
        
        # Save embeddings
        self.save_embeddings(embeddings, technology, document_id)
        
        return embeddings