import os
from typing import Optional

import openai
from dotenv import load_dotenv

from .base_client import BaseLLMClient, TestGenerationResult

load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")


class OpenAIClient(BaseLLMClient):
    """OpenAI implementation of the LLM client."""
    
    # Token pricing per 1K tokens (approximate rates for GPT-4)
    PRICING = {
        "gpt-4": {"input": 0.03, "output": 0.06},
        "gpt-4-turbo": {"input": 0.01, "output": 0.03},
        "gpt-3.5-turbo": {"input": 0.001, "output": 0.002},
    }
    
    def __init__(self, model: str = "gpt-4"):
        super().__init__(model)
    
    def generate_tests(self, prompt: str, temperature: float = 0.3) -> TestGenerationResult:
        """Generate unit tests using OpenAI's API."""
        self._start_timer()
        
        try:
            response = openai.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "Return only the test code — no explanations, no markdown, no triple backticks."},
                    {"role": "user", "content": prompt}
                ],
                temperature=temperature
            )
            
            # Extract the generated content
            content = response.choices[0].message.content
            if content is None:
                content = ""
            
            tests = content.strip()
            
            # Get token usage from response
            usage = response.usage
            if usage:
                tokens_used = usage.total_tokens
            else:
                # Fallback to estimation if usage not available
                tokens_used = self._estimate_tokens(prompt + tests)
            
            # Calculate cost and time
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
            # Return error information in case of failure
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
        """Calculate cost based on model pricing."""
        if self.model not in self.PRICING:
            # Default to GPT-4 pricing if model not found
            pricing = self.PRICING["gpt-4"]
        else:
            pricing = self.PRICING[self.model]
        
        # Assume roughly equal input/output tokens for simplicity
        input_tokens = tokens // 2
        output_tokens = tokens // 2
        
        cost = (input_tokens / 1000 * pricing["input"]) + (output_tokens / 1000 * pricing["output"])
        return round(cost, 6)
    
    def generate(self, prompt: str, temperature: float = 0.3) -> str:
        """Legacy method for backward compatibility."""
        result = self.generate_tests(prompt, temperature)
        return result.tests
