import os

import openai
from dotenv import load_dotenv

load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")

class OpenAIClient:
    def __init__(self, model="gpt-4"):
        self.model = model

    def generate(self, prompt: str, temperature=0.3) -> str:
        response = openai.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
            temperature=temperature
        )
        return response['choices'][0]['message']['content'].strip()
