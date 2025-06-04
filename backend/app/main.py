from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import Optional
import boto3
import os
from dotenv import load_dotenv
from .config import Settings
from .services.llm import LLMService
from .services.storage import StorageService
from .models.code_generation import CodeGenerationRequest, CodeGenerationResponse

# Load environment variables
load_dotenv()

# Initialize settings
settings = Settings()

# Initialize FastAPI app
app = FastAPI(
    title="Unit Cloud Gen API",
    description="API for generating code using LLMs",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
s3_client = boto3.client(
    's3',
    aws_access_key_id=settings.aws_access_key_id,
    aws_secret_access_key=settings.aws_secret_access_key,
    region_name=settings.aws_region
)

storage_service = StorageService(s3_client, settings.s3_bucket_name)
llm_service = LLMService(settings.openai_api_key)

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}

@app.post("/api/generate", response_model=CodeGenerationResponse)
async def generate_code(
    request: CodeGenerationRequest,
    file: Optional[UploadFile] = File(None)
):
    """
    Generate code based on the provided request and optional file
    """
    try:
        # If a file is provided, upload it to S3
        file_url = None
        if file:
            file_url = await storage_service.upload_file(file)

        # Generate code using LLM
        generated_code = await llm_service.generate_code(
            prompt=request.prompt,
            file_url=file_url,
            language=request.language,
            framework=request.framework
        )

        return CodeGenerationResponse(
            code=generated_code,
            file_url=file_url
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating code: {str(e)}"
        )

@app.get("/api/languages")
async def get_supported_languages():
    """Get list of supported programming languages"""
    return {
        "languages": [
            "python",
            "javascript",
            "typescript",
            "java",
            "go",
            "rust",
            "csharp"
        ]
    }

@app.get("/api/frameworks")
async def get_supported_frameworks():
    """Get list of supported frameworks"""
    return {
        "frameworks": {
            "python": ["fastapi", "django", "flask"],
            "javascript": ["react", "vue", "angular", "express"],
            "typescript": ["react", "vue", "angular", "express", "nest"],
            "java": ["spring", "quarkus"],
            "go": ["gin", "echo", "fiber"],
            "rust": ["actix", "rocket", "axum"],
            "csharp": [".net", "asp.net"]
        }
    } 