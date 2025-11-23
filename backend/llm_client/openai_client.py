import os
from typing import Optional

from dotenv import load_dotenv
from openai import OpenAI

from .base_client import BaseLLMClient, TestGenerationResult

load_dotenv()


class OpenAIClient(BaseLLMClient):
    """OpenAI implementation of the LLM client."""

    # Token pricing per 1K tokens (approximate rates for GPT-4)
    PRICING = {
        "gpt-4": {"input": 0.03, "output": 0.06},
        "gpt-4-turbo": {"input": 0.01, "output": 0.03},
        "gpt-3.5-turbo": {"input": 0.001, "output": 0.002},
    }

    # Available OpenAI models with descriptions
    AVAILABLE_MODELS = {
        "gpt-4": {
            "name": "GPT-4",
            "description": "Most capable model, best for complex tasks",
            "max_tokens": 8192,
            "pricing": {"input": 0.03, "output": 0.06},
        },
        "gpt-4-turbo": {
            "name": "GPT-4 Turbo",
            "description": "Faster and more efficient than GPT-4",
            "max_tokens": 128000,
            "pricing": {"input": 0.01, "output": 0.03},
        },
        "gpt-3.5-turbo": {
            "name": "GPT-3.5 Turbo",
            "description": "Fast and cost-effective for most tasks",
            "max_tokens": 16385,
            "pricing": {"input": 0.001, "output": 0.002},
        },
    }

    def __init__(self, model: str = "gpt-4"):
        super().__init__(model)
        self.client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    def _clean_test_code(self, code: str) -> str:
        """Clean generated test code by removing markdown, extra formatting."""
        import re

        if not code:
            return ""

        # Remove markdown code blocks
        code = re.sub(r"```(?:javascript|js|typescript|ts)?\s*\n?", "", code)
        code = re.sub(r"```\s*\n?", "", code)

        # Remove common prefixes that LLMs sometimes add
        code = re.sub(
            r"^(Here|Here\'s|Here is|The test code|Test code):\s*\n?",
            "",
            code,
            flags=re.IGNORECASE,
        )

        # Strip whitespace
        code = code.strip()

        # Remove empty lines at start/end but keep internal structure
        lines = code.split("\n")
        # Remove leading empty lines
        while lines and not lines[0].strip():
            lines.pop(0)
        # Remove trailing empty lines
        while lines and not lines[-1].strip():
            lines.pop()

        return "\n".join(lines)

    @classmethod
    def get_available_models(cls) -> dict:
        """Get list of available OpenAI models with their information."""
        return cls.AVAILABLE_MODELS.copy()

    def generate_tests(
        self, prompt: str, temperature: float = 0.3
    ) -> TestGenerationResult:
        """Generate unit tests using OpenAI's API."""
        self._start_timer()

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "Return only the test code — no explanations, no markdown, no triple backticks.",
                    },
                    {"role": "user", "content": prompt},
                ],
                temperature=temperature,
            )

            # Extract the generated content
            content = response.choices[0].message.content
            if content is None:
                content = ""

            # Clean the generated code
            tests = self._clean_test_code(content)

            # Get token usage from response
            usage = response.usage
            if usage:
                tokens_used = usage.total_tokens
                input_tokens = (
                    usage.prompt_tokens
                    if hasattr(usage, "prompt_tokens")
                    else tokens_used // 2
                )
                output_tokens = (
                    usage.completion_tokens
                    if hasattr(usage, "completion_tokens")
                    else tokens_used // 2
                )
            else:
                # Fallback to estimation if usage not available
                tokens_used = self._estimate_tokens(prompt + tests)
                input_tokens = self._estimate_tokens(prompt)
                output_tokens = self._estimate_tokens(tests)

            # Calculate cost and time
            estimated_cost = self._calculate_cost_with_breakdown(
                input_tokens, output_tokens
            )
            time_taken = self._get_elapsed_time()

            return TestGenerationResult(
                tests=tests,
                tokens_used=tokens_used,
                estimated_cost=estimated_cost,
                time_taken=time_taken,
            )

        except Exception as e:
            time_taken = self._get_elapsed_time()
            # Return error information in case of failure
            return TestGenerationResult(
                tests=f"Error generating tests: {str(e)}",
                tokens_used=0,
                estimated_cost=0.0,
                time_taken=time_taken,
            )

    def _estimate_tokens(self, text: str) -> int:
        """Estimate tokens using a simple approximation (4 chars ≈ 1 token)."""
        return len(text) // 4

    def _calculate_cost(self, tokens: int) -> float:
        """Calculate cost based on model pricing (legacy method)."""
        if self.model not in self.PRICING:
            pricing = self.PRICING["gpt-4"]
        else:
            pricing = self.PRICING[self.model]

        input_tokens = tokens // 2
        output_tokens = tokens // 2

        cost = (input_tokens / 1000 * pricing["input"]) + (
            output_tokens / 1000 * pricing["output"]
        )
        return round(cost, 6)

    def _calculate_cost_with_breakdown(
        self, input_tokens: int, output_tokens: int
    ) -> float:
        """Calculate cost based on model pricing with input/output breakdown."""
        if self.model not in self.PRICING:
            pricing = self.PRICING["gpt-4"]
        else:
            pricing = self.PRICING[self.model]

        cost = (input_tokens / 1000 * pricing["input"]) + (
            output_tokens / 1000 * pricing["output"]
        )
        return round(cost, 6)

    def generate(self, prompt: str, temperature: float = 0.3) -> str:
        """Legacy method for backward compatibility."""
        result = self.generate_tests(prompt, temperature)
        return result.tests
