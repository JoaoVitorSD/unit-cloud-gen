import os
import time
import warnings
from typing import Any, Dict, Optional, Union

try:
    import torch
    from transformers import AutoModelForCausalLM, AutoTokenizer
    HAS_TORCH = True
except ImportError:
    torch = None
    AutoTokenizer = None
    AutoModelForCausalLM = None
    HAS_TORCH = False

# Check for bitsandbytes (for quantization)
try:
    import bitsandbytes
    HAS_BITSANDBYTES = True
except ImportError:
    HAS_BITSANDBYTES = False

# Check for psutil (for memory monitoring)
try:
    import psutil
    HAS_PSUTIL = True
except ImportError:
    HAS_PSUTIL = False

from .base_client import BaseLLMClient, TestGenerationResult

# Suppress warnings for cleaner output
warnings.filterwarnings("ignore", category=FutureWarning)
warnings.filterwarnings("ignore", category=UserWarning)


class LocalClient(BaseLLMClient):
    """Local LLM client for running CodeLlama models directly with PyTorch."""
    
    # Available local models from HuggingFace
    AVAILABLE_MODELS = {
        "codellama-7b-instruct": {
            "name": "CodeLlama 7B Instruct",
            "description": "7B instruction-tuned model - best for code generation",
            "model_id": "codellama/CodeLlama-7b-Instruct-hf",
            "size": "7B",
            "pricing": {"input": 0.0, "output": 0.0}
        },
        "codellama-7b": {
            "name": "CodeLlama 7B Base",
            "description": "7B parameter base model - good for completion",
            "model_id": "codellama/CodeLlama-7b-hf",
            "size": "7B",
            "pricing": {"input": 0.0, "output": 0.0}
        },
        "codellama-13b-instruct": {
            "name": "CodeLlama 13B Instruct",
            "description": "13B instruction-tuned model - higher quality",
            "model_id": "codellama/CodeLlama-13b-Instruct-hf",
            "size": "13B",
            "pricing": {"input": 0.0, "output": 0.0}
        },
        "starcoder2-7b": {
            "name": "StarCoder2 7B",
            "description": "7B coding model - alternative to CodeLlama",
            "model_id": "bigcode/starcoder2-7b",
            "size": "7B",
            "pricing": {"input": 0.0, "output": 0.0}
        },
        "deepseek-coder-1.3b-instruct": {
            "name": "DeepSeek Coder 1.3B Instruct",
            "description": "1.3B parameter model - fast and lightweight",
            "model_id": "deepseek-ai/deepseek-coder-1.3b-instruct",
            "size": "1.3B",
            "pricing": {"input": 0.0, "output": 0.0}
        },
        "deepseek-coder-6.7b-instruct": {
            "name": "DeepSeek Coder 6.7B Instruct",
            "description": "6.7B parameter model - good balance of speed and quality",
            "model_id": "deepseek-ai/deepseek-coder-6.7b-instruct",
            "size": "6.7B",
            "pricing": {"input": 0.0, "output": 0.0}
        },
        "deepseek-coder-33b-instruct": {
            "name": "DeepSeek Coder 33B Instruct",
            "description": "33B parameter model - highest quality, requires more resources",
            "model_id": "deepseek-ai/deepseek-coder-33b-instruct",
            "size": "33B",
            "pricing": {"input": 0.0, "output": 0.0}
        }
    }
    
    def __init__(self, model: str = "deepseek-coder-1.3b-instruct", preload: bool = True, keep_in_memory: bool = True):
        super().__init__(model)
        
        if not HAS_TORCH:
            raise ImportError("PyTorch and transformers are required. Install with: pip install torch transformers")
        
        # Validate model
        if model not in self.AVAILABLE_MODELS:
            print(f"Warning: Model '{model}' not available. Using 'deepseek-coder-1.3b-instruct' as fallback.")
            self.model = "deepseek-coder-1.3b-instruct"
        
        # Model components
        self.tokenizer = None
        self.model_instance = None
        self.device = self._get_device()
        
        # Memory management options
        self._model_loaded = False
        self._loaded_model_name = None  # Track which model is currently loaded
        self.keep_in_memory = keep_in_memory
        self._memory_usage: Dict[str, float] = {}
        
        print(f"LocalClient initialized with model: {self.model} on device: {self.device}")
        print(f"Keep in memory: {keep_in_memory}")
        
        # Preload model by default during startup
        if preload:
            print("Preloading model during startup...")
            self.preload_model()
    
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
        # Check if we need to reload due to model change
        if self._model_loaded and self._loaded_model_name == self.model:
            return
        
        # If a different model is loaded, unload it first
        if self._model_loaded and self._loaded_model_name != self.model:
            print(f"Model mismatch detected. Loaded: {self._loaded_model_name}, Requested: {self.model}")
            print("Unloading current model...")
            self.unload_model()
        
        model_info = self.AVAILABLE_MODELS[self.model]
        model_id = model_info["model_id"]
        
        print(f"Loading model {model_id}... This may take a few minutes on first run.")
        print(f"Device: {self.device}")
        print(f"PyTorch available: {HAS_TORCH}")
        print(f"Quantization available: {HAS_BITSANDBYTES}")
        if torch.cuda.is_available():
            print(f"CUDA memory: {torch.cuda.get_device_properties(0).total_memory / 1e9:.1f}GB")
        
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
            
            # Build loading strategies based on available hardware and libraries
            loading_strategies = []
            
            # Add quantization strategies only if bitsandbytes is available and using CUDA
            if self.device == "cuda" and HAS_BITSANDBYTES:
                loading_strategies.extend([
                    # Strategy 1: 8-bit quantization with CPU offload
                    {
                        "name": "8-bit quantized with CPU offload",
                        "kwargs": {
                            "trust_remote_code": True,
                            "torch_dtype": torch.float16,
                            "load_in_8bit": True,
                            "device_map": "auto",
                            "llm_int8_enable_fp32_cpu_offload": True
                        }
                    },
                    # Strategy 2: 8-bit quantization without CPU offload
                    {
                        "name": "8-bit quantized",
                        "kwargs": {
                            "trust_remote_code": True,
                            "torch_dtype": torch.float16,
                            "load_in_8bit": True,
                            "device_map": "auto"
                        }
                    }
                ])
            
            # Add standard strategies
            if self.device == "cuda":
                loading_strategies.append({
                    "name": "half precision on GPU",
                    "kwargs": {
                        "trust_remote_code": True,
                        "torch_dtype": torch.float16,
                        "device_map": "auto"
                    }
                })
            elif self.device == "mps":
                loading_strategies.append({
                    "name": "float32 on MPS",
                    "kwargs": {
                        "trust_remote_code": True,
                        "torch_dtype": torch.float32
                    }
                })
            
            # Always add CPU fallback
            loading_strategies.append({
                "name": "CPU fallback",
                "kwargs": {
                    "trust_remote_code": True,
                    "torch_dtype": torch.float32
                }
            })
            
            if not loading_strategies:
                raise RuntimeError("No suitable loading strategies available")
            
            model_loaded = False
            for strategy in loading_strategies:
                try:
                    print(f"Trying {strategy['name']}...")
                    self.model_instance = AutoModelForCausalLM.from_pretrained(
                        model_id,
                        **strategy["kwargs"]
                    )
                    
                    # Move to device if not using device_map
                    if "device_map" not in strategy["kwargs"]:
                        self.model_instance = self.model_instance.to(self.device)
                    
                    print(f"✓ Successfully loaded with {strategy['name']}")
                    model_loaded = True
                    break
                    
                except Exception as e:
                    print(f"✗ Failed with {strategy['name']}: {str(e)[:100]}...")
                    if self.model_instance:
                        del self.model_instance
                        self.model_instance = None
                    # Clear GPU cache before trying next strategy
                    if torch.cuda.is_available():
                        torch.cuda.empty_cache()
                    continue
            
            if not model_loaded:
                raise RuntimeError("Failed to load model with any strategy")
            
            self.model_instance.eval()  # Set to evaluation mode
            self._model_loaded = True
            self._loaded_model_name = self.model  # Track which model is loaded
            
            print(f"✓ Model {model_id} loaded successfully on {self.device}")
            
            # Record memory usage
            self._record_memory_usage()
            
        except Exception as e:
            raise RuntimeError(f"Failed to load model {model_id}: {str(e)}")
    
    def preload_model(self):
        """Preload the model into memory for faster inference."""
        try:
            print(f"Preloading {self.model}...")
            self._load_model()
            print(f"✓ Model {self.model} preloaded successfully")
        except Exception as e:
            print(f"✗ Failed to preload model {self.model}: {str(e)}")
    
    def _record_memory_usage(self):
        """Record current memory usage."""
        if torch.cuda.is_available():
            self._memory_usage = {
                "gpu_allocated": torch.cuda.memory_allocated() / 1e9,  # GB
                "gpu_reserved": torch.cuda.memory_reserved() / 1e9,    # GB
                "gpu_max_allocated": torch.cuda.max_memory_allocated() / 1e9  # GB
            }
        elif HAS_PSUTIL:
            process = psutil.Process()
            self._memory_usage = {
                "cpu_memory": process.memory_info().rss / 1e9  # GB
            }
        else:
            self._memory_usage = {
                "memory_monitoring": 0.0  # Fallback when psutil is not available
            }
    
    def generate_tests(self, prompt: str, temperature: float = 0.3) -> TestGenerationResult:
        """Generate unit tests using local models directly with PyTorch."""
        self._start_timer()
        
        try:
            # Load model if not already loaded
            self._load_model()
            
            # Check if model and tokenizer are properly loaded
            if not self.tokenizer or not self.model_instance:
                return self._create_error_result("Model or tokenizer not loaded properly")
            
            # Format prompt to ensure code-only output
            formatted_prompt = f"""<|system|>
You are a coding assistant. Return only the test code - no explanations, no markdown, no triple backticks in english

<|user|>
{prompt}

<|assistant|>
"""
            
            # Tokenize input
            inputs = self.tokenizer(
                formatted_prompt,
                return_tensors="pt",
                truncation=True,
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
            
            result = TestGenerationResult(
                tests=generated_text,
                tokens_used=tokens_used,
                estimated_cost=estimated_cost,
                time_taken=time_taken
            )
            
            # Optionally unload model to free memory
            if not self.keep_in_memory:
                print("Unloading model from memory...")
                self.unload_model()
            
            return result
            
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
    
    def is_correct_model_loaded(self) -> bool:
        """Check if the correct model is loaded and ready for use."""
        return self._model_loaded and self._loaded_model_name == self.model
    
    def get_model_info(self) -> Dict[str, Any]:
        """Get information about the current model."""
        model_info: Dict[str, Any] = self.AVAILABLE_MODELS[self.model].copy()
        model_info["loaded"] = self._model_loaded
        model_info["loaded_model_name"] = self._loaded_model_name
        model_info["current_model"] = self.model
        model_info["model_match"] = self._loaded_model_name == self.model if self._model_loaded else False
        model_info["device"] = self.device
        model_info["torch_available"] = HAS_TORCH
        model_info["keep_in_memory"] = self.keep_in_memory
        model_info["memory_usage"] = self._memory_usage.copy()
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
        self._loaded_model_name = None  # Clear loaded model tracking
        
        # Clear GPU cache if using CUDA
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
        
        print("Model unloaded from memory")
    
    def get_memory_usage(self) -> Dict[str, float]:
        """Get current memory usage statistics."""
        self._record_memory_usage()
        return self._memory_usage.copy()
    
    def switch_model(self, new_model: str, preload: bool = False):
        """Switch to a different model, optionally preloading it."""
        if new_model not in self.AVAILABLE_MODELS:
            raise ValueError(f"Model '{new_model}' not available. Available models: {list(self.AVAILABLE_MODELS.keys())}")
        
        # Check if we're already using this model
        if new_model == self.model:
            print(f"Already using model: {new_model}")
            if preload and not self._model_loaded:
                self.preload_model()
            return
        
        # Unload current model if loaded
        if self._model_loaded:
            print(f"Unloading current model: {self._loaded_model_name}")
            self.unload_model()
        
        # Switch to new model
        old_model = self.model
        self.model = new_model
        print(f"Switched from {old_model} to {self.model}")
        
        # Preload if requested
        if preload:
            self.preload_model()
    
    def get_available_models_info(self) -> Dict[str, Any]:
        """Get detailed information about all available models."""
        models_info: Dict[str, Any] = {}
        for model_key, model_data in self.AVAILABLE_MODELS.items():
            models_info[model_key] = model_data.copy()
            # Add runtime status information
            models_info[model_key].update({
                "is_current": model_key == self.model,
                "is_loaded": model_key == self.model and self._model_loaded
            })
        return models_info
