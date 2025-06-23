# Meta Open Source Models Setup

This guide explains how to set up and use Meta's open source models (Llama 2, Code Llama) with the unit test generation platform.

## 🚀 Quick Start

### 1. Install Ollama

```bash
# macOS/Linux
curl -fsSL https://ollama.ai/install.sh | sh

# Windows
# Download from https://ollama.ai/download
```

### 2. Run Setup Script

```bash
cd backend
python setup_meta_models.py
```

### 3. Start Your Platform

```bash
# Start the backend
cd backend
python -m uvicorn app.main:app --reload

# Start the frontend
cd frontend
npm run dev
```

### 4. Use Meta Models

1. Open the web interface
2. Select "local" as the provider
3. Choose your installed Meta model
4. Generate tests!

## 🤖 Available Meta Models

### Code Llama (Recommended for Code Generation)

- `codellama` - Default Code Llama model
- `codellama:7b` - Smaller, faster (7B parameters)
- `codellama:13b` - Balanced (13B parameters)
- `codellama:34b` - Largest, most capable (34B parameters)

### Llama 2 (General Purpose)

- `llama2` - Default Llama 2 model
- `llama2:7b` - Smaller, faster (7B parameters)
- `llama2:13b` - Balanced (13B parameters)
- `llama2:70b` - Largest, most capable (70B parameters)

## 📋 Model Recommendations

### For Unit Test Generation

**Best Choice: `codellama`**

- Specialized for code generation
- Excellent at understanding programming languages
- Good balance of speed and capability

**Alternative: `codellama:13b`**

- Larger model with better reasoning
- Slower but more accurate
- Good for complex codebases

### For General Use

**Best Choice: `llama2:13b`**

- Good general-purpose capabilities
- Reasonable speed and accuracy
- Works well for various tasks

## 🔧 Manual Setup

### Install Ollama

```bash
# Check if installed
ollama --version

# Install if needed
curl -fsSL https://ollama.ai/install.sh | sh
```

### Start Ollama Server

```bash
ollama serve
```

### Install Models

```bash
# Install Code Llama (recommended)
ollama pull codellama

# Install other models
ollama pull llama2:13b
ollama pull codellama:7b
```

### List Installed Models

```bash
ollama list
```

## ⚙️ Configuration

### Local Client Settings

The `LocalClient` in `backend/llm_client/local_client.py` is configured with:

- **Default Model**: `codellama`
- **Base URL**: `http://localhost:14000/api/generate`
- **Cost**: Free (local models)
- **Timeout**: 120 seconds
- **Parameters**:
  - Temperature: 0.3
  - Top-p: 0.9
  - Top-k: 40
  - Repeat penalty: 1.1

### Custom Configuration

You can customize the client:

```python
from llm_client.local_client import LocalClient

# Use different model
client = LocalClient(model="codellama:13b")

# Use different server
client = LocalClient(base_url="http://192.168.1.100:14000/api/generate")
```

## 🐛 Troubleshooting

### Common Issues

**1. "Cannot connect to Ollama server"**

```bash
# Start Ollama server
ollama serve

# Check if running
curl http://localhost:14000/api/tags
```

**2. "Model not found"**

```bash
# List available models
ollama list

# Install missing model
ollama pull codellama
```

**3. "Request timed out"**

- Try a smaller model (e.g., `codellama:7b`)
- Check your system resources
- Increase timeout in the client

**4. "Out of memory"**

- Use smaller models (7B instead of 34B)
- Close other applications
- Add more RAM to your system

### Performance Tips

**For Faster Generation:**

- Use 7B models (`codellama:7b`, `llama2:7b`)
- Ensure adequate RAM (8GB+ for 7B models)
- Use SSD storage

**For Better Quality:**

- Use larger models (13B or 34B)
- Increase temperature slightly (0.4-0.5)
- Provide more context in prompts

## 🔒 Privacy & Security

### Advantages of Local Models

- ✅ **No data sent to external servers**
- ✅ **Complete privacy**
- ✅ **No API rate limits**
- ✅ **No usage costs**
- ✅ **Works offline**

### Considerations

- ⚠️ **Requires local computational resources**
- ⚠️ **Models can be large (several GB)**
- ⚠️ **May be slower than cloud APIs**

## 📊 Model Comparison

| Model           | Size | Speed     | Quality | RAM Required | Best For         |
| --------------- | ---- | --------- | ------- | ------------ | ---------------- |
| `codellama:7b`  | 7B   | Fast      | Good    | 8GB          | Quick iterations |
| `codellama:13b` | 13B  | Medium    | Better  | 16GB         | Balanced use     |
| `codellama:34b` | 34B  | Slow      | Best    | 32GB         | High quality     |
| `llama2:7b`     | 7B   | Fast      | Good    | 8GB          | General tasks    |
| `llama2:13b`    | 13B  | Medium    | Better  | 16GB         | General use      |
| `llama2:70b`    | 70B  | Very Slow | Best    | 64GB         | Maximum quality  |

## 🎯 Best Practices

1. **Start with Code Llama** for code-related tasks
2. **Use 7B models** for development and testing
3. **Use 13B+ models** for production quality
4. **Monitor system resources** during generation
5. **Keep Ollama updated** for best performance

## 📚 Additional Resources

- [Ollama Documentation](https://ollama.ai/docs)
- [Code Llama Paper](https://arxiv.org/abs/2308.12950)
- [Llama 2 Paper](https://arxiv.org/abs/2307.09288)
- [Meta AI Models](https://ai.meta.com/llama/)
