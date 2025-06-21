from .docker_client import DockerClient, docker_client
from .jest_analyzer import JestAnalyzer
from .python_analyzer import PythonAnalyzer
from .TestAnalyzer import BaseTestAnalyzer, CoverageResult

TEST_ANALYZERS = {
    "jest": JestAnalyzer,
    "python": PythonAnalyzer,
}

def get_test_analyzer(name: str) -> BaseTestAnalyzer:
    """
    Get a test analyzer instance by name.
    
    Args:
        name: The name of the analyzer ("jest" or "python")
        
    Returns:
        An instance of the requested test analyzer
        
    Raises:
        ValueError: If the analyzer name is not supported
    """
    cls = TEST_ANALYZERS.get(name.lower())
    if not cls:
        raise ValueError(f"Unsupported analyzer: {name}")
    return cls()

# Export the main classes and types
__all__ = [
    "BaseTestAnalyzer", 
    "CoverageResult", 
    "JestAnalyzer", 
    "PythonAnalyzer",
    "DockerClient",
    "docker_client",
    "get_test_analyzer"
] 