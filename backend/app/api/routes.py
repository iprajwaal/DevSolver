"""
API routes for the DevSolver application.
"""
import time
from typing import Dict, List, Any, Optional
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends, BackgroundTasks
from fastapi.responses import JSONResponse
from pydantic import ValidationError

from app.api.models import (
    CodeRequest, 
    QueryResponse, 
    Technology, 
    CodeSource,
    ResponseSource,
    CodeAnalysisResult
)
from app.core.logging_config import get_logger
from app.services.document_service import DocumentService
from app.services.embedding_service import EmbeddingService
from app.services.retrieval_service import RetrievalService
from app.services.code_service import CodeService

logger = get_logger(__name__)

router = APIRouter()

# Initialize services
document_service = DocumentService()
embedding_service = EmbeddingService()
retrieval_service = RetrievalService(document_service, embedding_service)
code_service = CodeService()


@router.post("/query", response_model=QueryResponse)
async def query_code(code_request: CodeRequest):
    """
    Query the system with code and a question.
    
    Args:
        code_request: Request containing code and query
    
    Returns:
        Response with official and community solutions
    """
    try:
        logger.info(f"Received query request: {code_request.query}")
        start_time = time.time()
        
        # Process code from source
        code, generated_context = code_service.process_code_from_source(
            source=code_request.source,
            technology=code_request.technology,
            code_snippet=code_request.code_snippet,
            github_repo=code_request.github_repo
        )
        
        # Use provided context if available, otherwise use generated
        context = code_request.context if code_request.context else generated_context
        
        # Analyze code
        code_analysis = code_service.analyze_code(code, code_request.technology)
        
        # Perform RAG with grounding
        official_solution, community_solution = retrieval_service.rag_with_grounding(
            query=code_request.query,
            technology=code_request.technology,
            code_context=context,
            response_source_preference=code_request.response_source_preference
        )
        
        # Calculate execution time
        execution_time = time.time() - start_time
        
        # Create response
        response = QueryResponse(
            query=code_request.query,
            official_solution=official_solution,
            community_solution=community_solution,
            code_analysis=code_analysis,
            execution_time=execution_time
        )
        
        logger.info(f"Query completed in {execution_time:.2f} seconds")
        return response
        
    except Exception as e:
        logger.error(f"Error processing query: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing query: {str(e)}")


@router.post("/upload-file")
async def upload_file(
    file: UploadFile = File(...),
    technology: Technology = Form(...),
    query: Optional[str] = Form(None)
):
    """
    Upload a code file for analysis.
    
    Args:
        file: Uploaded file
        technology: Technology the code is in
        query: Optional initial query
    
    Returns:
        Response with file information and initial analysis
    """
    try:
        logger.info(f"File upload: {file.filename}, technology: {technology.value}")
        
        # Read file content
        contents = await file.read()
        code = contents.decode("utf-8")
        
        # Generate context
        context = code_service.get_code_context(code, technology)
        
        # Analyze code
        code_analysis = code_service.analyze_code(code, technology)
        
        # Prepare response
        response_data = {
            "filename": file.filename,
            "size": len(contents),
            "technology": technology.value,
            "context": context,
            "analysis": code_analysis.dict()
        }
        
        # Add initial query response if provided
        if query:
            official_solution, community_solution = retrieval_service.rag_with_grounding(
                query=query,
                technology=technology,
                code_context=context,
                response_source_preference=ResponseSource.BOTH
            )
            
            response_data["initial_query"] = {
                "query": query,
                "official_solution": official_solution.dict() if official_solution else None,
                "community_solution": community_solution.dict() if community_solution else None
            }
        
        logger.info(f"File processed successfully: {file.filename}")
        return JSONResponse(content=response_data)
        
    except Exception as e:
        logger.error(f"Error processing file upload: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")


@router.get("/technologies")
async def get_technologies():
    """
    Get list of supported technologies.
    
    Returns:
        A list of technology names supported by the system.
    """
    try:
        supported_technologies = [tech.value for tech in Technology]  # Assuming Technology is an Enum
        return {"technologies": supported_technologies}
    except Exception as e:
        logger.error(f"Error fetching technologies: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch technologies.")


@router.post("/fetch-documentation", status_code=202)
async def fetch_documentation(
    background_tasks: BackgroundTasks,
    technology: Technology,
    source_url: str
):
    """
    Fetch and process documentation in the background.
    
    Args:
        background_tasks: Background tasks manager
        technology: Technology to fetch documentation for
        source_url: URL to fetch documentation from
    
    Returns:
        Confirmation of background task initiation
    """
    
    def process_documentation():
        try:
            logger.info(f"Processing documentation for {technology.value} from {source_url}")
            
            # Fetch and process documentation
            chunks = document_service.process_documentation(technology, source_url)
            
            # Generate embeddings
            if chunks:
                embedding_service.process_chunks_with_embeddings(chunks, technology)
                
            logger.info(f"Documentation processing completed for {technology.value}")
        except Exception as e:
            logger.error(f"Error in background documentation processing: {str(e)}")
    
    # Add processing task to background
    background_tasks.add_task(process_documentation)
    
    return {
        "message": f"Documentation processing initiated for {technology.value}",
        "status": "processing"
    }


@router.get("/health")
async def health_check():
    """
    Health check endpoint.
    
    Returns:
        Health status
    """
    return {
        "status": "healthy",
        "services": {
            "document_service": "operational",
            "embedding_service": "operational",
            "retrieval_service": "operational",
            "code_service": "operational"
        }
    }