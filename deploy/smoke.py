"""Exercise a production gateway and its real backend using only the standard library."""
import http.cookiejar
import json
import sys
import urllib.error
import urllib.request
from pathlib import Path

base = sys.argv[1].rstrip("/")
kind = "visual-inspection-desk"
jar = http.cookiejar.CookieJar()
client = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))

def request(path, data=None, headers=None):
    try:
        with client.open(urllib.request.Request(base + path, data=data, headers=headers or {}), timeout=45) as r:
            return r.status, r.read(), r.headers
    except urllib.error.HTTPError as r:
        return r.code, r.read(), r.headers

status, body, headers = request("/healthz")
assert status == 200 and json.loads(body)["status"] == "ok", (status, body)
status, body, headers = request("/")
assert status == 200 and b"<app-root" in body
assert headers.get("X-Frame-Options") == "DENY"
assert "frame-ancestors 'none'" in headers.get("Content-Security-Policy", "")
if kind == "voice-practice-coach":
    status, body, _ = request("/api/capabilities")
    assert status == 200 and json.loads(body)["text_review"]
    csrf = next(c.value for c in jar if c.name == "csrftoken")
    answer = json.dumps({"scenario":"cache","answer":"Use a short TTL and invalidate stale inventory. Timeouts fall back to the database."}).encode()
    status, _, _ = request("/api/practice/review", answer, {"Content-Type":"application/json", "Origin":base})
    assert status == 403, status
    status, body, _ = request("/api/practice/review", answer, {"Content-Type":"application/json", "X-CSRFToken":csrf, "Origin":base})
    assert status == 200 and json.loads(body)["coverage"], (status, body)
    status, _, _ = request("/api/voice/token", b'{"scenario":"cache","consent":false}', {"Content-Type":"application/json", "X-CSRFToken":csrf, "Origin":base})
    assert status in (400,503), status
elif kind == "visual-inspection-desk":
    boundary = "inspectionSmokeBoundary"
    image = (Path(__file__).resolve().parents[1]/"tests/fixtures/calibration.png").read_bytes()
    body = ("--"+boundary+'\r\nContent-Disposition: form-data; name="image"; filename="calibration.png"\r\nContent-Type: image/png\r\n\r\n').encode() + image + ("\r\n--"+boundary+"--\r\n").encode()
    status, response, _ = request("/api/inspection/quality", body, {"Content-Type":"multipart/form-data; boundary="+boundary})
    assert status == 200 and len(json.loads(response)["checks"]) == 3, (status, response)
    status, _, _ = request("/api/inspection/quality", b"invalid", {"Content-Type":"application/json"})
    assert status == 400
else:
    status, body, _ = request("/api/catalog?q=quiet%20desk%20lamp")
    products = json.loads(body)["products"]
    assert status == 200 and products[0]["id"] == "desk-lamp"
    assert all(p["stock"] > 0 for p in products)
    status, body, _ = request("/api/catalog?category=Workspace&budget=40")
    assert all(p["price"] <= 40 and p["category"] == "Workspace" for p in json.loads(body)["products"])
    status, _, _ = request("/api/catalog?budget=NaN")
    assert status == 400
print(kind + ": gateway, security headers, health and application flow passed")
