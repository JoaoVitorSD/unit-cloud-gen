#!/usr/bin/env python3
"""
Test script to verify model information from LLM clients.
"""

def test_model_information():
    """Test that model information is properly structured."""
    
    print("🧪 Testing Model Information Structure")
    print("=" * 50)
    
    # Test OpenAI Client
    try:
        from llm_client.openai_client import OpenAIClient
        openai_models = OpenAIClient.get_available_models()
        print(f"✅ OpenAI Models: {len(openai_models)} models found")
        
        for model_id, model_info in openai_models.items():
            print(f"  - {model_id}: {model_info['name']} - {model_info['description']}")
            
    except ImportError as e:
        print(f"❌ OpenAI Client import failed: {e}")
    
    print()
    
    # Test Local Client
    try:
        from llm_client.local_client import LocalClient
        local_models = LocalClient.get_available_models()
        print(f"✅ Local Models: {len(local_models)} models found")
        
        for model_id, model_info in local_models.items():
            print(f"  - {model_id}: {model_info['name']} - {model_info['description']}")
            
    except ImportError as e:
        print(f"❌ Local Client import failed: {e}")
    
    print()
    
    # Test API endpoint structure
    try:
        from app.main import get_models
        models_data = get_models()
        print("✅ API Models Endpoint Structure:")
        
        for provider_id, provider_info in models_data["models_by_provider"].items():
            print(f"  📁 {provider_info['name']} ({provider_id})")
            print(f"     Description: {provider_info['description']}")
            print(f"     Models: {len(provider_info['models'])}")
            
            for model in provider_info['models']:
                print(f"       - {model['id']}: {model['name']} - {model['description']}")
            print()
            
    except ImportError as e:
        print(f"❌ API endpoint test failed: {e}")
    
    print("🎉 Model information test completed!")

if __name__ == "__main__":
    test_model_information() 