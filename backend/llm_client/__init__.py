from .base_client import BaseLLMClient, TestGenerationResult
from .local_client import LocalClient
from .openai_client import OpenAIClient

LLM_CLIENTS = {
    "openai": OpenAIClient,
    "local": LocalClient,
}

def get_llm_client(name: str) -> BaseLLMClient:
    """
    Get an LLM client instance by name.
    
    Args:
        name: The name of the client ("openai" or "local")
        
    Returns:
        An instance of the requested LLM client
        
    Raises:
        ValueError: If the provider name is not supported
    """
    cls = LLM_CLIENTS.get(name.lower())
    if not cls:
        raise ValueError(f"Unsupported provider: {name}")
    return cls()

# Export the main classes and types
__all__ = [
    "BaseLLMClient", 
    "TestGenerationResult", 
    "OpenAIClient", 
    "LocalClient", 
    "get_llm_client"
]
