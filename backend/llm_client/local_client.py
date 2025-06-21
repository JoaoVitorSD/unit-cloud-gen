import time
from typing import Any, Dict

try:
    import requests  # type: ignore
except ImportError:
    requests = None  # type: ignore

from .base_client import BaseLLMClient, TestGenerationResult


class LocalClient(BaseLLMClient):
    """Local LLM client implementation (e.g., Ollama)."""
    
    def __init__(self, base_url: str = "http://localhost:11434/api/generate", model: str = "llama3"):
        super().__init__(model)
        self.base_url = base_url
        # Local models typically have no cost
        self.cost_per_token = 0.0
    
    def generate_tests(self, prompt: str, temperature: float = 0.3) -> TestGenerationResult:
        """Generate unit tests using local LLM API."""
        if requests is None:
            return TestGenerationResult(
                tests="Error: requests library not available. Please install it with: pip install requests",
                tokens_used=0,
                estimated_cost=0.0,
                time_taken=0.0
            )
        
        self._start_timer()
        
        try:
            payload = {
                "model": self.model,
                "prompt": prompt,
                "temperature": temperature,
                "stream": False
            }
            
            response = requests.post(self.base_url, json=payload)
            response.raise_for_status()
            
            response_data = response.json()
            tests = response_data.get("response", "").strip()
            
            # Calculate metrics
            tokens_used = self._estimate_tokens(prompt + tests)
            estimated_cost = self._calculate_cost(tokens_used)
            time_taken = self._get_elapsed_time()
            
            return TestGenerationResult(
                tests=tests,
                tokens_used=tokens_used,
                estimated_cost=estimated_cost,
                time_taken=time_taken
            )
            
        except Exception as e:
            time_taken = self._get_elapsed_time()
            return TestGenerationResult(
                tests=f"Error generating tests: {str(e)}",
                tokens_used=0,
                estimated_cost=0.0,
                time_taken=time_taken
            )
    
    def _estimate_tokens(self, text: str) -> int:
        """Estimate tokens using a simple approximation (4 chars ≈ 1 token)."""
        return len(text) // 4
    
    def _calculate_cost(self, tokens: int) -> float:
        """Calculate cost for local models (typically free)."""
        return self.cost_per_token * tokens
    
    def generate(self, prompt: str, temperature: float = 0.3) -> str:
        """Legacy method for backward compatibility."""
        result = self.generate_tests(prompt, temperature)
        return result.tests
