"""
Service for Google Cloud Vertex AI integrations.
"""
import os
import json
import time
from typing import List, Dict, Any, Optional, Union

import numpy as np
from google.cloud import aiplatform
from vertexai.generative_models import GenerativeModel
from vertexai.language_models import TextEmbeddingModel

from app.core.config import (
    GOOGLE_CLOUD_PROJECT,
    GOOGLE_CLOUD_REGION,
    GOOGLE_APPLICATION_CREDENTIALS,
    VERTEX_MODEL,
    VERTEX_EMBEDDING_MODEL,
    RATE_LIMIT_BATCH_SIZE
)
from app.core.logging_config import get_logger
from app.utils.rate_limiter import rate_limited, llm_rate_limiter, embedding_rate_limiter

logger = get_logger(__name__)

# Set up credentials
if GOOGLE_APPLICATION_CREDENTIALS:
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = GOOGLE_APPLICATION_CREDENTIALS

# Initialize Vertex AI
try:
    aiplatform.init(project=GOOGLE_CLOUD_PROJECT, location=GOOGLE_CLOUD_REGION)
    logger.info(f"Initialized Vertex AI client: project={GOOGLE_CLOUD_PROJECT}, region={GOOGLE_CLOUD_REGION}")
except Exception as e:
    logger.error(f"Error initializing Vertex AI: {e}")


class VertexAIService:
    """Service for Google Cloud Vertex AI operations."""
    
    def __init__(self):
        """Initialize the Vertex AI service."""
        try:
            self.text_model = GenerativeModel(model_name=VERTEX_MODEL)
            self.embedding_model = TextEmbeddingModel.from_pretrained(VERTEX_EMBEDDING_MODEL)
            logger.info(f"Initialized Vertex AI models: {VERTEX_MODEL}, {VERTEX_EMBEDDING_MODEL}")
        except Exception as e:
            logger.error(f"Error initializing Vertex AI models: {e}")
            self.text_model = None
            self.embedding_model = None
    
    @rate_limited(llm_rate_limiter)
    def generate_text(
        self,
        prompt: str,
        temperature: float = 0.1,
        max_output_tokens: int = 1024,
        top_p: float = 0.95,
        top_k: int = 40
    ) -> str:
        """
        Generate text using Vertex AI.
        
        Args:
            prompt: Prompt to generate from
            temperature: Sampling temperature
            max_output_tokens: Maximum tokens to generate
            top_p: Top-p sampling parameter
            top_k: Top-k sampling parameter
            
        Returns:
            Generated text
        """
        if not self.text_model:
            logger.error("Vertex AI text model not initialized")
            return "Error: Vertex AI text model not initialized"
        
        try:
            logger.info(f"Generating text with Vertex AI: prompt length={len(prompt)}")
            
            # Generate content
            response = self.text_model.generate_content(
                prompt,
                generation_config={
                    "temperature": temperature,
                    "max_output_tokens": max_output_tokens,
                    "top_p": top_p,
                    "top_k": top_k
                }
            )
            
            # Extract text from response
            text = response.text
            logger.info(f"Generated {len(text)} characters")
            
            return text
        except Exception as e:
            logger.error(f"Error generating text: {e}")
            
            # Check for quota/rate limit errors and retry with backoff
            if "quota" in str(e).lower() or "rate" in str(e).lower():
                logger.warning("Rate limit hit, applying extended cooldown")
                time.sleep(5)  # Extended cooldown
                
                try:
                    # Retry with lower temperature
                    logger.info("Retrying with lower temperature and token count")
                    response = self.text_model.generate_content(
                        prompt,
                        generation_config={
                            "temperature": 0.0,
                            "max_output_tokens": min(1024, max_output_tokens),
                            "top_p": 0.85,
                            "top_k": 20
                        }
                    )
                    return response.text
                except Exception as retry_error:
                    logger.error(f"Error in retry: {retry_error}")
            
            return f"Error generating text: {str(e)}"
    
    @rate_limited(embedding_rate_limiter)
    def generate_embeddings(self, texts: List[str]) -> List[np.ndarray]:
        """
        Generate embeddings for texts.
        
        Args:
            texts: List of texts to generate embeddings for
            
        Returns:
            List of embedding arrays
        """
        if not self.embedding_model:
            logger.error("Vertex AI embedding model not initialized")
            return [np.zeros(768) for _ in texts]  # Return zero vectors
        
        try:
            # Process in small batches to avoid rate limits
            results = []
            for i in range(0, len(texts), RATE_LIMIT_BATCH_SIZE):
                batch = texts[i:i+RATE_LIMIT_BATCH_SIZE]
                
                logger.info(f"Generating embeddings batch {i//RATE_LIMIT_BATCH_SIZE + 1}: {len(batch)} texts")
                
                # Generate embeddings
                embeddings = self.embedding_model.get_embeddings(batch)
                
                # Extract embeddings from response
                for embedding in embeddings:
                    results.append(np.array(embedding.values))
                
                # Don't add delay for the last batch
                if i + RATE_LIMIT_BATCH_SIZE < len(texts):
                    time.sleep(1)  # Small delay between batches
            
            logger.info(f"Generated {len(results)} embeddings")
            return results
            
        except Exception as e:
            logger.error(f"Error generating embeddings: {e}")
            
            # Return zero vectors in case of error
            return [np.zeros(768) for _ in texts]
    
    @rate_limited(embedding_rate_limiter)
    def generate_single_embedding(self, text: str) -> np.ndarray:
        """
        Generate embedding for a single text.
        
        Args:
            text: Text to generate embedding for
            
        Returns:
            Embedding array
        """
        if not self.embedding_model:
            logger.error("Vertex AI embedding model not initialized")
            return np.zeros(768)  # Return zero vector
        
        try:
            logger.info(f"Generating single embedding: text length={len(text)}")
            
            # Generate embedding
            embeddings = self.embedding_model.get_embeddings([text])
            
            # Extract embedding from response
            embedding = np.array(embeddings[0].values)
            
            return embedding
            
        except Exception as e:
            logger.error(f"Error generating single embedding: {e}")
            
            # Return zero vector in case of error
            return np.zeros(768)