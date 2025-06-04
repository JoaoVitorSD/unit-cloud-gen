from typing import Optional
import openai
from langchain.llms import OpenAI
from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain
import json

class LLMService:
    def __init__(self, api_key: str):
        """Initialize the LLM service with OpenAI API key"""
        self.api_key = api_key
        openai.api_key = api_key
        self.llm = OpenAI(temperature=0.7, openai_api_key=api_key)
        
        # Initialize prompt templates
        self.code_generation_template = PromptTemplate(
            input_variables=["prompt", "language", "framework", "file_content"],
            template="""
            You are an expert software developer. Generate code based on the following requirements:
            
            Language: {language}
            Framework: {framework}
            Requirements: {prompt}
            
            Additional Context from File:
            {file_content}
            
            Please provide:
            1. The complete code implementation
            2. A brief explanation of the code
            3. Required dependencies
            4. Setup instructions
            
            Format the response as a JSON object with the following structure:
            {{
                "code": "the generated code",
                "explanation": "explanation of the code",
                "dependencies": ["list", "of", "dependencies"],
                "setup_instructions": "instructions for setting up"
            }}
            """
        )
        
        self.chain = LLMChain(llm=self.llm, prompt=self.code_generation_template)

    async def generate_code(
        self,
        prompt: str,
        language: str,
        framework: Optional[str] = None,
        file_url: Optional[str] = None,
        file_content: Optional[str] = None
    ) -> dict:
        """
        Generate code based on the provided prompt and parameters
        """
        try:
            # If file_url is provided but no content, you would need to fetch the content
            # This is a placeholder for file content fetching logic
            if file_url and not file_content:
                file_content = "File content would be fetched here"
            
            # Generate code using the LLM chain
            response = self.chain.run(
                prompt=prompt,
                language=language,
                framework=framework or "none",
                file_content=file_content or "No additional file content provided"
            )
            
            # Parse the response as JSON
            try:
                result = json.loads(response)
            except json.JSONDecodeError:
                # If the response is not valid JSON, create a structured response
                result = {
                    "code": response,
                    "explanation": "Generated code without additional context",
                    "dependencies": [],
                    "setup_instructions": "Please review the generated code for setup instructions"
                }
            
            return result
            
        except Exception as e:
            raise Exception(f"Error generating code: {str(e)}")

    async def analyze_code(self, code: str, language: str) -> dict:
        """
        Analyze the provided code and provide feedback
        """
        try:
            response = await openai.ChatCompletion.acreate(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "You are an expert code reviewer."},
                    {"role": "user", "content": f"Please analyze this {language} code and provide feedback:\n\n{code}"}
                ]
            )
            
            return {
                "analysis": response.choices[0].message.content,
                "suggestions": [],  # This could be extracted from the analysis
                "best_practices": []  # This could be extracted from the analysis
            }
            
        except Exception as e:
            raise Exception(f"Error analyzing code: {str(e)}")

    async def explain_code(self, code: str, language: str) -> str:
        """
        Generate a detailed explanation of the provided code
        """
        try:
            response = await openai.ChatCompletion.acreate(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "You are an expert code explainer."},
                    {"role": "user", "content": f"Please explain this {language} code in detail:\n\n{code}"}
                ]
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            raise Exception(f"Error explaining code: {str(e)}") 