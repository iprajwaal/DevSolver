"""
Rate limiter utility for API calls.
"""
import time
import threading
from collections import deque
from functools import wraps
from typing import Callable, Any, Deque, Dict, Optional

from app.core.config import RATE_LIMIT_CALLS, RATE_LIMIT_COOLDOWN
from app.core.logging_config import get_logger

logger = get_logger(__name__)


class RateLimiter:
    """
    Rate limiter for API calls to prevent hitting rate limits.
    Uses a token bucket algorithm with a sliding window.
    """
    
    def __init__(self, calls_per_minute: int = RATE_LIMIT_CALLS, cooldown: float = RATE_LIMIT_COOLDOWN):
        """
        Initialize the rate limiter.
        
        Args:
            calls_per_minute: Maximum number of calls allowed per minute
            cooldown: Minimum time between calls in seconds
        """
        self.calls_per_minute = calls_per_minute
        self.cooldown = cooldown
        self.timestamps: Deque[float] = deque(maxlen=calls_per_minute)
        self.lock = threading.Lock()
        self.last_call_time = 0.0
        
        logger.info(f"Rate limiter initialized: {calls_per_minute} calls/minute, {cooldown}s cooldown")
    
    def _can_make_call(self) -> bool:
        """
        Check if a call can be made without exceeding the rate limit.
        
        Returns:
            True if call is allowed, False otherwise
        """
        current_time = time.time()
        
        # Enforce minimum cooldown between calls
        if current_time - self.last_call_time < self.cooldown:
            return False
        
        # Remove timestamps older than 1 minute
        one_minute_ago = current_time - 60
        while self.timestamps and self.timestamps[0] < one_minute_ago:
            self.timestamps.popleft()
        
        # Check if we're under the rate limit
        return len(self.timestamps) < self.calls_per_minute
    
    def wait_if_needed(self) -> float:
        """
        Wait if needed to comply with rate limits.
        
        Returns:
            Time waited in seconds
        """
        with self.lock:
            current_time = time.time()
            
            # First check cooldown
            time_since_last_call = current_time - self.last_call_time
            if time_since_last_call < self.cooldown:
                cooldown_wait = self.cooldown - time_since_last_call
                time.sleep(cooldown_wait)
                current_time = time.time()
            
            # Then check rate limit window
            one_minute_ago = current_time - 60
            
            # Remove timestamps older than 1 minute
            while self.timestamps and self.timestamps[0] < one_minute_ago:
                self.timestamps.popleft()
            
            # If we're at the rate limit, wait until we can make another call
            if len(self.timestamps) >= self.calls_per_minute:
                # Calculate wait time until the oldest timestamp is outside the window
                wait_time = self.timestamps[0] - one_minute_ago + 0.1  # Add a small buffer
                logger.warning(f"Rate limit reached. Waiting {wait_time:.2f}s")
                time.sleep(wait_time)
                
                # Recalculate after waiting
                current_time = time.time()
                one_minute_ago = current_time - 60
                
                # Remove timestamps older than 1 minute
                while self.timestamps and self.timestamps[0] < one_minute_ago:
                    self.timestamps.popleft()
            
            # Record this call
            self.timestamps.append(current_time)
            self.last_call_time = current_time
            
            return current_time - self.last_call_time
    
    def __call__(self, func: Callable) -> Callable:
        """
        Decorator for rate-limited function calls.
        
        Args:
            func: Function to rate limit
            
        Returns:
            Wrapped function with rate limiting
        """
        @wraps(func)
        def wrapper(*args, **kwargs):
            wait_time = self.wait_if_needed()
            if wait_time > 0.1:  # Only log if we actually waited
                logger.info(f"Rate limiter waited {wait_time:.2f}s before call to {func.__name__}")
            return func(*args, **kwargs)
        
        return wrapper


# Create singleton instances for different APIs
llm_rate_limiter = RateLimiter()
embedding_rate_limiter = RateLimiter()


def rate_limited(limiter: Optional[RateLimiter] = None) -> Callable:
    """
    Decorator factory for rate-limited function calls.
    
    Args:
        limiter: Rate limiter to use (defaults to llm_rate_limiter)
        
    Returns:
        Decorator function
    """
    _limiter = limiter or llm_rate_limiter
    
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            wait_time = _limiter.wait_if_needed()
            if wait_time > 0.1:  # Only log if we actually waited
                logger.info(f"Rate limiter waited {wait_time:.2f}s before call to {func.__name__}")
            return func(*args, **kwargs)
        
        return wrapper
    
    return decorator