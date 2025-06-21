from .local_client import LocalClient
from .openai_client import OpenAIClient

LLM_CLIENTS = {
    "openai": OpenAIClient,
    "local": LocalClient,
}

def get_llm_client(name: str):
    cls = LLM_CLIENTS.get(name.lower())
    if not cls:
        raise ValueError(f"Unsupported provider: {name}")
    return cls()
