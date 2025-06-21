import json
import os
import re
import tempfile
from typing import Any, Dict

from .TestAnalyzer import BaseTestAnalyzer, CoverageResult


class PythonAnalyzer(BaseTestAnalyzer):
    """Python implementation using Docker container for code coverage analysis."""
    
    def __init__(self):
        super().__init__("python", "test-analyzer-python:latest")
    
    def analyze_coverage(self, source_code: str, test_code: str) -> CoverageResult:
        """Analyze code coverage using Docker container for Python."""
        self._start_timer()
        
        try:
            # Run Docker container with source and test code
            return_code, stdout, stderr = self._run_docker_container(source_code, test_code)
            
            time_taken = self._get_elapsed_time()
            
            if return_code != 0:
                return CoverageResult(
                    coverage_percentage=0.0,
                    lines_covered=0,
                    lines_total=0,
                    time_taken=time_taken,
                    error_message=f"Docker container failed with return code {return_code}: {stderr}",
                    test_execution_success=False,
                    test_suites_total=1,
                    test_suites_failed=1,
                    tests_total=0,
                    tests_failed=0,
                    tests_passed=0,
                    execution_error=stderr
                )
            
            # Parse pytest output
            container_result = self._parse_pytest_output(stdout, stderr)
            
            # Convert to CoverageResult
            coverage_result = CoverageResult(
                coverage_percentage=container_result.get("coverage_percentage", 0.0),
                lines_covered=container_result.get("lines_covered", 0),
                lines_total=container_result.get("lines_total", 0),
                branches_covered=container_result.get("branches_covered", 0),
                branches_total=container_result.get("branches_total", 0),
                time_taken=time_taken,
                error_message=container_result.get("error_message"),
                coverage_details=container_result.get("coverage_details"),
                test_execution_success=container_result.get("test_execution_success", False),
                test_suites_total=container_result.get("test_suites_total", 0),
                test_suites_failed=container_result.get("test_suites_failed", 0),
                tests_total=container_result.get("tests_total", 0),
                tests_failed=container_result.get("tests_failed", 0),
                tests_passed=container_result.get("tests_passed", 0),
                execution_error=container_result.get("execution_error")
            )
            
            return coverage_result
            
        except Exception as e:
            time_taken = self._get_elapsed_time()
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
                execution_error=str(e)
            )
    
    def _parse_pytest_output(self, stdout: str, stderr: str) -> Dict[str, Any]:
        """Parse pytest output to extract coverage and test results."""
        try:
            # Combine stdout and stderr
            output = stdout + "\n" + stderr
            
            # Default values
            result = {
                "coverage_percentage": 0.0,
                "lines_covered": 0,
                "lines_total": 0,
                "test_execution_success": False,
                "test_suites_total": 1,
                "test_suites_failed": 0,
                "tests_total": 0,
                "tests_failed": 0,
                "tests_passed": 0,
                "execution_error": None
            }
            
            lines = output.split('\n')
            
            # Parse test results
            for line in lines:
                # Test summary patterns
                if "passed" in line and "failed" in line:
                    # Pattern: "1 passed, 0 failed"
                    match = re.match(r"(\d+)\s+passed(?:,\s*(\d+)\s+failed)?", line)
                    if match:
                        tests_passed = int(match.group(1))
                        tests_failed = int(match.group(2)) if match.group(2) else 0
                        result["tests_passed"] = tests_passed
                        result["tests_failed"] = tests_failed
                        result["tests_total"] = tests_passed + tests_failed
                
                # Coverage patterns
                elif "source.py" in line and "%" in line:
                    # Pattern: "source.py     10      8    80%"
                    parts = line.split()
                    if len(parts) >= 4:
                        try:
                            result["lines_total"] = int(parts[1])
                            result["lines_covered"] = int(parts[2])
                            percentage_str = parts[3].replace('%', '')
                            result["coverage_percentage"] = float(percentage_str)
                        except ValueError:
                            pass
                
                elif "TOTAL" in line and "%" in line:
                    # Pattern: "TOTAL     10      8    80%"
                    parts = line.split()
                    if len(parts) >= 4:
                        try:
                            result["lines_total"] = int(parts[1])
                            result["lines_covered"] = int(parts[2])
                            percentage_str = parts[3].replace('%', '')
                            result["coverage_percentage"] = float(percentage_str)
                        except ValueError:
                            pass
            
            # Determine success
            result["test_execution_success"] = result["tests_failed"] == 0
            
            return result
            
        except Exception as e:
            return {
                "coverage_percentage": 0.0,
                "lines_covered": 0,
                "lines_total": 0,
                "test_execution_success": False,
                "test_suites_total": 1,
                "test_suites_failed": 1,
                "tests_total": 0,
                "tests_failed": 0,
                "tests_passed": 0,
                "execution_error": f"Failed to parse pytest output: {str(e)}"
            } 