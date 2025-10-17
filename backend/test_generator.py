from dataclasses import dataclass, field
from typing import Any, Dict, List

from llm_client import TestGenerationResult, get_llm_client
from test_analyzer import CoverageResult, get_test_analyzer

# JavaScript-only import configuration
JAVASCRIPT_IMPORT_CONFIG = {
    "named_imports": "const {{ functionName }} = require('./source.js');",
    "default_imports": "const source = require('./source.js');",
    "source_file": "source.js",
    "description": "JavaScript",
}


@dataclass
class TestQualityResult:
    quality_score: float
    feedback: List[str]
    suggestions: List[str]
    coverage_estimate: float
    actual_coverage: float = 0.0
    lines_covered: int = 0
    lines_total: int = 0
    branch_coverage: float = 0.0  # Branch coverage percentage (0-100)
    branches_total: int = 0
    coverage_error: str = ""
    # Test execution results
    test_execution_success: bool = False
    test_suites_total: int = 0
    test_suites_failed: int = 0
    tests_total: int = 0
    tests_failed: int = 0
    tests_passed: int = 0
    execution_time: float = 0.0
    execution_error: str = ""
    # Individual test results
    test_details: List[Dict[str, Any]] = field(default_factory=list)


UNIT_TEST_PROMPT = """
You are a JavaScript testing expert. Generate complete unit tests for the following JavaScript code using the Jest framework.

Code:
{code}

Please generate comprehensive unit tests that cover:
- Normal/happy path scenarios
- Edge cases and error conditions
- Mock external dependencies if any

IMPORTANT: Make sure to properly import the source code being tested using:
{import_instructions}

JEST SYNTAX REQUIREMENTS:
- Use describe() for test suites
- Use test() or it() for individual tests
- Use Jest assertions ONLY: expect().toBe(), expect().toEqual(), expect().toBeTruthy(), expect().toBeFalsy(), expect().toThrow(), etc.
- DO NOT use Chai syntax (no .to.be, .to.equal, .to.have, etc.)
- Examples of correct Jest assertions:
  * expect(value).toBe(5)
  * expect(array).toEqual([1, 2, 3])
  * expect(obj).toHaveProperty('key')
  * expect(fn).toThrow()
  * expect(value).toBeTruthy()

CRITICAL: Return ONLY the test code - no explanations, no markdown formatting, no triple backticks, no additional text. Just the pure executable Jest test code.
"""

TEST_QUALITY_EVALUATION_PROMPT = """
You are a JavaScript testing expert. Evaluate the quality of the following Jest unit tests for the given JavaScript code.

Original Code:
{code}

Generated Tests:
{test_code}

Please evaluate the test quality and provide:
1. A quality score from 1-10 (where 10 is excellent)
2. Specific feedback on what's good and what needs improvement
3. Suggestions for better test coverage or implementation
4. An estimated code coverage percentage (this will be compared with actual coverage)

Consider the following criteria:
- Test coverage (happy path, edge cases, error conditions)
- Code quality and readability
- Proper use of Jest framework and assertions
- Mock usage for external dependencies
Respond in the following JSON format only:
{{
    "quality_score": <number>,
    "feedback": ["feedback item 1", "feedback item 2", ...],
    "suggestions": ["suggestion 1", "suggestion 2", ...],
    "coverage_estimate": <number>
}}
"""


def generate_unit_tests(
    code: str, llm_name="openai", model="gpt-4", language="javascript"
) -> TestGenerationResult:
    client = get_llm_client(llm_name)
    if hasattr(client, "model"):
        client.model = model

    # JavaScript import instructions
    import_instructions = f"""
For JavaScript:
- If the source code exports functions/classes using module.exports, import them using: {JAVASCRIPT_IMPORT_CONFIG['named_imports']}
- If the source code uses default exports, import using: {JAVASCRIPT_IMPORT_CONFIG['default_imports']}
- The file being imported must be named {JAVASCRIPT_IMPORT_CONFIG['source_file']}
"""

    prompt = UNIT_TEST_PROMPT.format(code=code, import_instructions=import_instructions)
    response = client.generate_tests(prompt)
    return response


def evaluate_test_quality(
    code: str, test_code: str, language: str = "javascript"
) -> TestQualityResult:
    client = get_llm_client("openai")  # Using OpenAI for evaluation
    client.model = "gpt-4"  # Using GPT-4 for better evaluation

    # First, get actual code coverage using test analyzer
    actual_coverage_result = get_actual_coverage(code, test_code, language)

    prompt = TEST_QUALITY_EVALUATION_PROMPT.format(code=code, test_code=test_code)

    try:
        # Get the evaluation response
        response = client.generate_tests(prompt)

        # Parse the JSON response
        import json
        import re

        # Extract JSON from the response
        json_match = re.search(r"\{.*\}", response.tests, re.DOTALL)
        if json_match:
            json_str = json_match.group()
            evaluation_data = json.loads(json_str)

            # Determine test execution success based on coverage error
            has_coverage_error = bool(actual_coverage_result.error_message)
            test_execution_success = not has_coverage_error

            return TestQualityResult(
                quality_score=float(evaluation_data.get("quality_score", 5.0)),
                feedback=evaluation_data.get("feedback", []),
                suggestions=evaluation_data.get("suggestions", []),
                coverage_estimate=float(evaluation_data.get("coverage_estimate", 50.0)),
                actual_coverage=actual_coverage_result.coverage_percentage,
                lines_covered=actual_coverage_result.lines_covered,
                lines_total=actual_coverage_result.lines_total,
                branch_coverage=actual_coverage_result.branch_coverage
                or 0.0,  # Branch coverage percentage
                branches_total=actual_coverage_result.branches_total
                or 0,  # May be None from Jest
                coverage_error=actual_coverage_result.error_message or "",
                test_execution_success=actual_coverage_result.test_execution_success,
                test_suites_total=actual_coverage_result.test_suites_total,
                test_suites_failed=actual_coverage_result.test_suites_failed,
                tests_total=actual_coverage_result.tests_total,
                tests_failed=actual_coverage_result.tests_failed,
                tests_passed=actual_coverage_result.tests_passed,
                execution_time=actual_coverage_result.time_taken,
                execution_error=actual_coverage_result.execution_error or "",
                test_details=actual_coverage_result.test_details or [],
            )
        else:
            # Fallback if JSON parsing fails
            has_coverage_error = bool(actual_coverage_result.error_message)
            test_execution_success = not has_coverage_error

            return TestQualityResult(
                quality_score=5.0,
                feedback=["Unable to parse evaluation response"],
                suggestions=["Please review the generated tests manually"],
                coverage_estimate=50.0,
                actual_coverage=actual_coverage_result.coverage_percentage,
                lines_covered=actual_coverage_result.lines_covered,
                lines_total=actual_coverage_result.lines_total,
                branch_coverage=actual_coverage_result.branch_coverage or 0.0,
                branches_total=actual_coverage_result.branches_total or 0,
                coverage_error=actual_coverage_result.error_message or "",
                test_execution_success=actual_coverage_result.test_execution_success,
                test_suites_total=actual_coverage_result.test_suites_total,
                test_suites_failed=actual_coverage_result.test_suites_failed,
                tests_total=actual_coverage_result.tests_total,
                tests_failed=actual_coverage_result.tests_failed,
                tests_passed=actual_coverage_result.tests_passed,
                execution_time=actual_coverage_result.time_taken,
                execution_error=actual_coverage_result.execution_error
                or f"Failed to parse evaluation response: {response.tests}",
                test_details=actual_coverage_result.test_details or [],
            )

    except Exception as e:
        print(f"Error evaluating test quality: {e}")
        # Return a default result on error
        has_coverage_error = bool(actual_coverage_result.error_message)
        test_execution_success = not has_coverage_error

        return TestQualityResult(
            quality_score=5.0,
            feedback=[f"Evaluation failed: {str(e)}"],
            suggestions=["Please review the generated tests manually"],
            coverage_estimate=50.0,
            actual_coverage=actual_coverage_result.coverage_percentage,
            lines_covered=actual_coverage_result.lines_covered,
            lines_total=actual_coverage_result.lines_total,
            branch_coverage=actual_coverage_result.branch_coverage or 0.0,
            branches_total=actual_coverage_result.branches_total or 0,
            coverage_error=actual_coverage_result.error_message or "",
            test_execution_success=actual_coverage_result.test_execution_success,
            test_suites_total=actual_coverage_result.test_suites_total,
            test_suites_failed=actual_coverage_result.test_suites_failed,
            tests_total=actual_coverage_result.tests_total,
            tests_failed=actual_coverage_result.tests_failed,
            tests_passed=actual_coverage_result.tests_passed,
            execution_time=actual_coverage_result.time_taken,
            execution_error=actual_coverage_result.execution_error
            or f"Evaluation failed: {str(e)}",
            test_details=actual_coverage_result.test_details or [],
        )


def get_actual_coverage(
    code: str, test_code: str, language: str = "javascript"
) -> CoverageResult:
    """
    Get actual code coverage using Jest for JavaScript.

    Args:
        code: Source code to analyze
        test_code: Test code to run
        language: Programming language (always JavaScript)

    Returns:
        CoverageResult with actual coverage metrics
    """
    try:
        # Use Jest analyzer for JavaScript
        analyzer = get_test_analyzer("jest")

        # Run coverage analysis
        result = analyzer.analyze_coverage(code, test_code)

        print(
            f"Coverage analysis completed: {result.coverage_percentage:.2f}% coverage"
        )
        return result

    except Exception as e:
        print(f"Error in coverage analysis: {e}")
        # Return a default result on error
        return CoverageResult(
            coverage_percentage=0.0,
            lines_covered=0,
            lines_total=0,
            error_message=f"Coverage analysis failed: {str(e)}",
        )
