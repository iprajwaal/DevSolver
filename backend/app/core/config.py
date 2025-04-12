"""
Core configuration settings for the DevSolver application.
"""
import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Base directories
BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR / "data"
DOCUMENTATION_DIR = DATA_DIR / "documentation"
EMBEDDINGS_DIR = DATA_DIR / "embeddings"

# Create directories if they don't exist
DOCUMENTATION_DIR.mkdir(parents=True, exist_ok=True)
EMBEDDINGS_DIR.mkdir(parents=True, exist_ok=True)

# API Keys and credentials
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
GITHUB_ACCESS_TOKEN = os.getenv("GITHUB_ACCESS_TOKEN", "")
# Vertex AI configurations
GOOGLE_APPLICATION_CREDENTIALS = os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "")
GOOGLE_CLOUD_PROJECT = os.getenv("GOOGLE_CLOUD_PROJECT", "")
GOOGLE_CLOUD_REGION = os.getenv("GOOGLE_CLOUD_REGION", "us-central1")

# Model settings
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "text-embedding-3-small")
COMPLETION_MODEL = os.getenv("COMPLETION_MODEL", "gpt-3.5-turbo")
# Vertex AI model settings
USE_VERTEX_AI = os.getenv("USE_VERTEX_AI", "True").lower() == "true"
VERTEX_MODEL = os.getenv("VERTEX_MODEL", "gemini-2.0-flash")
VERTEX_EMBEDDING_MODEL = os.getenv("VERTEX_EMBEDDING_MODEL", "text-embedding-005")

# Rate limiting settings
RATE_LIMIT_CALLS = int(os.getenv("RATE_LIMIT_CALLS", "60"))  # Calls per minute
RATE_LIMIT_BATCH_SIZE = int(os.getenv("RATE_LIMIT_BATCH_SIZE", "3"))  # Max batch size
RATE_LIMIT_COOLDOWN = float(os.getenv("RATE_LIMIT_COOLDOWN", "1.0"))  # Seconds between calls

# Retrieval settings
TOP_K_RETRIEVAL = int(os.getenv("TOP_K_RETRIEVAL", "5"))
CHUNK_SIZE = int(os.getenv("CHUNK_SIZE", "1000"))
CHUNK_OVERLAP = int(os.getenv("CHUNK_OVERLAP", "200"))

# Grounding settings
USE_WEB_GROUNDING = os.getenv("USE_WEB_GROUNDING", "True").lower() == "true"
SEMANTIC_WEIGHT = float(os.getenv("SEMANTIC_WEIGHT", "0.7"))

# Supported languages/frameworks for documentation
SUPPORTED_TECHNOLOGIES = {
    "python": ["python", "pandas", "numpy", "pytest", "django", "flask", "fastapi"],
    "javascript": ["javascript", "typescript", "react", "node", "express", "next.js", "vue"],
    "web": ["html", "css", "dom", "web-api"],
    "data": ["sql", "mongodb", "postgresql"],
    "general": ["git", "docker", "aws", "linux"]
}

# Sources for documentation
DOCUMENTATION_SOURCES = {
    "official": {
        "python": "https://docs.python.org/3/",
        "react": "https://reactjs.org/docs/",
        "javascript": "https://developer.mozilla.org/en-US/docs/Web/JavaScript",
        # Add more as needed
    },
    "community": {
        "stackoverflow": "https://stackoverflow.com/",
        "github_discussions": "https://github.com/",
        # Add more as needed
    }
}