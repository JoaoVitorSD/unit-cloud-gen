import os
import sys

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from llm_client import LLM_CLIENTS
from test_generator import generate_unit_tests

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

class CodeRequest(BaseModel):
    code: str
    provider: str = "openai"
    model: str = "gpt-4"

@app.post("/generate-tests")
def generate_tests(req: CodeRequest):
    try:
        print(f"Generating tests for {req.provider} {req.model} {req.code}")
        tests = generate_unit_tests(req.code, req.provider, req.model)
        return {"unit_tests": tests}
    except Exception as e:
        print(f"Error generating tests: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    
@app.get("/providers")
def get_providers():
    return {"providers": list(LLM_CLIENTS.keys())}

@app.get("/")
def read_root():
    return {"message": "Hello, World!"}


