"""Integration tests against a running local .NET API and native library."""

import io, os
import httpx
from PIL import Image

BASE = os.getenv("INSPECTION_API", "http://127.0.0.1:8001")


def post(data):
    return httpx.post(
        BASE + "/api/inspection/quality",
        files={"image": ("sample.png", data, "image/png")},
    )


def test_corrupt_image_rejected():
    assert post(b"not an image").status_code == 400


def test_measurements_and_abstention():
    image = Image.new("RGB", (640, 480), (128, 128, 128))
    stream = io.BytesIO()
    image.save(stream, format="PNG")
    r = post(stream.getvalue())
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["width"] == 640
    assert 0.49 < data["brightness"] < 0.52
    assert data["sharpness"] < 0.001
    assert data["prediction"]["status"] == "unavailable"
    assert data["checks"][2]["passed"] is False


def test_extension_does_not_override_content():
    r = httpx.post(
        BASE + "/api/inspection/quality",
        files={"image": ("photo.jpg", b"<svg></svg>", "image/jpeg")},
    )
    assert r.status_code == 400


def test_pixel_limit_checked_before_decode():
    image = Image.new("1", (5000, 5000))
    stream = io.BytesIO()
    image.save(stream, format="PNG")
    assert post(stream.getvalue()).status_code == 400
