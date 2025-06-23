import os
import time
import warnings
from typing import Any, Dict, Optional

try:
    import torch
    from transformers import AutoModelForCausalLM, AutoTokenizer
    HAS_TORCH = True
except ImportError:
    torch = None
    AutoTokenizer = None
    AutoModelForCausalLM = None
    HAS_TORCH = False

from .base_client import BaseLLMClient, TestGenerationResult

# Suppress warnings for cleaner output
warnings.filterwarnings("ignore", category=FutureWarning)
warnings.filterwarnings("ignore", category=UserWarning)


class LocalClient(BaseLLMClient):
    """Local LLM client for running CodeLlama models directly with PyTorch."""
    
    # Available CodeLlama models from HuggingFace
    AVAILABLE_MODELS = {
        "codellama-7b": {
            "name": "CodeLlama 7B",
            "description": "7B parameter code model - fastest inference",
            "model_id": "codellama/CodeLlama-7b-hf",
            "size": "7B",
            "pricing": {"input": 0.0, "output": 0.0}
        },
        "codellama-13b": {
            "name": "CodeLlama 13B", 
            "description": "13B parameter code model - balanced performance",
            "model_id": "codellama/CodeLlama-13b-hf",
            "size": "13B",
            "pricing": {"input": 0.0, "output": 0.0}
        },
        "codellama-7b-instruct": {
            "name": "CodeLlama 7B Instruct",
            "description": "7B instruction-tuned model - best for code generation",
            "model_id": "codellama/CodeLlama-7b-Instruct-hf",
            "size": "7B",
            "pricing": {"input": 0.0, "output": 0.0}
        }
    }
    
    def __init__(self, model: str = "codellama-7b-instruct"):
        super().__init__(model)
        
        if not HAS_TORCH:
            raise ImportError("PyTorch and transformers are required. Install with: pip install torch transformers")
        
        # Validate model
        if model not in self.AVAILABLE_MODELS:
            print(f"Warning: Model '{model}' not available. Using 'codellama-7b-instruct' as fallback.")
            self.model = "codellama-7b-instruct"
        
        # Model components
        self.tokenizer = None
        self.model_instance = None
        self.device = self._get_device()
        
        # Model loading is lazy - only load when needed
        self._model_loaded = False
        
        print(f"LocalClient initialized with model: {self.model} on device: {self.device}")
    
    def _get_device(self) -> str:
        """Determine the best device to use."""
        if torch.cuda.is_available():
            return "cuda"
        elif hasattr(torch.backends, 'mps') and torch.backends.mps.is_available():
            return "mps"  # Apple Silicon
        else:
            return "cpu"
    
    def _load_model(self):
        """Load the model and tokenizer if not already loaded."""
        if self._model_loaded:
            return
        
        model_info = self.AVAILABLE_MODELS[self.model]
        model_id = model_info["model_id"]
        
        print(f"Loading model {model_id}... This may take a few minutes on first run.")
        
        try:
            # Load tokenizer
            self.tokenizer = AutoTokenizer.from_pretrained(
                model_id,
                trust_remote_code=True,
                padding_side="left"
            )
            
            # Add padding token if it doesn't exist
            if self.tokenizer.pad_token is None:
                self.tokenizer.pad_token = self.tokenizer.eos_token
            
            # Load model with appropriate settings based on device
            model_kwargs = {
                "trust_remote_code": True,
                "torch_dtype": torch.float16 if self.device != "cpu" else torch.float32,
            }
            
            # Use 8-bit quantization if on GPU to save memory
            if self.device == "cuda":
                try:
                    model_kwargs["load_in_8bit"] = True
                    model_kwargs["device_map"] = "auto"
                except:
                    # Fallback if 8-bit loading fails
                    model_kwargs.pop("load_in_8bit", None)
                    model_kwargs.pop("device_map", None)
            
            self.model_instance = AutoModelForCausalLM.from_pretrained(
                model_id,
                **model_kwargs
            )
            
            # Move to device if not using device_map
            if "device_map" not in model_kwargs:
                self.model_instance = self.model_instance.to(self.device)
            
            self.model_instance.eval()  # Set to evaluation mode
            self._model_loaded = True
            
            print(f"✓ Model {model_id} loaded successfully on {self.device}")
            
        except Exception as e:
            raise RuntimeError(f"Failed to load model {model_id}: {str(e)}")
    
    def generate_tests(self, prompt: str, temperature: float = 0.3) -> TestGenerationResult:
        """Generate unit tests using CodeLlama directly with PyTorch."""
        self._start_timer()
        
        try:
            # Load model if not already loaded
            self._load_model()
            
            # Tokenize input
            inputs = self.tokenizer(
                prompt,
                return_tensors="pt",
                truncate=True,
                max_length=2048
            ).to(self.device)
            
            # Generation parameters
            generation_kwargs = {
                "max_new_tokens": 1024,
                "temperature": temperature,
                "do_sample": True if temperature > 0 else False,
                "top_p": 0.9,
                "top_k": 40,
                "repetition_penalty": 1.1,
                "pad_token_id": self.tokenizer.eos_token_id,
                "eos_token_id": self.tokenizer.eos_token_id,
            }
            
            # Generate
            with torch.no_grad():
                outputs = self.model_instance.generate(
                    inputs.input_ids,
                    attention_mask=inputs.attention_mask,
                    **generation_kwargs
                )
            
            # Decode output
            generated_tokens = outputs[0][inputs.input_ids.shape[1]:]  # Remove input tokens
            generated_text = self.tokenizer.decode(generated_tokens, skip_special_tokens=True)
            
            # Clean up the generated text
            generated_text = generated_text.strip()
            
            # Calculate metrics
            tokens_used = len(inputs.input_ids[0]) + len(generated_tokens)
            estimated_cost = self._calculate_cost(tokens_used)
            time_taken = self._get_elapsed_time()
            
            return TestGenerationResult(
                tests=generated_text,
                tokens_used=tokens_used,
                estimated_cost=estimated_cost,
                time_taken=time_taken
            )
            
        except torch.cuda.OutOfMemoryError:
            return self._create_error_result(
                "GPU out of memory. Try using a smaller model or reduce max_tokens."
            )
        except Exception as e:
            return self._create_error_result(f"Error generating tests: {str(e)}")
    
    def _create_error_result(self, error_message: str) -> TestGenerationResult:
        """Create an error result with proper timing."""
        time_taken = self._get_elapsed_time()
        return TestGenerationResult(
            tests=f"Error: {error_message}",
            tokens_used=0,
            estimated_cost=0.0,
            time_taken=time_taken
        )
    
    def _estimate_tokens(self, text: str) -> int:
        """Estimate tokens using tokenizer if available, otherwise approximation."""
        if self.tokenizer:
            return len(self.tokenizer.encode(text))
        return len(text) // 4  # Fallback approximation
    
    def _calculate_cost(self, tokens: int) -> float:
        """Calculate cost for local models (free)."""
        return 0.0
    
    @classmethod
    def get_available_models(cls) -> Dict[str, Any]:
        """Get list of available CodeLlama models."""
        return cls.AVAILABLE_MODELS.copy()
    
    def is_model_loaded(self) -> bool:
        """Check if model is loaded in memory."""
        return self._model_loaded
    
    def get_model_info(self) -> Dict[str, Any]:
        """Get information about the current model."""
        model_info = self.AVAILABLE_MODELS[self.model].copy()
        model_info.update({
            "loaded": self._model_loaded,
            "device": self.device,
            "torch_available": HAS_TORCH
        })
        return model_info
    
    def unload_model(self):
        """Unload model from memory to free resources."""
        if self.model_instance:
            del self.model_instance
            self.model_instance = None
        if self.tokenizer:
            del self.tokenizer
            self.tokenizer = None
        
        self._model_loaded = False
        
        # Clear GPU cache if using CUDA
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
        
        print("Model unloaded from memory")
