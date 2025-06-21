import os
import sys

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from llm_client import LLM_CLIENTS
from test_generator import evaluate_test_quality, generate_unit_tests

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

class CodeRequest(BaseModel):
    code: str
    provider: str = "openai"
    model: str = "gpt-4"
    language: str = "python"

class TestQualityRequest(BaseModel):
    code: str
    test_code: str
    language: str = "python"

@app.post("/generate-tests")
def generate_tests(req: CodeRequest):
    try:
        print(f"Generating tests for {req.provider} {req.model} {req.language} {req.code}")
        result = generate_unit_tests(req.code, req.provider, req.model, req.language)
        return {
            "tests": result.tests,
            "tokens_used": result.tokens_used,
            "estimated_cost": result.estimated_cost,
            "time_taken": result.time_taken
        }
    except Exception as e:
        print(f"Error generating tests: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/evaluate-test-quality")
def evaluate_quality(req: TestQualityRequest):
    try:
        print(f"Evaluating test quality for {req.language}")
        result = evaluate_test_quality(req.code, req.test_code, req.language)
        return {
            "quality_score": result.quality_score,
            "feedback": result.feedback,
            "suggestions": result.suggestions,
            "coverage_estimate": result.coverage_estimate,
            "actual_coverage": result.actual_coverage,
            "lines_covered": result.lines_covered,
            "lines_total": result.lines_total,
            "branch_coverage": result.branch_coverage,
            "branches_total": result.branches_total,
            "coverage_error": result.coverage_error,
            # Test execution results
            "test_execution_success": result.test_execution_success,
            "test_suites_total": result.test_suites_total,
            "test_suites_failed": result.test_suites_failed,
            "tests_total": result.tests_total,
            "tests_failed": result.tests_failed,
            "tests_passed": result.tests_passed,
            "execution_time": result.execution_time,
            "execution_error": result.execution_error,
            # Individual test results
            "test_details": result.test_details
        }
    except Exception as e:
        print(f"Error evaluating test quality: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    
@app.get("/providers")
def get_providers():
    return {"providers": list(LLM_CLIENTS.keys())}

@app.get("/models")
def get_models():
    """Get available models organized by provider."""
    from llm_client.local_client import LocalClient
    from llm_client.openai_client import OpenAIClient

    # Get models from each client
    openai_models = OpenAIClient.get_available_models()
    local_models = LocalClient.get_available_models()
    
    # Convert to the expected format
    models_by_provider = {
        "openai": {
            "name": "OpenAI",
            "description": "Cloud-based AI models",
            "models": [
                {
                    "id": model_id,
                    "name": model_info["name"],
                    "description": model_info["description"]
                }
                for model_id, model_info in openai_models.items()
            ]
        },
        "local": {
            "name": "Local (Meta)",
            "description": "Open source models via Ollama",
            "models": [
                {
                    "id": model_id,
                    "name": model_info["name"],
                    "description": model_info["description"]
                }
                for model_id, model_info in local_models.items()
            ]
        }
    }
    
    # Add Anthropic if available (you can add AnthropicClient later)
    try:
        # This would be added when AnthropicClient is implemented
        models_by_provider["anthropic"] = {
            "name": "Anthropic",
            "description": "Claude AI models",
            "models": [
                {"id": "claude-3-sonnet", "name": "Claude 3 Sonnet", "description": "Balanced performance"},
                {"id": "claude-3-haiku", "name": "Claude 3 Haiku", "description": "Fast and efficient"}
            ]
        }
    except ImportError:
        pass
    
    return {"models_by_provider": models_by_provider}

@app.get("/")
def read_root():
    return {"message": "Hello, World!"}


