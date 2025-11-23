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
    # Evaluation cost and time
    evaluation_tokens_used: int = 0
    evaluation_cost: float = 0.0
    evaluation_time: float = 0.0


UNIT_TEST_PROMPT = """
You are a JavaScript testing expert. Generate complete unit tests for the following JavaScript code using the Jest framework.

{problem_context}

Code:
{code}

Please generate comprehensive unit tests that cover:
- Normal/happy path scenarios
- Edge cases and error conditions
- Mock external dependencies if any

IMPORTANT: Make sure to properly import the source code being tested using:
{import_instructions}

EXECUTION INFORMATION:
- These tests will be executed using the Jest test runner framework
- Jest will run your tests and validate all assertions
- Ensure all assertions use valid Jest syntax that Jest can execute

JEST SYNTAX REQUIREMENTS:
- Use describe() for test suites
- Use test() or it() for individual tests
- CRITICAL RULE: Each test() block MUST contain ONLY ONE expect() assertion
- Create separate test() blocks for each assertion - do NOT put multiple expects in one test()
- This ensures accurate test counting and better test isolation
- Use Jest assertions ONLY: expect().toBe(), expect().toEqual(), expect().toBeTruthy(), expect().toBeFalsy(), expect().toThrow(), etc.
- DO NOT use Chai syntax (no .to.be, .to.equal, .to.have, etc.)
- Examples of CORRECT structure (one expect per test):
  * test('should return I for 1', () => {{ expect(intToRoman(1)).toBe('I'); }});
  * test('should return IV for 4', () => {{ expect(intToRoman(4)).toBe('IV'); }});
  * test('should throw for negative', () => {{ expect(() => intToRoman(-1)).toThrow(); }});
- Examples of INCORRECT structure (multiple expects in one test - DO NOT DO THIS):
  * test('multiple cases', () => {{ expect(a).toBe(1); expect(b).toBe(2); }}); // WRONG!

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
2. An estimated code coverage percentage (this will be compared with actual coverage)

Consider the following criteria:
- Test coverage (happy path, edge cases, error conditions)
- Code quality and readability
- Proper use of Jest framework and assertions
- Mock usage for external dependencies

Respond in the following JSON format only:
{{
    "quality_score": <number>,
    "coverage_estimate": <number>
}}
"""


def generate_unit_tests(
    code: str,
    llm_name="openai",
    model="gpt-4",
    language="javascript",
    problem_name=None,
    leetcode_link=None,
    rank=None,
    problem_type=None,
    definition=None,
) -> TestGenerationResult:
    client = get_llm_client(llm_name)
    if hasattr(client, "model"):
        client.model = model

    # Build problem context if provided
    problem_context_parts = []
    if problem_name:
        problem_context_parts.append(f"Problem Name: {problem_name}")
    if rank:
        problem_context_parts.append(f"Difficulty: {rank}")
    if problem_type:
        problem_context_parts.append(f"Problem Type: {problem_type}")
    if leetcode_link:
        problem_context_parts.append(f"LeetCode Link: {leetcode_link}")
    if definition:
        problem_context_parts.append(f"\nProblem Description:\n{definition}")

    problem_context = ""
    if problem_context_parts:
        problem_context = (
            "Problem Context:\n" + "\n".join(problem_context_parts) + "\n\n"
        )
    else:
        problem_context = ""

    # JavaScript import instructions
    named_imports_template = JAVASCRIPT_IMPORT_CONFIG.get(
        "named_imports", "const {{ functionName }} = require('./source.js');"
    )
    default_imports_template = JAVASCRIPT_IMPORT_CONFIG.get(
        "default_imports", "const source = require('./source.js');"
    )
    source_file = JAVASCRIPT_IMPORT_CONFIG.get("source_file", "source.js")

    # Build import instructions string directly to avoid format() conflicts
    import_instructions = f"""
For JavaScript:
- If the source code exports functions/classes using module.exports, import them using: {named_imports_template.replace('{', '{{').replace('}', '}}')}
- If the source code uses default exports, import using: {default_imports_template.replace('{', '{{').replace('}', '}}')}
- The file being imported must be named {source_file}
"""

    prompt = UNIT_TEST_PROMPT.format(
        code=code,
        import_instructions=import_instructions,
        problem_context=problem_context,
    )
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
                feedback=[],
                suggestions=[],
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
                evaluation_tokens_used=response.tokens_used,
                evaluation_cost=response.estimated_cost,
                evaluation_time=response.time_taken,
            )
        else:
            # Fallback if JSON parsing fails
            has_coverage_error = bool(actual_coverage_result.error_message)
            test_execution_success = not has_coverage_error

            return TestQualityResult(
                quality_score=5.0,
                feedback=[],
                suggestions=[],
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
                evaluation_tokens_used=response.tokens_used,
                evaluation_cost=response.estimated_cost,
                evaluation_time=response.time_taken,
            )

    except Exception as e:
        print(f"Error evaluating test quality: {e}")
        # Return a default result on error
        has_coverage_error = bool(actual_coverage_result.error_message)
        test_execution_success = not has_coverage_error

        return TestQualityResult(
            quality_score=5.0,
            feedback=[],
            suggestions=[],
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
            evaluation_tokens_used=0,
            evaluation_cost=0.0,
            evaluation_time=0.0,
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
