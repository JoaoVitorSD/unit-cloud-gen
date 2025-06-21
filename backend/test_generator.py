from llm_client import get_llm_client

UNIT_TEST_PROMPT = """
You are a Python expert. Generate complete pytest unit tests for the following code:
Include import statements and use mock objects where needed.
"""

def generate_unit_tests(code: str, llm_name="openai", model="gpt-4") -> str:
    client = get_llm_client(llm_name)
    if hasattr(client, "model"):
        client.model = model
    prompt = UNIT_TEST_PROMPT.format(code=code)
    return client.generate(prompt)
