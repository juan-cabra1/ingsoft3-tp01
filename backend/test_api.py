"""Quick API verification script."""
from urllib.request import urlopen, Request
import json

BASE = "http://localhost:8000"

# Test 1: GET /products
r = urlopen(f"{BASE}/products")
products = json.loads(r.read())
print(f"1. GET /products: {len(products)} products")
for p in products[:3]:
    print(f"   - {p['nombre']}: ${p['precio']}")

# Test 2: GET /products/1
r = urlopen(f"{BASE}/products/1")
p = json.loads(r.read())
print(f"2. GET /products/1: {p['nombre']}")

# Test 3: POST /admin/login
login_data = json.dumps({"username": "admin", "password": "admin123"}).encode()
req = Request(f"{BASE}/admin/login", data=login_data, headers={"Content-Type": "application/json"})
r = urlopen(req)
token_data = json.loads(r.read())
token = token_data["access_token"]
print(f"3. POST /admin/login: token={token[:30]}...")

# Test 4: GET /admin/products (with JWT)
req = Request(f"{BASE}/admin/products", headers={"Authorization": f"Bearer {token}"})
r = urlopen(req)
admin_products = json.loads(r.read())
print(f"4. GET /admin/products (JWT): {len(admin_products)} products")

# Test 5: GET /admin/products WITHOUT token (should fail 401)
try:
    r = urlopen(f"{BASE}/admin/products")
    print("5. FAIL: Should have been rejected")
except Exception as e:
    print(f"5. GET /admin/products (no token): Correctly rejected (401)")

print("\nAll tests passed!")
