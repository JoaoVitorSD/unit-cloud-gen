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
            return_code, stdout, stderr = self._run_docker_container(source_code, test_code)
            
            time_taken = self._get_elapsed_time()
            
            if return_code != 0:
                logger.error(f"Docker container failed with return code {return_code}")
                logger.error(f"Docker stderr: {stderr}")
                logger.error(f"Docker stdout: {stdout}")
                
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
            
            # Parse Jest output
            container_result = self._parse_jest_output(stdout, stderr)
            
            # Convert to CoverageResult
            coverage_result = CoverageResult(
                coverage_percentage=container_result.get("coverage_percentage", 0.0),
                lines_covered=container_result.get("lines_covered", 0),
                lines_total=container_result.get("lines_total", 0),
                branch_coverage=float(container_result.get("branch_coverage", 0.0)),  # Branch coverage percentage
                branches_total=None,  # Jest doesn't provide total branch count
                time_taken=time_taken,
                error_message=container_result.get("error_message"),
                coverage_details=container_result.get("coverage_details"),
                test_execution_success=container_result.get("test_execution_success", False),
                test_suites_total=container_result.get("test_suites_total", 0),
                test_suites_failed=container_result.get("test_suites_failed", 0),
                tests_total=container_result.get("tests_total", 0),
                tests_failed=container_result.get("tests_failed", 0),
                tests_passed=container_result.get("tests_passed", 0),
                execution_error=container_result.get("execution_error"),
                test_details=container_result.get("test_details", [])
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
                execution_error=str(e)
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
                "test_details": []  # Individual test results
            }
            
            # Parse coverage from stdout
            coverage_data = self._parse_coverage_from_stdout(stdout)
            result.update(coverage_data)
            
            # Parse test results from stderr
            test_data = self._parse_test_results_from_stderr(stderr)
            result.update(test_data)
            
            # Determine success
            result["test_execution_success"] = (
                result["tests_failed"] == 0 and 
                result["test_suites_failed"] == 0
            )
            
            return result
            
        except Exception as e:
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
                "test_details": []
            }
    
    def _parse_coverage_from_stdout(self, stdout: str) -> Dict[str, Any]:
        """Parse coverage information from Jest stdout."""
        try:
            result = {
                "coverage_percentage": 0.0,
                "lines_covered": 0,
                "lines_total": 0,
                "branch_coverage": 0.0,  # Branch coverage percentage
                "branches_total": 0
            }
            
            lines = stdout.split('\n')
            
            for line in lines:
                # Look for "All files" line for overall coverage percentage
                if "All files" in line and "%" in line:
                    # Extract percentage from line like "All files  |     100 |       50 |     100 |     100 |"
                    parts = line.split('|')
                    if len(parts) >= 2:
                        percentage_str = parts[1].strip()
                        try:
                            result["coverage_percentage"] = float(percentage_str)
                        except ValueError:
                            pass
                
                # Look for specific file coverage (source.js)
                elif "source.js" in line and "|" in line:
                    # Extract specific file coverage
                    parts = line.split('|')
                    if len(parts) >= 5:  # Need at least 5 parts for all coverage metrics
                        try:
                            # Format: "source.js |     100 |       50 |     100 |     100 | 2"
                            # Parts: [0] filename, [1] statements, [2] branches, [3] functions, [4] lines
                            statements_str = parts[1].strip()
                            branches_str = parts[2].strip()
                            
                            if statements_str and statements_str != "% Stmts":
                                try:
                                    result["coverage_percentage"] = float(statements_str)
                                except ValueError:
                                    pass
                            
                            if branches_str and branches_str != "% Branch":
                                try:
                                    result["branch_coverage"] = float(branches_str)  # Branch coverage percentage
                                except ValueError:
                                    pass
                                
                        except (ValueError, IndexError):
                            pass
            
            return result
            
        except Exception as e:
            logger.error(f"Error parsing coverage from stdout: {str(e)}", exc_info=True)
            return {
                "coverage_percentage": 0.0,
                "lines_covered": 0,
                "lines_total": 0,
                "branch_coverage": 0.0,  # Branch coverage percentage
                "branches_total": 0
            }
    
    def _parse_test_results_from_stderr(self, stderr: str) -> Dict[str, Any]:
        """Parse test results from Jest stderr."""
        try:
            result: Dict[str, Any] = {
                "test_suites_total": 1,
                "test_suites_failed": 0,
                "tests_total": 0,
                "tests_failed": 0,
                "tests_passed": 0,
                "test_details": []
            }
            
            lines = stderr.split('\n')
            current_suite = ""
            test_details = []
            
            for line in lines:
                # Test summary patterns
                if "Test Suites:" in line:
                    # Pattern: "Test Suites: 2 passed, 2 total"
                    match = re.match(r"Test Suites:\s*(\d+)\s*(passed|failed),\s*(\d+)\s*total", line)
                    if match:
                        if match.group(2) == "failed":
                            result["test_suites_failed"] = int(match.group(1))
                        else:
                            result["test_suites_failed"] = 0
                        result["test_suites_total"] = int(match.group(3))
                
                elif "Tests:" in line:
                    # Pattern: "Tests: 14 passed, 14 total"
                    match = re.match(r"Tests:\s*(\d+)\s*passed(?:,\s*(\d+)\s*failed)?,\s*(\d+)\s*total", line)
                    if match:
                        result["tests_passed"] = int(match.group(1))
                        result["tests_failed"] = int(match.group(2)) if match.group(2) else 0
                        result["tests_total"] = int(match.group(3))
                
                # Extract individual test results
                elif "PASS" in line and ".js" in line:
                    # New test suite started
                    current_suite = line.strip()
                
                elif "✓" in line or "✕" in line:
                    # Individual test result
                    test_match = re.match(r'\s*[✓✕]\s+(.+)', line)
                    if test_match:
                        test_name = test_match.group(1).strip()
                        test_status = "passed" if "✓" in line else "failed"
                        test_details.append({
                            "suite": current_suite,
                            "name": test_name,
                            "status": test_status
                        })
            
            result["test_details"] = test_details
            return result
            
        except Exception as e:
            logger.error(f"Error parsing test results from stderr: {str(e)}", exc_info=True)
            return {
                "test_suites_total": 1,
                "test_suites_failed": 1,
                "tests_total": 0,
                "tests_failed": 0,
                "tests_passed": 0,
                "test_details": []
            } 
