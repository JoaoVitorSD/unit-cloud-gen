# Docker-based Test Analyzer

This document describes the updated Docker-based test analyzer that uses volume mounts for persistent file storage and runs test frameworks directly.

## Overview

The test analyzer now uses Docker containers with volume mounts to analyze test coverage for Python and JavaScript code. Instead of custom analysis scripts, it runs the actual test frameworks (Jest for JavaScript, pytest for Python) and parses their output.

## Architecture

### Docker Images

- **test-analyzer-python:latest**: Uses pytest with coverage reporting
- **test-analyzer-javascript:latest**: Uses Jest with coverage reporting

### Key Features

1. **Volume Mounts**: Source and test files are mounted as volumes for persistent storage
2. **Direct Test Execution**: Runs actual test frameworks instead of custom analysis scripts
3. **Output Parsing**: Parses test framework output to extract coverage and test results
4. **Error Handling**: Handles both successful and failed test executions

## Setup

### Building Docker Images

```bash
cd backend/test_analyzer/docker
./build_images.sh
```

This will build both Python and JavaScript analyzer images.

### Prerequisites

- Docker installed and running
- Python 3.11+ (for the client code)
- Node.js 18+ (for JavaScript testing)

## Usage

### Python Client

```python
from test_analyzer.docker_client import docker_client

# Analyze JavaScript code
result = docker_client.analyze_with_container(
    "javascript",
    source_code,
    test_code
)

# Analyze Python code
result = docker_client.analyze_with_container(
    "python",
    source_code,
    test_code
)
```

### Example Output

```json
{
  "coverage_percentage": 85.7,
  "lines_covered": 6,
  "lines_total": 7,
  "test_execution_success": true,
  "test_suites_total": 1,
  "test_suites_failed": 0,
  "tests_total": 3,
  "tests_failed": 0,
  "tests_passed": 3,
  "execution_error": null
}
```

## Docker Container Details

### JavaScript Container

- **Base Image**: `node:18-slim`
- **Test Framework**: Jest with coverage
- **Entrypoint**: Custom bash script that:
  1. Creates source.js and test.js files from arguments
  2. Runs Jest with coverage reporting
  3. Outputs results to stdout/stderr

### Python Container

- **Base Image**: `python:3.11-slim`
- **Test Framework**: pytest with pytest-cov
- **Entrypoint**: Custom bash script that:
  1. Creates source.py and test_source.py files from arguments
  2. Runs pytest with coverage reporting
  3. Outputs results to stdout/stderr

## Volume Mount Strategy

The Docker client creates temporary directories and mounts them as volumes:

```python
# Create temporary directory
temp_dir = tempfile.mkdtemp()

# Write files
source_file = os.path.join(temp_dir, "source.js")  # or source.py
test_file = os.path.join(temp_dir, "test.js")      # or test.py

# Mount as volume
docker_cmd = [
    "docker", "run", "--rm",
    "-v", f"{temp_dir}:/app/workspace",
    "-w", "/app/workspace",
    image_name,
    source_code,
    test_code
]
```

## Output Parsing

### Jest Output Parsing

The client parses Jest output to extract:

- Test suite results
- Test counts (passed/failed/total)
- Coverage percentages
- Line coverage details

### Pytest Output Parsing

The client parses pytest output to extract:

- Test results (passed/failed)
- Coverage percentages
- Line coverage details

## Error Handling

The system handles various error scenarios:

- Docker not available
- Image build failures
- Container execution timeouts
- Test execution failures
- Output parsing errors

## Migration from Old Approach

### Changes Made

1. **Removed Custom Scripts**: No more `analyze.js` or `analyze.py` files
2. **Direct Test Execution**: Containers run Jest/pytest directly
3. **Volume Mounts**: Files are mounted instead of passed as arguments
4. **Output Parsing**: Client parses test framework output instead of JSON

### Benefits

1. **More Accurate**: Uses actual test frameworks
2. **Better Performance**: No custom analysis overhead
3. **More Reliable**: Leverages mature test frameworks
4. **Easier Maintenance**: Less custom code to maintain

## Troubleshooting

### Common Issues

1. **Docker not running**: Ensure Docker daemon is started
2. **Image build failures**: Check Dockerfile syntax and dependencies
3. **Permission issues**: Ensure Docker has access to create volumes
4. **Timeout errors**: Increase timeout values for large codebases

### Debugging

Enable debug logging:

```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

Check container logs:

```bash
docker logs <container_id>
```

## Future Enhancements

- Support for more languages (Go, Java, etc.)
- Custom test framework configurations
- Parallel test execution
- Caching of test results
- Integration with CI/CD pipelines
