"""
Service for handling documentation.
"""
import re
import uuid
import json
import requests
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime
from bs4 import BeautifulSoup
import markdown

from app.core.config import DOCUMENTATION_DIR, CHUNK_SIZE, CHUNK_OVERLAP
from app.core.logging_config import get_logger
from app.api.models import DocumentChunk, DocumentSource, Technology

logger = get_logger(__name__)


class DocumentService:
    """Service for managing documentation."""

    def __init__(self):
        """Initialize the document service."""
        self.documentation_dir = DOCUMENTATION_DIR
        self.chunk_size = CHUNK_SIZE
        self.chunk_overlap = CHUNK_OVERLAP

    def fetch_documentation(self, technology: Technology, source_url: str) -> Tuple[str, DocumentSource]:
        """
        Fetch documentation from a URL.
        
        Args:
            technology: Technology the documentation is for
            source_url: URL to fetch documentation from
            
        Returns:
            Tuple of document content and source information
        """
        logger.info(f"Fetching documentation from {source_url}")
        
        try:
            response = requests.get(source_url, timeout=30)
            response.raise_for_status()
            
            # Create source metadata
            source = DocumentSource(
                title=f"{technology.value.capitalize()} Documentation",
                url=source_url,
                description=f"Official documentation for {technology.value}",
                source_type="official"
            )
            
            # Extract content from HTML
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Remove script and style elements
            for script in soup(["script", "style", "header", "footer", "nav"]):
                script.extract()
                
            # Get text content
            content = soup.get_text(separator='\n')
            
            # Clean up whitespace
            content = re.sub(r'\n+', '\n', content)
            content = re.sub(r' +', ' ', content)
            
            logger.info(f"Successfully fetched documentation ({len(content)} characters)")
            return content, source
            
        except Exception as e:
            logger.error(f"Error fetching documentation: {str(e)}")
            # Return empty content with error in source description
            source = DocumentSource(
                title=f"{technology.value.capitalize()} Documentation",
                url=source_url,
                description=f"Error fetching documentation: {str(e)}",
                source_type="official"
            )
            return "", source

    def fetch_community_content(self, technology: Technology, query: str, source: str = "stackoverflow") -> Tuple[str, DocumentSource]:
        """
        Fetch community content related to a technology and query.
        
        Args:
            technology: Technology to search for
            query: Query to search for
            source: Source to search (e.g., "stackoverflow")
            
        Returns:
            Tuple of content and source information
        """
        logger.info(f"Fetching community content for {technology.value} - {query} from {source}")
        
        # For now, we'll implement a simple stub that could be expanded later
        # In a production system, this would use Stack Exchange API or similar
        
        # Create source metadata
        source_info = DocumentSource(
            title=f"{technology.value.capitalize()} Community Solutions - {query}",
            url=f"https://stackoverflow.com/questions/tagged/{technology.value}",
            description=f"Community solutions for {technology.value} - {query}",
            source_type="community",
            published_date=datetime.now()
        )
        
        # For demo purposes, return a placeholder
        content = f"""
        # Community Solutions for {technology.value} - {query}
        
        This is a placeholder for community content that would be fetched from {source}.
        In a production system, this would contain actual discussions, answers, and code
        examples from developer communities related to {technology.value} and "{query}".
        
        The real implementation would use the Stack Exchange API, GitHub Discussions,
        or other community sources to fetch relevant content.
        """
        
        return content, source_info

    def chunk_document(self, content: str, document_id: str) -> List[DocumentChunk]:
        """
        Split a document into chunks for better retrieval.
        
        Args:
            content: Document content to chunk
            document_id: ID of the document
            
        Returns:
            List of document chunks
        """
        if not content:
            logger.warning(f"Empty content for document {document_id}, no chunks created")
            return []
            
        chunks = []
        start = 0
        
        while start < len(content):
            end = min(start + self.chunk_size, len(content))
            
            # Try to end at a paragraph or sentence boundary
            if end < len(content):
                # Look for paragraph break
                paragraph_end = content.rfind("\n\n", start, end)
                if paragraph_end > start + self.chunk_size // 2:
                    end = paragraph_end + 2
                else:
                    # Look for sentence break
                    sentence_end = max(
                        content.rfind(". ", start, end),
                        content.rfind("! ", start, end),
                        content.rfind("? ", start, end)
                    )
                    if sentence_end > start + self.chunk_size // 2:
                        end = sentence_end + 2
            
            # Create chunk document
            chunk_id = f"{document_id}-chunk-{len(chunks)}"
            chunk_content = content[start:end]
            
            chunk = DocumentChunk(
                id=chunk_id,
                content=chunk_content,
                document_id=document_id,
                metadata={"chunk_index": len(chunks)}
            )
            
            chunks.append(chunk)
            
            # Move start position for next chunk, with overlap
            start = end - self.chunk_overlap
            
            # Avoid tiny chunks at the end
            if start + self.chunk_size // 2 >= len(content):
                break
        
        logger.info(f"Created {len(chunks)} chunks for document {document_id}")
        return chunks

    def save_document_chunks(self, chunks: List[DocumentChunk], technology: Technology, source_info: DocumentSource) -> None:
        """
        Save document chunks to storage.
        
        Args:
            chunks: List of document chunks to save
            technology: Technology the documentation is for
            source_info: Source information for the document
        """
        if not chunks:
            logger.warning("No chunks to save")
            return
            
        # Create directory for technology if it doesn't exist
        tech_dir = self.documentation_dir / technology.value
        tech_dir.mkdir(exist_ok=True)
        
        # Generate document ID based on source title
        document_id = chunks[0].document_id
        
        # Save document metadata
        metadata = {
            "document_id": document_id,
            "technology": technology.value,
            "source": source_info.dict(),
            "chunk_count": len(chunks),
            "created_at": datetime.now().isoformat()
        }
        
        metadata_path = tech_dir / f"{document_id}-metadata.json"
        with open(metadata_path, 'w', encoding='utf-8') as f:
            json.dump(metadata, f, indent=2, default=str)
        
        # Save chunks
        chunks_dir = tech_dir / document_id
        chunks_dir.mkdir(exist_ok=True)
        
        for chunk in chunks:
            chunk_path = chunks_dir / f"{chunk.id}.json"
            with open(chunk_path, 'w', encoding='utf-8') as f:
                json.dump(chunk.dict(), f, indent=2, default=str)
        
        logger.info(f"Saved {len(chunks)} chunks for document {document_id}")

    def load_document_chunks(self, technology: Technology, document_id: Optional[str] = None) -> List[DocumentChunk]:
        """
        Load document chunks from storage.
        
        Args:
            technology: Technology to load documentation for
            document_id: Optional document ID to load specific document
            
        Returns:
            List of document chunks
        """
        tech_dir = self.documentation_dir / technology.value
        
        if not tech_dir.exists():
            logger.warning(f"No documentation directory for {technology.value}")
            return []
        
        chunks = []
        
        # If document_id is provided, load only that document
        if document_id:
            chunks_dir = tech_dir / document_id
            if not chunks_dir.exists():
                logger.warning(f"Document {document_id} not found")
                return []
                
            for chunk_file in chunks_dir.glob("*.json"):
                with open(chunk_file, 'r', encoding='utf-8') as f:
                    chunk_data = json.load(f)
                    chunks.append(DocumentChunk(**chunk_data))
        
        # Otherwise, load all documents for the technology
        else:
            # Get all document IDs from metadata files
            for metadata_file in tech_dir.glob("*-metadata.json"):
                with open(metadata_file, 'r', encoding='utf-8') as f:
                    metadata = json.load(f)
                    doc_id = metadata["document_id"]
                    
                    # Load chunks for this document
                    chunks_dir = tech_dir / doc_id
                    if chunks_dir.exists():
                        for chunk_file in chunks_dir.glob("*.json"):
                            with open(chunk_file, 'r', encoding='utf-8') as f:
                                chunk_data = json.load(f)
                                chunks.append(DocumentChunk(**chunk_data))
        
        logger.info(f"Loaded {len(chunks)} chunks for {technology.value}")
        return chunks

    def process_documentation(self, technology: Technology, source_url: str) -> List[DocumentChunk]:
        """
        Fetch, process and save documentation.
        
        Args:
            technology: Technology to process documentation for
            source_url: URL to fetch documentation from
            
        Returns:
            List of processed document chunks
        """
        # Fetch documentation
        content, source_info = self.fetch_documentation(technology, source_url)
        
        if not content:
            logger.warning(f"No content fetched for {technology.value} from {source_url}")
            return []
        
        # Generate document ID
        document_id = f"{technology.value}-{uuid.uuid4()}"
        
        # Chunk document
        chunks = self.chunk_document(content, document_id)
        
        # Save chunks
        self.save_document_chunks(chunks, technology, source_info)
        
        return chunks