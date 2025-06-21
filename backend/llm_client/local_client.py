import requests

class LocalClient:
    def __init__(self, base_url="http://localhost:11434/api/generate", model="llama3"):
        self.base_url = base_url
        self.model = model

    def generate(self, prompt: str, temperature=0.3) -> str:
        payload = {
            "model": self.model,
            "prompt": prompt,
            "temperature": temperature,
            "stream": False
        }

        response = requests.post(self.base_url, json=payload)
        response.raise_for_status()
        return response.json().get("response", "").strip()
