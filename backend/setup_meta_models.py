#!/usr/bin/env python3
"""
Setup script for Meta open source models with Ollama.
This script helps users install and configure Meta models for the unit test generation platform.
"""

import subprocess
import sys
import time
from typing import Dict, List

import requests

# Import LocalClient to get available models
try:
    from llm_client.local_client import LocalClient
    META_MODELS = LocalClient.get_available_models()
except ImportError:
    # Fallback if LocalClient is not available
    META_MODELS = {
        "codellama": {
            "name": "Code Llama",
            "description": "Code-specialized model (recommended)"
        },
        "codellama:7b": {
            "name": "Code Llama 7B", 
            "description": "Smaller, faster code model"
        },
        "codellama:13b": {
            "name": "Code Llama 13B",
            "description": "Balanced code model"
        },
        "codellama:34b": {
            "name": "Code Llama 34B",
            "description": "Largest, most capable code model"
        },
        "llama2": {
            "name": "Llama 2",
            "description": "General purpose model"
        },
        "llama2:7b": {
            "name": "Llama 2 7B",
            "description": "Smaller, faster model"
        },
        "llama2:13b": {
            "name": "Llama 2 13B",
            "description": "Larger, more capable model"
        },
        "llama2:70b": {
            "name": "Llama 2 70B",
            "description": "Largest, most capable model"
        }
    }

def check_ollama_installed() -> bool:
    """Check if Ollama is installed."""
    try:
        result = subprocess.run(["ollama", "--version"], capture_output=True, text=True)
        return result.returncode == 0
    except FileNotFoundError:
        return False

def install_ollama():
    """Install Ollama if not already installed."""
    print("🔧 Installing Ollama...")
    
    if sys.platform == "darwin":  # macOS
        subprocess.run(["curl", "-fsSL", "https://ollama.ai/install.sh", "|", "sh"], shell=True)
    elif sys.platform.startswith("linux"):  # Linux
        subprocess.run(["curl", "-fsSL", "https://ollama.ai/install.sh", "|", "sh"], shell=True)
    elif sys.platform == "win32":  # Windows
        print("Please install Ollama from: https://ollama.ai/download")
        return False
    else:
        print(f"Unsupported platform: {sys.platform}")
        return False
    
    print("✅ Ollama installed successfully!")
    return True

def start_ollama_server():
    """Start the Ollama server."""
    print("🚀 Starting Ollama server...")
    
    try:
        # Check if server is already running
        response = requests.get("http://localhost:11434/api/tags", timeout=5)
        if response.status_code == 200:
            print("✅ Ollama server is already running!")
            return True
    except requests.exceptions.RequestException:
        pass
    
    # Start server in background
    try:
        subprocess.Popen(["ollama", "serve"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        print("⏳ Waiting for Ollama server to start...")
        
        # Wait for server to be ready
        for i in range(30):  # Wait up to 30 seconds
            try:
                response = requests.get("http://localhost:11434/api/tags", timeout=5)
                if response.status_code == 200:
                    print("✅ Ollama server started successfully!")
                    return True
            except requests.exceptions.RequestException:
                pass
            time.sleep(1)
        
        print("❌ Failed to start Ollama server")
        return False
        
    except Exception as e:
        print(f"❌ Error starting Ollama server: {e}")
        return False

def list_installed_models() -> List[str]:
    """List currently installed models."""
    try:
        response = requests.get("http://localhost:11434/api/tags", timeout=10)
        if response.status_code == 200:
            data = response.json()
            return [model["name"] for model in data.get("models", [])]
    except Exception:
        pass
    return []

def install_model(model_name: str) -> bool:
    """Install a specific Meta model."""
    print(f"📥 Installing {model_name}...")
    
    try:
        # Start the pull process
        process = subprocess.Popen(
            ["ollama", "pull", model_name],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        
        # Monitor progress
        if process.stdout:
            while True:
                output = process.stdout.readline()
                if output == '' and process.poll() is not None:
                    break
                if output:
                    print(f"   {output.strip()}")
        
        if process.returncode == 0:
            print(f"✅ {model_name} installed successfully!")
            return True
        else:
            print(f"❌ Failed to install {model_name}")
            return False
            
    except Exception as e:
        print(f"❌ Error installing {model_name}: {e}")
        return False

def main():
    """Main setup function."""
    print("🤖 Meta Open Source Models Setup for Unit Test Generation")
    print("=" * 60)
    
    # Check if Ollama is installed
    if not check_ollama_installed():
        print("❌ Ollama is not installed.")
        install_choice = input("Would you like to install Ollama? (y/n): ").lower()
        if install_choice == 'y':
            if not install_ollama():
                print("❌ Failed to install Ollama. Please install manually from https://ollama.ai")
                return
        else:
            print("Please install Ollama manually from https://ollama.ai")
            return
    
    # Start Ollama server
    if not start_ollama_server():
        print("❌ Failed to start Ollama server")
        return
    
    # List installed models
    installed_models = list_installed_models()
    print(f"\n📋 Currently installed models: {installed_models}")
    
    # Show available Meta models
    print("\n🎯 Available Meta Models:")
    for model_id, model_info in META_MODELS.items():
        status = "✅ Installed" if model_id in installed_models else "❌ Not installed"
        print(f"  {model_info['name']:<20} - {model_info['description']}")
        print(f"  {'':20}   {status}")
    
    # Ask user which model to install
    print("\n💡 Recommendation: Install 'codellama' for best code generation results")
    model_choice = input("\nWhich model would you like to install? (or 'all' for all models): ").strip()
    
    if model_choice.lower() == 'all':
        print("\n📥 Installing all Meta models (this may take a while)...")
        for model_id in META_MODELS.keys():
            if model_id not in installed_models:
                install_model(model_id)
            else:
                print(f"✅ {META_MODELS[model_id]['name']} already installed")
    elif model_choice in META_MODELS:
        if model_choice not in installed_models:
            install_model(model_choice)
        else:
            print(f"✅ {META_MODELS[model_choice]['name']} is already installed")
    else:
        print(f"❌ Unknown model: {model_choice}")
        print(f"Available models: {list(META_MODELS.keys())}")
        return
    
    # Final status
    print("\n🎉 Setup complete!")
    print("\n📝 Next steps:")
    print("1. Start your unit test generation platform")
    print("2. Select 'local' as the provider")
    print("3. Choose your installed Meta model")
    print("4. Generate tests!")
    
    print(f"\n🔧 To manually manage models:")
    print("  - List models: ollama list")
    print("  - Remove model: ollama rm <model_name>")
    print("  - Start server: ollama serve")

if __name__ == "__main__":
    main() 