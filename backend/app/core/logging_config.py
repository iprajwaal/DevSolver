"""
Logging configuration for the DevSolver application.
"""
import logging
import sys
from pathlib import Path
from logging.handlers import RotatingFileHandler

from app.core.config import BASE_DIR

# Create logs directory
LOGS_DIR = BASE_DIR / "logs"
LOGS_DIR.mkdir(exist_ok=True)

# Log file path
LOG_FILE = LOGS_DIR / "app.log"

# Formatter
log_formatter = logging.Formatter(
    "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)

# File handler with rotation
file_handler = RotatingFileHandler(
    LOG_FILE,
    maxBytes=10485760,  # 10MB
    backupCount=5,
    encoding="utf-8"
)
file_handler.setFormatter(log_formatter)
file_handler.setLevel(logging.INFO)

# Console handler
console_handler = logging.StreamHandler(sys.stdout)
console_handler.setFormatter(log_formatter)
console_handler.setLevel(logging.INFO)

# Configure root logger
root_logger = logging.getLogger()
root_logger.setLevel(logging.INFO)
root_logger.addHandler(file_handler)
root_logger.addHandler(console_handler)

def get_logger(name):
    """
    Get a configured logger for the specified name.
    
    Args:
        name: The name for the logger
        
    Returns:
        A configured logger instance
    """
    logger = logging.getLogger(name)
    return logger