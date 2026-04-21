from fastapi.testclient import TestClient
from app import app
import traceback

client = TestClient(app)

try:
    response = client.post("/api/auth/register", json={"email":"admin2@test.com", "password":"123"})
    print("STATUS:", response.status_code)
    print("RESPONSE:", response.json())
except Exception as e:
    print("EXCEPTION CAUGHT:")
    traceback.print_exc()
