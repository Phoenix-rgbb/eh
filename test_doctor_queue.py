import requests
import json

# Test script to verify doctor queue access
BASE_URL = "http://localhost:8000"

def test_doctor_queue_access():
    # First, login as a doctor
    login_data = {
        "email": "way60@gmail.com",  # Doctor email from logs
        "password": "123456"  # Try different password
    }
    
    print("=== Testing Doctor Queue Access ===")
    print(f"1. Logging in as doctor: {login_data['email']}")
    
    try:
        # Login
        login_response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
        print(f"Login status: {login_response.status_code}")
        
        if login_response.status_code == 200:
            token = login_response.json()["access_token"]
            print(f"Login successful! Token: {token[:50]}...")
            
            # Test queue access
            headers = {"Authorization": f"Bearer {token}"}
            print("\n2. Testing queue access...")
            
            queue_response = requests.get(f"{BASE_URL}/queues/api/queue", headers=headers)
            print(f"Queue access status: {queue_response.status_code}")
            print(f"Queue response: {queue_response.text}")
            
            if queue_response.status_code == 200:
                queue_data = queue_response.json()
                print(f"Queue data: {json.dumps(queue_data, indent=2)}")
                print(f"Number of patients in queue: {len(queue_data)}")
            else:
                print(f"Queue access failed: {queue_response.text}")
        else:
            print(f"Login failed: {login_response.text}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_doctor_queue_access()
