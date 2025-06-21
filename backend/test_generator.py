from llm_client import get_llm_client

UNIT_TEST_PROMPT = """
You are a {language} expert. Generate complete unit tests for the following {language} code:
Include all necessary import statements and use appropriate testing frameworks and mock objects where needed.

Programming Language: {language}
Code:
{code}

Please generate comprehensive unit tests that cover:
- Normal/happy path scenarios
- Edge cases and error conditions
- Mock external dependencies if any
- Use appropriate assertions for {language}

return the code only, no other text or comments.
"""

def generate_unit_tests(code: str, llm_name="openai", model="gpt-4", language="python") -> str:
    client = get_llm_client(llm_name)
    if hasattr(client, "model"):
        client.model = model
    prompt = UNIT_TEST_PROMPT.format(code=code, language=language.capitalize())
    response = client.generate(prompt)
    print(response)
    return response
