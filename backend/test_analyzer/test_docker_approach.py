#!/usr/bin/env python3
"""
Test script for Docker-based test analyzer approach.
"""

import os
import sys

# Add the parent directory to the path so we can import the test_analyzer module
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from test_analyzer import docker_client, get_test_analyzer


def test_python_analyzer():
    """Test the Python analyzer with Docker."""
    print("Testing Python analyzer...")
    
    source_code = """
def add(a, b):
    return a + b

def subtract(a, b):
    return a - b

def multiply(a, b):
    return a * b
"""

    test_code = """
import unittest
from source import add, subtract

class TestMath(unittest.TestCase):
    def test_add(self):
        self.assertEqual(add(2, 3), 5)
    
    def test_subtract(self):
        self.assertEqual(subtract(5, 3), 2)

if __name__ == '__main__':
    unittest.main()
"""

    try:
        analyzer = get_test_analyzer("python")
        result = analyzer.analyze_coverage(source_code, test_code)
        
        print(f"Python Analysis Result:")
        print(f"  Coverage: {result.coverage_percentage:.2f}%")
        print(f"  Lines: {result.lines_covered}/{result.lines_total}")
        print(f"  Time taken: {result.time_taken:.2f}s")
        print(f"  Test execution success: {result.test_execution_success}")
        print(f"  Tests passed: {result.tests_passed}/{result.tests_total}")
        
        if result.error_message:
            print(f"  Error: {result.error_message}")
        
        return result.coverage_percentage > 0
        
    except Exception as e:
        print(f"Error testing Python analyzer: {str(e)}")
        return False


def test_javascript_analyzer():
    """Test the JavaScript analyzer with Docker."""
    print("\nTesting JavaScript analyzer...")
    
    source_code = """
function add(a, b) {
    return a + b;
}

function subtract(a, b) {
    return a - b;
}

function multiply(a, b) {
    return a * b;
}
"""

    test_code = """
const { add, subtract } = require('./source.js');

test('add should work', () => {
    expect(add(2, 3)).toBe(5);
});

test('subtract should work', () => {
    expect(subtract(5, 3)).toBe(2);
});
"""

    try:
        analyzer = get_test_analyzer("jest")
        result = analyzer.analyze_coverage(source_code, test_code)
        
        print(f"JavaScript Analysis Result:")
        print(f"  Coverage: {result.coverage_percentage:.2f}%")
        print(f"  Lines: {result.lines_covered}/{result.lines_total}")
        print(f"  Time taken: {result.time_taken:.2f}s")
        print(f"  Test execution success: {result.test_execution_success}")
        print(f"  Tests passed: {result.tests_passed}/{result.tests_total}")
        
        if result.error_message:
            print(f"  Error: {result.error_message}")
        
        return result.coverage_percentage > 0
        
    except Exception as e:
        print(f"Error testing JavaScript analyzer: {str(e)}")
        return False


def main():
    """Main test function."""
    print("Testing Docker-based test analyzer approach...")
    print("=" * 50)
    
    # Check if Docker is available
    if not docker_client.check_docker_available():
        print("ERROR: Docker is not available or not running!")
        print("Please ensure Docker is installed and running.")
        return False
    
    print("✓ Docker is available")
    
    # Test Python analyzer
    python_success = test_python_analyzer()
    
    # Test JavaScript analyzer
    javascript_success = test_javascript_analyzer()
    
    print("\n" + "=" * 50)
    print("Test Results:")
    print(f"  Python analyzer: {'✓ PASS' if python_success else '✗ FAIL'}")
    print(f"  JavaScript analyzer: {'✓ PASS' if javascript_success else '✗ FAIL'}")
    
    if python_success and javascript_success:
        print("\n🎉 All tests passed! Docker-based approach is working correctly.")
        return True
    else:
        print("\n❌ Some tests failed. Please check the error messages above.")
        return False


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1) 