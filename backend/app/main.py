import os
import sys
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from db.migrations import run_migration
from db.repository import save_problem_result
from llm_client import LLM_CLIENTS
from test_generator import evaluate_test_quality, generate_unit_tests

app = FastAPI()


@app.on_event("startup")
async def startup_event():
    """Run database migrations on startup."""
    try:
        run_migration()
    except Exception as e:
        print(f"Warning: Migration failed: {e}")


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
    language: str = "javascript"
    problem_name: Optional[str] = None
    leetcode_link: Optional[str] = None
    rank: Optional[str] = None
    problem_type: Optional[str] = None
    definition: Optional[str] = None


class TestQualityRequest(BaseModel):
    code: str
    test_code: str
    language: str = "javascript"


class SaveProblemResultRequest(BaseModel):
    problem_name: str | None = None
    leetcode_link: str | None = None
    rank: str | None = None
    problem_type: str | None = None
    definition: str | None = None
    code: str
    test_code: str
    quality_score: float | None = None
    coverage_estimate: float | None = None
    actual_coverage: float | None = None
    tests_total: int = 0
    tests_passed: int = 0
    tests_failed: int = 0
    execution_time: float = 0.0
    evaluation_time: float = 0.0
    generation_tokens: int = 0
    generation_cost: float = 0.0
    evaluation_tokens: int = 0
    evaluation_cost: float = 0.0
    test_details: list | None = None
    execution_error: str | None = None
    coverage_error: str | None = None


@app.post("/generate-tests")
def generate_tests(req: CodeRequest):
    try:
        print(f"Generating tests for {req.provider} {req.model} {req.language}")
        result = generate_unit_tests(
            req.code,
            req.provider,
            req.model,
            req.language,
            problem_name=req.problem_name,
            leetcode_link=req.leetcode_link,
            rank=req.rank,
            problem_type=req.problem_type,
            definition=req.definition,
        )

        # Ensure tests is a string
        tests_output = result.tests if result.tests else ""
        if not isinstance(tests_output, str):
            tests_output = str(tests_output)

        return {
            "tests": tests_output,
            "tokens_used": result.tokens_used,
            "estimated_cost": result.estimated_cost,
            "time_taken": result.time_taken,
        }
    except Exception as e:
        import traceback

        error_detail = str(e)
        print(f"Error generating tests: {error_detail}")
        print(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=error_detail)


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
            "test_details": result.test_details,
            # Evaluation cost and time
            "evaluation_tokens_used": result.evaluation_tokens_used,
            "evaluation_cost": result.evaluation_cost,
            "evaluation_time": result.evaluation_time,
        }
    except Exception as e:
        print(f"Error evaluating test quality: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/providers")
def get_providers():
    return {"providers": ["openai"]}


@app.get("/models")
def get_models():
    """Get available OpenAI models only."""
    from llm_client.openai_client import OpenAIClient

    # Get models from OpenAI client only
    openai_models = OpenAIClient.get_available_models()

    # Convert to the expected format - only OpenAI
    models_by_provider = {
        "openai": {
            "name": "OpenAI",
            "description": "ChatGPT and GPT models for JavaScript testing",
            "models": [
                {
                    "id": model_id,
                    "name": model_info["name"],
                    "description": model_info["description"],
                }
                for model_id, model_info in openai_models.items()
                if "gpt" in model_id.lower()
            ],
        }
    }

    return {"models_by_provider": models_by_provider}


@app.post("/save-problem-result")
def save_result(req: SaveProblemResultRequest):
    try:
        result = save_problem_result(
            problem_name=req.problem_name,
            leetcode_link=req.leetcode_link,
            rank=req.rank,
            problem_type=req.problem_type,
            definition=req.definition,
            code=req.code,
            test_code=req.test_code,
            quality_score=req.quality_score,
            coverage_estimate=req.coverage_estimate,
            actual_coverage=req.actual_coverage,
            tests_total=req.tests_total,
            tests_passed=req.tests_passed,
            tests_failed=req.tests_failed,
            execution_time=req.execution_time,
            evaluation_time=req.evaluation_time,
            generation_tokens=req.generation_tokens,
            generation_cost=req.generation_cost,
            evaluation_tokens=req.evaluation_tokens,
            evaluation_cost=req.evaluation_cost,
            test_details=req.test_details,
            execution_error=req.execution_error,
            coverage_error=req.coverage_error,
        )

        if result.get("success"):
            return {
                "success": True,
                "id": result.get("id"),
                "created_at": result.get("created_at"),
            }
        else:
            raise HTTPException(
                status_code=500, detail=result.get("error", "Failed to save")
            )
    except Exception as e:
        print(f"Error saving problem result: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/")
def read_root():
    return {"message": "Hello, World!"}
