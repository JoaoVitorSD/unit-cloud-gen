# Test Analyzer Module

This module provides a unified interface for analyzing code coverage across different programming languages using Docker containers. It follows the same architecture pattern as the LLM client module with a base class and concrete implementations.

## Architecture

The test analyzer module follows the same pattern as the LLM client:

- **BaseTestAnalyzer**: Abstract base class defining the interface
- **Concrete Implementations**: Language-specific analyzers using Docker containers
- **DockerClient**: Utility for managing Docker containers and images
- **Factory Function**: `get_test_analyzer()` for easy instantiation
- **Result Data Class**: `CoverageResult` for standardized output

## Docker-Based Approach

Instead of running tools manually on the host system, this module uses Docker containers to ensure:

- **Isolation**: Each analysis runs in a clean, isolated environment
- **Consistency**: Same environment across different systems
- **Reliability**: No dependency conflicts or missing tools
- **Security**: Code runs in sandboxed containers

## Components

### BaseTestAnalyzer

Abstract base class that defines the interface for all test analyzers:

```python
class BaseTestAnalyzer(ABC):
    def analyze_coverage(self, source_code: str, test_code: str) -> CoverageResult:
        """Analyze code coverage for the given source code and test code."""
        pass
```

### CoverageResult

Data class containing coverage analysis results:

```python
@dataclass
class CoverageResult:
    coverage_percentage: float
    lines_covered: int
    lines_total: int
    branches_covered: Optional[int] = None
    branches_total: Optional[int] = None
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
```

### DockerClient

Utility class for managing Docker containers and images:

```python
class DockerClient:
    def check_docker_available(self) -> bool
    def ensure_image_available(self, language: str) -> bool
    def run_container(self, image_name: str, source_code: str, test_code: str) -> Tuple[int, str, str]
    def build_image(self, dockerfile_path: str, image_name: str) -> bool
```

## Available Analyzers

### JestAnalyzer

Analyzes JavaScript/TypeScript code coverage using Jest in a Docker container.

**Features:**

- Supports JavaScript and TypeScript
- Uses Jest for test execution and coverage
- Automatically converts ES6 imports to CommonJS
- Parses both JSON and text coverage reports
- Runs in isolated Docker container

**Docker Image**: `test-analyzer-javascript:latest`

**Usage:**

```python
from test_analyzer import JestAnalyzer

analyzer = JestAnalyzer()
result = analyzer.analyze_coverage(source_code, test_code)
print(f"Coverage: {result.coverage_percentage:.2f}%")
```

### PythonAnalyzer

Analyzes Python code coverage using coverage.py in a Docker container.

**Features:**

- Uses coverage.py for comprehensive coverage analysis
- Supports branch coverage reporting
- Automatically installs coverage.py dependencies
- Parses both JSON and text coverage reports
- Runs in isolated Docker container

**Docker Image**: `test-analyzer-python:latest`

**Usage:**

```python
from test_analyzer import PythonAnalyzer

analyzer = PythonAnalyzer()
result = analyzer.analyze_coverage(source_code, test_code)
print(f"Coverage: {result.coverage_percentage:.2f}%")
print(f"Branches: {result.branches_covered}/{result.branches_total}")
```

## Factory Function

Use the factory function to get analyzer instances by name:

```python
from test_analyzer import get_test_analyzer

# Get Jest analyzer
jest_analyzer = get_test_analyzer("jest")

# Get Python analyzer
python_analyzer = get_test_analyzer("python")

# This will raise ValueError
try:
    unsupported = get_test_analyzer("unsupported")
except ValueError as e:
    print(f"Error: {e}")
```

## Docker Setup

### Prerequisites

- Docker installed and running
- Docker daemon accessible to the current user

### Building Images

The Docker images are automatically built when first needed, or you can build them manually:

```bash
# Build all images
cd backend/test_analyzer/docker
chmod +x build_images.sh
./build_images.sh

# Or build individually
cd python
docker build -t test-analyzer-python:latest .

cd ../javascript
docker build -t test-analyzer-javascript:latest .
```

### Docker Images

- **test-analyzer-python:latest**: Python 3.11 with coverage.py and pytest
- **test-analyzer-javascript:latest**: Node.js 18 with Jest and Chai

## Example Usage

### Basic Usage

```python
from test_analyzer import get_test_analyzer

# JavaScript/TypeScript example
source_code = """
function add(a, b) {
    return a + b;
}
"""

test_code = """
const { add } = require('./source.js');
test('add should work', () => {
    expect(add(2, 3)).toBe(5);
});
"""

analyzer = get_test_analyzer("jest")
result = analyzer.analyze_coverage(source_code, test_code)

print(f"Coverage: {result.coverage_percentage:.2f}%")
print(f"Lines: {result.lines_covered}/{result.lines_total}")
print(f"Tests passed: {result.tests_passed}/{result.tests_total}")
```

### Python Example

```python
from test_analyzer import get_test_analyzer

source_code = """
def add(a, b):
    return a + b
"""

test_code = """
import unittest
from source import add

class TestAdd(unittest.TestCase):
    def test_add(self):
        self.assertEqual(add(2, 3), 5)

if __name__ == '__main__':
    unittest.main()
"""

analyzer = get_test_analyzer("python")
result = analyzer.analyze_coverage(source_code, test_code)

print(f"Coverage: {result.coverage_percentage:.2f}%")
print(f"Lines: {result.lines_covered}/{result.lines_total}")
print(f"Branches: {result.branches_covered}/{result.branches_total}")
```

## Error Handling

All analyzers return a `CoverageResult` with error information if something goes wrong:

```python
result = analyzer.analyze_coverage(source_code, test_code)

if result.error_message:
    print(f"Analysis failed: {result.error_message}")
else:
    print(f"Coverage: {result.coverage_percentage:.2f}%")
```

Common error scenarios:

- **Docker not available**: "Docker is not available or not running"
- **Image build failure**: "Failed to build or find Docker image"
- **Container timeout**: "Docker container timed out after 60 seconds"
- **Test execution failure**: Container returns non-zero exit code

## Testing

Run the test script to verify the Docker-based approach:

```bash
cd backend/test_analyzer
python test_docker_approach.py
```

This will:

1. Check if Docker is available
2. Build Docker images if needed
3. Test both Python and JavaScript analyzers
4. Report success/failure for each

## Extending the Module

To add support for a new language:

1. Create a new Docker setup in `docker/<language>/`
2. Create a new analyzer class that extends `BaseTestAnalyzer`
3. Implement the `analyze_coverage` method
4. Add the analyzer to the `TEST_ANALYZERS` dictionary in `__init__.py`
5. Update the `__all__` list to export the new class

Example:

```python
class NewLanguageAnalyzer(BaseTestAnalyzer):
    def __init__(self):
        super().__init__("new_language", "test-analyzer-new-language:latest")

    def analyze_coverage(self, source_code: str, test_code: str) -> CoverageResult:
        # Implementation here
        pass
```

## Docker Container Structure

Each Docker container:

1. **Receives**: Source code and test code as command line arguments
2. **Creates**: Temporary files for analysis
3. **Runs**: Coverage analysis tools
4. **Outputs**: JSON result to stdout
5. **Cleans up**: Temporary files automatically

### Container Input/Output

**Input**: Command line arguments

- `argv[1]`: Source code content
- `argv[2]`: Test code content

**Output**: JSON to stdout

```json
{
  "coverage_percentage": 80.0,
  "lines_covered": 8,
  "lines_total": 10,
  "branches_covered": 6,
  "branches_total": 8,
  "time_taken": 1.23,
  "test_execution_success": true,
  "tests_passed": 2,
  "tests_total": 2,
  "error_message": null
}
```

## Performance Considerations

- **First run**: Docker images are built (takes 2-5 minutes)
- **Subsequent runs**: Containers start quickly (1-3 seconds)
- **Analysis time**: Similar to native tools (5-30 seconds depending on code size)
- **Memory usage**: Each container uses ~100-200MB RAM
- **Disk usage**: Images are ~200-500MB each

## Security

- Code runs in isolated containers
- No persistent storage between runs
- Containers are removed after each analysis
- No network access from containers
- Timeout limits prevent hanging processes

## Notes

- All containers have a 60-second timeout to prevent hanging
- Docker images are automatically built if not present
- The module handles both successful and failed analysis gracefully
- Temporary files are cleaned up automatically by Docker
- ES6/TypeScript imports are automatically converted to CommonJS for Jest compatibility
