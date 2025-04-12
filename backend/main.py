"""
Main application file for DevSolver API.
"""
import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import time
import traceback

from app.api.routes import router as api_router
from app.core.logging_config import get_logger

logger = get_logger(__name__)

# Create FastAPI application
app = FastAPI(
    title="DevSolver API",
    description="API for code documentation assistance with RAG and grounding",
    version="0.1.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add request ID middleware
@app.middleware("http")
async def add_request_id(request: Request, call_next):
    """Add request ID and timing to each request."""
    request_id = str(int(time.time() * 1000))
    start_time = time.time()
    
    try:
        response = await call_next(request)
        
        # Calculate processing time
        process_time = time.time() - start_time
        response.headers["X-Process-Time"] = str(process_time)
        response.headers["X-Request-ID"] = request_id
        
        logger.info(
            f"Request {request_id} completed: {request.method} {request.url.path} "
            f"- {response.status_code} in {process_time:.3f}s"
        )
        
        return response
    except Exception as e:
        logger.error(
            f"Request {request_id} failed: {request.method} {request.url.path} - {str(e)}\n"
            f"{traceback.format_exc()}"
        )
        
        return JSONResponse(
            status_code=500,
            content={"detail": f"Internal Server Error: {str(e)}"}
        )

# Include API routes
app.include_router(api_router, prefix="/api/v1")

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "DevSolver API",
        "version": "0.1.0",
        "docs_url": "/docs",
        "api_url": "/api/v1"
    }

# Run the application
if __name__ == "__main__":
    import uvicorn
    
    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "0.0.0.0")
    
    logger.info(f"Starting DevSolver API on {host}:{port}")
    
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        log_level="info",
        reload=True
    )