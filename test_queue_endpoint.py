import requests
import json

# Test the queue endpoint directly
BASE_URL = "http://localhost:8000"

def test_queue_endpoint():
    print("=== Testing Queue Endpoint Directly ===")
    
    # Test without authentication (should fail)
    print("1. Testing without authentication...")
    try:
        response = requests.get(f"{BASE_URL}/queues/api/queue")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Error: {e}")
    
    print("\n2. Testing with mock doctor role...")
    # We can't easily get a real token, but we can check if the endpoint exists
    # and see what error we get
    
    # Test the consultation queue endpoint (which works)
    print("\n3. Testing consultation queue endpoint (should work)...")
    try:
        response = requests.get(f"{BASE_URL}/api/queue/")
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Queue data: {json.dumps(data, indent=2)}")
            print(f"Number of patients: {len(data)}")
        else:
            print(f"Response: {response.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_queue_endpoint()
