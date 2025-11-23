import json
import logging
import os
import re
import tempfile
from typing import Any, Dict

from .TestAnalyzer import BaseTestAnalyzer, CoverageResult

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class JestAnalyzer(BaseTestAnalyzer):
    """Jest implementation using Docker container for JavaScript/TypeScript code coverage analysis."""

    def __init__(self):
        super().__init__("javascript", "test-analyzer-javascript:latest")

    def analyze_coverage(self, source_code: str, test_code: str) -> CoverageResult:
        """Analyze code coverage using Docker container for JavaScript/TypeScript."""
        self._start_timer()

        try:
            # Run Docker container with source and test code
            return_code, stdout, stderr = self._run_docker_container(
                source_code, test_code
            )

            time_taken = self._get_elapsed_time()

            # Parse Jest output regardless of return code
            # (Jest returns non-zero when tests fail, which is expected)
            container_result = self._parse_jest_output(stdout, stderr)

            # Check if we got valid test results
            # If no JSON was found, it means Docker/Jest actually crashed
            if return_code != 0 and container_result.get("tests_total", 0) == 0:
                logger.error(f"Docker container failed with return code {return_code}")
                logger.error(f"Docker stderr: {stderr}")
                logger.error(f"Docker stdout: {stdout}")

                return CoverageResult(
                    coverage_percentage=0.0,
                    lines_covered=0,
                    lines_total=0,
                    time_taken=time_taken,
                    error_message=f"Docker container failed: Unable to parse test results",
                    test_execution_success=False,
                    test_suites_total=1,
                    test_suites_failed=1,
                    tests_total=0,
                    tests_failed=0,
                    tests_passed=0,
                    execution_error="Test execution failed - no results generated",
                )

            # Convert to CoverageResult
            coverage_result = CoverageResult(
                coverage_percentage=container_result.get("coverage_percentage", 0.0),
                lines_covered=container_result.get("lines_covered", 0),
                lines_total=container_result.get("lines_total", 0),
                branch_coverage=float(
                    container_result.get("branch_coverage", 0.0)
                ),  # Branch coverage percentage
                branches_total=None,  # Jest doesn't provide total branch count
                time_taken=time_taken,
                error_message=container_result.get("error_message"),
                coverage_details=container_result.get("coverage_details"),
                test_execution_success=container_result.get(
                    "test_execution_success", False
                ),
                test_suites_total=container_result.get("test_suites_total", 0),
                test_suites_failed=container_result.get("test_suites_failed", 0),
                tests_total=container_result.get("tests_total", 0),
                tests_failed=container_result.get("tests_failed", 0),
                tests_passed=container_result.get("tests_passed", 0),
                execution_error=container_result.get("execution_error"),
                test_details=container_result.get("test_details", []),
            )

            return coverage_result

        except Exception as e:
            time_taken = self._get_elapsed_time()
            logger.error(f"Error analyzing coverage: {str(e)}", exc_info=True)
            return CoverageResult(
                coverage_percentage=0.0,
                lines_covered=0,
                lines_total=0,
                time_taken=time_taken,
                error_message=f"Error analyzing coverage: {str(e)}",
                test_execution_success=False,
                test_suites_total=1,
                test_suites_failed=1,
                tests_total=0,
                tests_failed=0,
                tests_passed=0,
                execution_error=str(e),
            )

    def _parse_jest_output(self, stdout: str, stderr: str) -> Dict[str, Any]:
        """Parse Jest output to extract coverage and test results."""
        try:
            # Default values
            result: Dict[str, Any] = {
                "coverage_percentage": 0.0,
                "lines_covered": 0,
                "lines_total": 0,
                "branch_coverage": 0.0,  # Branch coverage percentage
                "branches_total": 0,
                "test_execution_success": False,
                "test_suites_total": 1,
                "test_suites_failed": 0,
                "tests_total": 0,
                "tests_failed": 0,
                "tests_passed": 0,
                "execution_error": None,
                "test_details": [],  # Individual test results
            }

            # Parse test results from JSON output in stdout
            jest_json, test_data = self._parse_test_results_from_json(stdout)
            result.update(test_data)

            # Parse coverage from coverage JSON file (preferred) or from jest_json
            coverage_json = self._parse_coverage_json_file(stdout)
            if coverage_json:
                coverage_data = self._parse_coverage_from_coverage_json(coverage_json)
                result.update(coverage_data)
            elif jest_json:
                coverage_data = self._parse_coverage_from_json(jest_json)
                result.update(coverage_data)

            # Determine success
            result["test_execution_success"] = (
                result["tests_failed"] == 0 and result["test_suites_failed"] == 0
            )

            return result

        except Exception as e:
            logger.error(f"Error parsing Jest output: {str(e)}", exc_info=True)
            return {
                "coverage_percentage": 0.0,
                "lines_covered": 0,
                "lines_total": 0,
                "branch_coverage": 0.0,  # Branch coverage percentage
                "branches_total": 0,
                "test_execution_success": False,
                "test_suites_total": 1,
                "test_suites_failed": 1,
                "tests_total": 0,
                "tests_failed": 0,
                "tests_passed": 0,
                "execution_error": f"Failed to parse Jest output: {str(e)}",
                "test_details": [],
            }

    def _parse_coverage_json_file(self, stdout: str) -> Dict[str, Any] | None:
        """Extract and parse coverage JSON from stdout markers."""
        try:
            coverage_start = stdout.find("===COVERAGE_JSON_START===")
            coverage_end = stdout.find("===COVERAGE_JSON_END===")

            if coverage_start == -1 or coverage_end == -1:
                return None

            coverage_str = stdout[
                coverage_start + len("===COVERAGE_JSON_START===") : coverage_end
            ].strip()

            if not coverage_str:
                return None

            coverage_json = json.loads(coverage_str)
            return coverage_json

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse coverage JSON: {str(e)}")
            return None
        except Exception as e:
            logger.error(f"Error extracting coverage JSON: {str(e)}")
            return None

    def _parse_coverage_from_coverage_json(
        self, coverage_json: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Parse coverage from Jest coverage-final.json format."""
        try:
            result = {
                "coverage_percentage": 0.0,
                "lines_covered": 0,
                "lines_total": 0,
                "branch_coverage": 0.0,
                "branches_total": 0,
            }

            total_statements = 0
            covered_statements = 0
            total_branches = 0
            covered_branches = 0

            for file_path, file_coverage in coverage_json.items():
                statements = file_coverage.get("statementMap", {})
                s = file_coverage.get("s", {})

                for stmt_id in statements.keys():
                    total_statements += 1
                    if s.get(stmt_id, 0) > 0:
                        covered_statements += 1

                branch_map = file_coverage.get("branchMap", {})
                b = file_coverage.get("b", {})

                for branch_id, branch_info in branch_map.items():
                    locations = branch_info.get("locations", [])
                    branch_hits = b.get(branch_id, [])

                    if isinstance(branch_hits, list):
                        for i, location in enumerate(locations):
                            total_branches += 1
                            if i < len(branch_hits) and branch_hits[i] > 0:
                                covered_branches += 1
                    else:
                        total_branches += 1
                        if branch_hits > 0:
                            covered_branches += 1

            if total_statements > 0:
                result["coverage_percentage"] = (
                    covered_statements / total_statements
                ) * 100
                result["lines_covered"] = covered_statements
                result["lines_total"] = total_statements

            if total_branches > 0:
                result["branch_coverage"] = (covered_branches / total_branches) * 100
                result["branches_total"] = total_branches

            return result

        except Exception as e:
            logger.error(
                f"Error parsing coverage from coverage JSON: {str(e)}", exc_info=True
            )
            return {
                "coverage_percentage": 0.0,
                "lines_covered": 0,
                "lines_total": 0,
                "branch_coverage": 0.0,
                "branches_total": 0,
            }

    def _parse_coverage_from_json(self, jest_json: Dict[str, Any]) -> Dict[str, Any]:
        """Parse coverage information from Jest JSON output."""
        try:
            result = {
                "coverage_percentage": 0.0,
                "lines_covered": 0,
                "lines_total": 0,
                "branch_coverage": 0.0,
                "branches_total": 0,
            }

            coverage_map = jest_json.get("coverageMap", {})

            if not coverage_map:
                logger.warning("No coverageMap found in Jest JSON output")
                return result

            # Aggregate coverage across all files
            total_statements = 0
            covered_statements = 0
            total_branches = 0
            covered_branches = 0

            for file_path, file_coverage in coverage_map.items():
                # Get statement coverage
                statement_map = file_coverage.get("s", {})
                for stmt_id, hit_count in statement_map.items():
                    total_statements += 1
                    if hit_count > 0:
                        covered_statements += 1

                # Get branch coverage
                branch_map = file_coverage.get("b", {})
                for branch_id, branch_hits in branch_map.items():
                    if isinstance(branch_hits, list):
                        for hit_count in branch_hits:
                            total_branches += 1
                            if hit_count > 0:
                                covered_branches += 1

            # Calculate percentages
            if total_statements > 0:
                result["coverage_percentage"] = (
                    covered_statements / total_statements
                ) * 100
                result["lines_covered"] = covered_statements
                result["lines_total"] = total_statements

            if total_branches > 0:
                result["branch_coverage"] = (covered_branches / total_branches) * 100
                result["branches_total"] = total_branches

            return result

        except Exception as e:
            logger.error(f"Error parsing coverage from JSON: {str(e)}", exc_info=True)
            return {
                "coverage_percentage": 0.0,
                "lines_covered": 0,
                "lines_total": 0,
                "branch_coverage": 0.0,
                "branches_total": 0,
            }

    def _parse_test_results_from_json(
        self, stdout: str
    ) -> tuple[Dict[str, Any] | None, Dict[str, Any]]:
        """Parse test results from Jest JSON output. Returns (jest_json, result_dict)."""
        try:
            result: Dict[str, Any] = {
                "test_suites_total": 1,
                "test_suites_failed": 0,
                "tests_total": 0,
                "tests_failed": 0,
                "tests_passed": 0,
                "test_details": [],
            }

            # Extract JSON from between markers
            json_start = stdout.find("===JSON_RESULTS_START===")
            json_end = stdout.find("===JSON_RESULTS_END===")

            if json_start == -1 or json_end == -1:
                logger.warning("JSON markers not found in output")
                return None, result

            json_str = stdout[
                json_start + len("===JSON_RESULTS_START===") : json_end
            ].strip()

            if not json_str:
                logger.warning("Empty JSON output")
                return None, result

            # Parse JSON
            jest_json = json.loads(json_str)

            # Extract individual test details first, then count actual test() blocks
            test_details = []
            test_results = jest_json.get("testResults", [])

            tests_total = 0
            tests_passed = 0
            tests_failed = 0

            for test_suite in test_results:
                suite_name = (
                    test_suite.get("name", "")
                    .replace("/app/workspace/", "")
                    .replace("/app/", "")
                )
                assertion_results = test_suite.get("assertionResults", [])

                for assertion in assertion_results:
                    tests_total += 1
                    test_name = assertion.get("title", "")
                    status = assertion.get("status", "unknown")
                    failure_messages = assertion.get("failureMessages", [])

                    if status == "passed":
                        tests_passed += 1
                    elif status == "failed":
                        tests_failed += 1

                    # Extract error message if test failed
                    error_message = ""
                    if status == "failed" and failure_messages:
                        # Get first failure message and clean it up
                        raw_error = failure_messages[0]
                        lines = raw_error.split("\n")

                        # Try to find the main assertion error
                        main_error = ""
                        expected_received = []

                        for i, line in enumerate(lines):
                            line_stripped = line.strip()

                            # Get the main expect() line
                            if line_stripped.startswith("expect(") and not main_error:
                                main_error = line_stripped

                            # Collect Expected/Received comparison lines
                            if line_stripped.startswith(
                                "- Expected"
                            ) or line_stripped.startswith("+ Received"):
                                main_error = line_stripped
                                # Get the next few lines for context
                                for j in range(i + 1, min(i + 4, len(lines))):
                                    next_line = lines[j].strip()
                                    if next_line and not next_line.startswith("at "):
                                        expected_received.append(next_line)
                                    else:
                                        break
                                break

                        # Build the error message
                        if main_error:
                            error_message = main_error
                            if expected_received:
                                # Add first few lines of comparison
                                error_message += " | " + " ".join(expected_received[:3])
                        else:
                            # Fallback: use first non-empty, non-stack-trace line
                            for line in lines:
                                line_stripped = line.strip()
                                if line_stripped and not line_stripped.startswith(
                                    "at "
                                ):
                                    error_message = line_stripped
                                    break

                    test_details.append(
                        {
                            "suite": suite_name,
                            "name": test_name,
                            "status": status,
                            "error_message": error_message,
                        }
                    )

            # Count test suites
            result["test_suites_total"] = jest_json.get(
                "numTotalTestSuites", len(test_results)
            )
            result["test_suites_failed"] = jest_json.get("numFailedTestSuites", 0)

            # Use counts from actual test() blocks, not from numTotalTests which counts assertions
            result["tests_total"] = tests_total
            result["tests_passed"] = tests_passed
            result["tests_failed"] = tests_failed

            result["test_details"] = test_details
            return jest_json, result

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON output: {str(e)}", exc_info=True)
            return None, {
                "test_suites_total": 1,
                "test_suites_failed": 1,
                "tests_total": 0,
                "tests_failed": 0,
                "tests_passed": 0,
                "test_details": [],
            }
        except Exception as e:
            logger.error(
                f"Error parsing test results from JSON: {str(e)}", exc_info=True
            )
            return None, {
                "test_suites_total": 1,
                "test_suites_failed": 1,
                "tests_total": 0,
                "tests_failed": 0,
                "tests_passed": 0,
                "test_details": [],
            }
