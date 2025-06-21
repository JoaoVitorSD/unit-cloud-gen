import time
from typing import Any, Dict

try:
    import requests  # type: ignore
except ImportError:
    requests = None  # type: ignore

from .base_client import BaseLLMClient, TestGenerationResult


class LocalClient(BaseLLMClient):
    """Local LLM client implementation for Meta open source models via Ollama."""
    
    # Available Meta models for Ollama
    AVAILABLE_MODELS = {
        "codellama": {
            "name": "Code Llama",
            "description": "Code-specialized model (recommended)",
            "size": "7B-34B",
            "pricing": {"input": 0.0, "output": 0.0}
        },
        "codellama:7b": {
            "name": "Code Llama 7B",
            "description": "Smaller, faster code model",
            "size": "7B",
            "pricing": {"input": 0.0, "output": 0.0}
        },
        "codellama:13b": {
            "name": "Code Llama 13B",
            "description": "Balanced code model",
            "size": "13B",
            "pricing": {"input": 0.0, "output": 0.0}
        },
        "codellama:34b": {
            "name": "Code Llama 34B",
            "description": "Largest, most capable code model",
            "size": "34B",
            "pricing": {"input": 0.0, "output": 0.0}
        },
        "llama2": {
            "name": "Llama 2",
            "description": "General purpose model",
            "size": "7B-70B",
            "pricing": {"input": 0.0, "output": 0.0}
        },
        "llama2:7b": {
            "name": "Llama 2 7B",
            "description": "Smaller, faster model",
            "size": "7B",
            "pricing": {"input": 0.0, "output": 0.0}
        },
        "llama2:13b": {
            "name": "Llama 2 13B",
            "description": "Larger, more capable model",
            "size": "13B",
            "pricing": {"input": 0.0, "output": 0.0}
        },
        "llama2:70b": {
            "name": "Llama 2 70B",
            "description": "Largest, most capable model",
            "size": "70B",
            "pricing": {"input": 0.0, "output": 0.0}
        }
    }
    
    def __init__(self, base_url: str = "http://localhost:11434/api/generate", model: str = "codellama"):
        super().__init__(model)
        self.base_url = base_url
        # Local models typically have no cost
        self.cost_per_token = 0.0
        
        # Validate model
        if model not in self.AVAILABLE_MODELS:
            print(f"Warning: Model '{model}' not in known Meta models. Available: {list(self.AVAILABLE_MODELS.keys())}")
    
    def generate_tests(self, prompt: str, temperature: float = 0.3) -> TestGenerationResult:
        """Generate unit tests using Meta open source model via Ollama."""
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
                "stream": False,
                "top_p": 0.9,
                "top_k": 40,
                "repeat_penalty": 1.1
            }
            
            response = requests.post(self.base_url, json=payload, timeout=120)
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
            
        except requests.exceptions.Timeout:
            time_taken = self._get_elapsed_time()
            return TestGenerationResult(
                tests="Error: Request timed out. The model may be too large or the server is overloaded.",
                tokens_used=0,
                estimated_cost=0.0,
                time_taken=time_taken
            )
        except requests.exceptions.ConnectionError:
            time_taken = self._get_elapsed_time()
            return TestGenerationResult(
                tests="Error: Cannot connect to Ollama server. Make sure Ollama is running with: ollama serve",
                tokens_used=0,
                estimated_cost=0.0,
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
    
    @classmethod
    def get_available_models(cls) -> dict:
        """Get list of available Meta models."""
        return cls.AVAILABLE_MODELS.copy()
