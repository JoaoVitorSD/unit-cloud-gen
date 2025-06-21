import time
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Optional


@dataclass
class TestGenerationResult:
    """Result of test generation containing all required metrics."""
    tests: str
    tokens_used: int
    estimated_cost: float
    time_taken: float


class BaseLLMClient(ABC):
    """Abstract base class for all LLM clients."""
    
    def __init__(self, model: str):
        self.model = model
        self.start_time: Optional[float] = None
    
    @abstractmethod
    def generate_tests(self, prompt: str, temperature: float = 0.3) -> TestGenerationResult:
        """
        Generate unit tests based on the provided prompt.
        
        Args:
            prompt: The code or description to generate tests for
            temperature: Controls randomness in generation (0.0 to 1.0)
            
        Returns:
            TestGenerationResult containing tests, tokens, cost, and time
        """
        pass
    
    def _start_timer(self) -> None:
        """Start timing for generation."""
        self.start_time = time.time()
    
    def _get_elapsed_time(self) -> float:
        """Get elapsed time since timer started."""
        if self.start_time is None:
            return 0.0
        return time.time() - self.start_time
    
    @abstractmethod
    def _estimate_tokens(self, text: str) -> int:
        """Estimate the number of tokens in the given text."""
        pass
    
    @abstractmethod
    def _calculate_cost(self, tokens: int) -> float:
        """Calculate the estimated cost based on token count."""
        pass 