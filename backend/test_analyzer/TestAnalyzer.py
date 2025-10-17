import json
import os
import shlex
import subprocess
import tempfile
import time
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any, Dict, Optional

from .docker_client import docker_client


@dataclass
class CoverageResult:
    """Result of code coverage analysis."""

    coverage_percentage: float
    lines_covered: int
    lines_total: int
    branch_coverage: Optional[float] = None  # Branch coverage percentage (0-100)
    branches_total: Optional[int] = None  # Total number of branches
    functions_covered: Optional[int] = None
    functions_total: Optional[int] = None
    time_taken: float = 0.0
    error_message: Optional[str] = None
    coverage_details: Optional[Dict[str, Any]] = None
    # Test execution details
    test_execution_success: bool = False
    test_suites_total: int = 0
    test_suites_failed: int = 0
    tests_total: int = 0
    tests_failed: int = 0
    tests_passed: int = 0
    execution_error: Optional[str] = None
    # Individual test results
    # Each dict: {"suite": str, "name": str, "status": str, "error_message": str}
    test_details: Optional[list[Dict[str, Any]]] = None


class BaseTestAnalyzer(ABC):
    """Abstract base class for all test analyzers."""

    def __init__(self, language: str, docker_image: str):
        self.language = language
        self.docker_image = docker_image
        self.start_time: Optional[float] = None

    @abstractmethod
    def analyze_coverage(self, source_code: str, test_code: str) -> CoverageResult:
        """
        Analyze code coverage for the given source code and test code.

        Args:
            source_code: The source code to analyze
            test_code: The test code to run against the source code

        Returns:
            CoverageResult containing coverage metrics and details
        """
        pass

    def _start_timer(self) -> None:
        """Start timing for analysis."""
        self.start_time = time.time()

    def _get_elapsed_time(self) -> float:
        """Get elapsed time since timer started."""
        if self.start_time is None:
            return 0.0
        return time.time() - self.start_time

    def _run_docker_container(
        self, source_code: str, test_code: str
    ) -> tuple[int, str, str]:
        """
        Run a Docker container with the given source and test code.

        Args:
            source_code: Source code content
            test_code: Test code content

        Returns:
            Tuple of (return_code, stdout, stderr)
        """
        # Check if Docker is available
        if not docker_client.check_docker_available():
            return -1, "", "Docker is not available or not running"

        # Ensure the Docker image is available
        if not docker_client.ensure_image_available(self.language):
            return -1, "", f"Failed to build or find Docker image: {self.docker_image}"

        # Run the container
        return docker_client.run_container(self.docker_image, source_code, test_code)

    def _run_command(
        self, command: list[str], cwd: Optional[str] = None
    ) -> tuple[int, str, str]:
        """
        Run a command and return the result.

        Args:
            command: List of command arguments
            cwd: Working directory for the command

        Returns:
            Tuple of (return_code, stdout, stderr)
        """
        try:
            result = subprocess.run(
                command,
                capture_output=True,
                text=True,
                cwd=cwd,
                timeout=30,  # 30 second timeout
            )
            return result.returncode, result.stdout, result.stderr
        except subprocess.TimeoutExpired:
            return -1, "", "Command timed out after 30 seconds"
        except Exception as e:
            return -1, "", str(e)
