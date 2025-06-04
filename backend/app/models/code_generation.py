from pydantic import BaseModel, Field
from typing import Optional, List

class CodeGenerationRequest(BaseModel):
    prompt: str = Field(..., description="The prompt describing what code to generate")
    language: str = Field(..., description="The programming language to generate code in")
    framework: Optional[str] = Field(None, description="The framework to use (if applicable)")
    context: Optional[str] = Field(None, description="Additional context for code generation")
    requirements: Optional[List[str]] = Field(None, description="List of requirements or constraints")

class CodeGenerationResponse(BaseModel):
    code: str = Field(..., description="The generated code")
    file_url: Optional[str] = Field(None, description="URL of the uploaded file (if any)")
    language: str = Field(..., description="The programming language used")
    framework: Optional[str] = Field(None, description="The framework used (if any)")
    explanation: Optional[str] = Field(None, description="Explanation of the generated code")
    dependencies: Optional[List[str]] = Field(None, description="List of dependencies required")
    setup_instructions: Optional[str] = Field(None, description="Instructions for setting up the generated code") 