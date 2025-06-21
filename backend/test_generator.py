from dataclasses import dataclass
from typing import List

from llm_client import TestGenerationResult, get_llm_client
from test_analyzer import CoverageResult, get_test_analyzer

# Language-specific import configurations
LANGUAGE_IMPORT_CONFIGS = {
    "javascript": {
        "named_imports": "import {{ ClassName }} from './source.js'",
        "default_imports": "import ClassName from './source.js'",
        "source_file": "source.js",
        "description": "JavaScript/TypeScript"
    },
    "typescript": {
        "named_imports": "import {{ ClassName }} from './source.ts'",
        "default_imports": "import ClassName from './source.ts'",
        "source_file": "source.ts",
        "description": "TypeScript"
    },
    "python": {
        "named_imports": "from source import ClassName, function_name",
        "default_imports": "from source import *",
        "source_file": "source.py",
        "description": "Python"
    },
    "java": {
        "named_imports": "import source.ClassName;",
        "default_imports": "import ClassName;",
        "source_file": "source.java",
        "description": "Java"
    },
    "go": {
        "named_imports": 'import "./source"',
        "default_imports": 'import ("./source" "source")',
        "source_file": "source.go",
        "description": "Go"
    },
    "rust": {
        "named_imports": "use crate::source::ClassName;",
        "default_imports": "use crate::source;",
        "source_file": "source.rs",
        "description": "Rust"
    },
    "csharp": {
        "named_imports": "using SourceNamespace.ClassName;",
        "default_imports": "using SourceNamespace;",
        "source_file": "source.cs",
        "description": "C#"
    }
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
    branches_covered: int = 0
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

UNIT_TEST_PROMPT = """
You are a {language} expert. Generate complete unit tests for the following {language} code:
Include all necessary import statements and use appropriate testing frameworks and mock objects where needed.

Programming Language: {language}
Code:
{code}

Please generate comprehensive unit tests that cover:
- Normal/happy path scenarios
- Edge cases and error conditions
- Mock external dependencies if any
- Use appropriate assertions for {language}

IMPORTANT: Make sure to properly import the source code being tested. Use the correct import syntax for {language}:

{import_instructions}

return the code only, no other text or comments.
"""

TEST_QUALITY_EVALUATION_PROMPT = """
You are a {language} testing expert. Evaluate the quality of the following unit tests for the given code.

Programming Language: {language}

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
- Proper use of testing frameworks and assertions
- Mock usage for external dependencies
- Test organization and structure
- Test naming and documentation
- Assertion quality and comprehensiveness

Note: Actual code coverage will be measured separately using coverage tools, so focus on the quality and comprehensiveness of the tests rather than precise coverage estimation.

Respond in the following JSON format only:
{{
    "quality_score": <number>,
    "feedback": ["feedback item 1", "feedback item 2", ...],
    "suggestions": ["suggestion 1", "suggestion 2", ...],
    "coverage_estimate": <number>
}}
"""

def generate_unit_tests(code: str, llm_name="openai", model="gpt-4", language="python") -> TestGenerationResult:
    client = get_llm_client(llm_name)
    if hasattr(client, "model"):
        client.model = model
    
    # Get language-specific import configuration
    lang_config = LANGUAGE_IMPORT_CONFIGS.get(language.lower(), LANGUAGE_IMPORT_CONFIGS["python"])
    
    # Build import instructions for the selected language
    import_instructions = f"""
For {lang_config['description']}:
- If the source code exports classes/functions, import them using: {lang_config['named_imports']}
- If the source code uses default exports, import using: {lang_config['default_imports']}
- The file being imported must be named {lang_config['source_file']}
"""
    
    prompt = UNIT_TEST_PROMPT.format(
        code=code, 
        language=language.capitalize(),
        import_instructions=import_instructions
    )
    response = client.generate_tests(prompt)
    print(response)
    return response

def evaluate_test_quality(code: str, test_code: str, language: str = "python") -> TestQualityResult:
    client = get_llm_client("openai")  # Using OpenAI for evaluation
    client.model = "gpt-4"  # Using GPT-4 for better evaluation
    
    # First, get actual code coverage using test analyzer
    actual_coverage_result = get_actual_coverage(code, test_code, language)
    
    prompt = TEST_QUALITY_EVALUATION_PROMPT.format(
        code=code,
        test_code=test_code,
        language=language.capitalize()
    )
    
    try:
        # Get the evaluation response
        response = client.generate_tests(prompt)
        
        # Parse the JSON response
        import json
        import re

        # Extract JSON from the response
        json_match = re.search(r'\{.*\}', response.tests, re.DOTALL)
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
                branches_covered=actual_coverage_result.branches_covered or 0,
                branches_total=actual_coverage_result.branches_total or 0,
                coverage_error=actual_coverage_result.error_message or "",
                test_execution_success=actual_coverage_result.test_execution_success,
                test_suites_total=actual_coverage_result.test_suites_total,
                test_suites_failed=actual_coverage_result.test_suites_failed,
                tests_total=actual_coverage_result.tests_total,
                tests_failed=actual_coverage_result.tests_failed,
                tests_passed=actual_coverage_result.tests_passed,
                execution_time=actual_coverage_result.time_taken,
                execution_error=actual_coverage_result.execution_error or ""
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
                branches_covered=actual_coverage_result.branches_covered or 0,
                branches_total=actual_coverage_result.branches_total or 0,
                coverage_error=actual_coverage_result.error_message or "",
                test_execution_success=actual_coverage_result.test_execution_success,
                test_suites_total=actual_coverage_result.test_suites_total,
                test_suites_failed=actual_coverage_result.test_suites_failed,
                tests_total=actual_coverage_result.tests_total,
                tests_failed=actual_coverage_result.tests_failed,
                tests_passed=actual_coverage_result.tests_passed,
                execution_time=actual_coverage_result.time_taken,
                execution_error=actual_coverage_result.execution_error or f"Failed to parse evaluation response: {response.tests}"
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
            branches_covered=actual_coverage_result.branches_covered or 0,
            branches_total=actual_coverage_result.branches_total or 0,
            coverage_error=actual_coverage_result.error_message or "",
            test_execution_success=actual_coverage_result.test_execution_success,
            test_suites_total=actual_coverage_result.test_suites_total,
            test_suites_failed=actual_coverage_result.test_suites_failed,
            tests_total=actual_coverage_result.tests_total,
            tests_failed=actual_coverage_result.tests_failed,
            tests_passed=actual_coverage_result.tests_passed,
            execution_time=actual_coverage_result.time_taken,
            execution_error=actual_coverage_result.execution_error or f"Evaluation failed: {str(e)}"
        )


def get_actual_coverage(code: str, test_code: str, language: str) -> CoverageResult:
    """
    Get actual code coverage using the appropriate test analyzer.
    
    Args:
        code: Source code to analyze
        test_code: Test code to run
        language: Programming language
        
    Returns:
        CoverageResult with actual coverage metrics
    """
    try:
        # Map language to analyzer using the same configuration
        language_to_analyzer = {
            "javascript": "jest",
            "typescript": "jest", 
            "js": "jest",
            "ts": "jest",
            "python": "python",
            "py": "python",
            "java": "java",
            "go": "go",
            "rust": "rust",
            "csharp": "csharp"
        }
        
        analyzer_name = language_to_analyzer.get(language.lower(), "python")
        
        # Get the appropriate analyzer
        analyzer = get_test_analyzer(analyzer_name)
        
        # Run coverage analysis
        result = analyzer.analyze_coverage(code, test_code)
        
        print(f"Coverage analysis completed: {result.coverage_percentage:.2f}% coverage")
        return result
        
    except Exception as e:
        print(f"Error in coverage analysis: {e}")
        # Return a default result on error
        return CoverageResult(
            coverage_percentage=0.0,
            lines_covered=0,
            lines_total=0,
            error_message=f"Coverage analysis failed: {str(e)}"
        )
