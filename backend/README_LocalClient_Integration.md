# LocalClient API Integration

This document describes the updated `LocalClient` that integrates with FastAPI endpoints for model discovery and text generation.

## Overview

The `LocalClient` has been enhanced to:

1. Use the `API_LOCAL_MODELS` environment variable to configure the API endpoint
2. Fetch available models from the `/models` endpoint
3. Use the `/generate` endpoint for text generation
4. Fall back to direct Ollama API calls if the API is unavailable

## Environment Configuration

Set the `API_LOCAL_MODELS` environment variable to point to your FastAPI server:

```bash
export API_LOCAL_MODELS="http://localhost:14000"
```

If not set, it defaults to `http://localhost:14000`.

## API Endpoints

The LocalClient expects the following endpoints to be available:

### GET /models

Returns available models in the format:

```json
{
  "models_by_provider": {
    "local": {
      "name": "Local (Meta)",
      "description": "Open source models via Ollama",
      "models": [
        {
          "id": "codellama",
          "name": "Code Llama",
          "description": "Code-specialized model (recommended)"
        }
      ]
    }
  }
}
```

### POST /generate

Accepts generation requests:

```json
{
  "prompt": "Write a Python function",
  "model": "codellama",
  "temperature": 0.3
}
```

Returns generation results:

```json
{
  "text": "Generated text here...",
  "tokens_used": 150,
  "estimated_cost": 0.0,
  "time_taken": 2.5,
  "model_name": "codellama"
}
```

## Usage Examples

### Basic Usage

```python
from llm_client.local_client import LocalClient

# Create client (uses API_LOCAL_MODELS env var)
client = LocalClient()

# Generate tests
result = client.generate_tests("Write a function to add two numbers")
print(result.tests)
```

### Custom API URL

```python
# Override API URL
client = LocalClient(base_url="http://my-server:8000")

# Use specific model
client = LocalClient(model="llama2:7b")
```

### Get Available Models

```python
# Get models from API
models = client.get_available_models()
for model_id, info in models.items():
    print(f"{model_id}: {info['name']}")
```

## Fallback Behavior

The LocalClient implements a robust fallback strategy:

1. **API First**: Tries to use the configured API endpoints
2. **Direct Ollama**: Falls back to direct Ollama API calls
3. **Default Models**: Uses hardcoded model list if API is unavailable

## Caching

Model information is cached for 5 minutes to reduce API calls. The cache is automatically refreshed when expired.

## Error Handling

The client gracefully handles various error conditions:

- API server unavailable
- Network timeouts
- Invalid responses
- Missing models

All errors are logged with appropriate fallback behavior.

## Testing

Run the integration test to verify everything works:

```bash
cd backend
python test_local_client_integration.py
```

This will test:

- Environment variable configuration
- Model discovery
- Text generation
- API endpoint connectivity

## Configuration

### Environment Variables

- `API_LOCAL_MODELS`: URL of the FastAPI server (default: http://localhost:14000)

### Constructor Parameters

- `base_url`: Override API URL (optional)
- `model`: Model to use for generation (default: "codellama")

## Integration with Existing Code

The LocalClient maintains backward compatibility with existing code:

```python
# Old way still works
client = LocalClient()
result = client.generate("Hello world")

# New way with full result object
result = client.generate_tests("Hello world")
print(f"Tokens: {result.tokens_used}")
print(f"Time: {result.time_taken}s")
print(f"Text: {result.tests}")
```
