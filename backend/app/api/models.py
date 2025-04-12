"""
Data models for the DevSolver API.
"""
from datetime import datetime
from typing import List, Optional, Dict, Any, Union
from enum import Enum
from pydantic import BaseModel, Field, HttpUrl


class CodeSource(str, Enum):
    """Source of the code."""
    GITHUB = "github"
    FILE = "file"
    SNIPPET = "snippet"


class Technology(str, Enum):
    """Supported technologies."""
    PYTHON = "python"
    JAVASCRIPT = "javascript"
    TYPESCRIPT = "typescript"
    REACT = "react"
    NODE = "node"
    HTML = "html"
    CSS = "css"
    SQL = "sql"
    # Add more as needed


class ResponseSource(str, Enum):
    """Source of the response."""
    OFFICIAL = "official"
    COMMUNITY = "community"
    BOTH = "both"


class GithubRepo(BaseModel):
    """GitHub repository details."""
    owner: str
    repo: str
    branch: Optional[str] = "main"
    path: Optional[str] = None


class CodeRequest(BaseModel):
    """Request for code analysis."""
    source: CodeSource
    technology: Technology
    code_snippet: Optional[str] = None
    github_repo: Optional[GithubRepo] = None
    file_name: Optional[str] = None
    context: Optional[str] = Field(
        None, description="Additional context about the code or the issue"
    )
    query: str = Field(..., description="The question or request about the code")
    response_source_preference: ResponseSource = ResponseSource.BOTH


class DocumentSource(BaseModel):
    """Source of a document."""
    title: str
    url: Optional[HttpUrl] = None
    description: Optional[str] = None
    author: Optional[str] = None
    published_date: Optional[datetime] = None
    source_type: str = "official"  # 'official' or 'community'


class DocumentChunk(BaseModel):
    """Chunk of a document."""
    id: str
    content: str
    document_id: str
    metadata: Dict[str, Any] = {}


class SearchResult(BaseModel):
    """Result from a search."""
    document_chunk: DocumentChunk
    score: float
    source: DocumentSource


class CodeAnalysisResult(BaseModel):
    """Result of code analysis."""
    issues: List[Dict[str, Any]] = []
    suggestions: List[Dict[str, Any]] = []
    dependencies: List[str] = []
    complexity_score: Optional[float] = None
    analysis_details: Dict[str, Any] = {}


class SolutionResponse(BaseModel):
    """Solution response."""
    source_type: ResponseSource
    answer: str
    code_changes: Optional[str] = None
    references: List[SearchResult] = []
    confidence_score: float = 0.0


class QueryResponse(BaseModel):
    """Response to a query."""
    query: str
    official_solution: Optional[SolutionResponse] = None
    community_solution: Optional[SolutionResponse] = None
    code_analysis: Optional[CodeAnalysisResult] = None
    execution_time: float
    timestamp: datetime = Field(default_factory=datetime.now)