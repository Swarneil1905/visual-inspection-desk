# Fieldwork Inspection

An inspection workspace for product returns. Angular presents image evidence and human observations. C#/.NET decodes and bounds uploads, a C++ library computes photographic readiness, and Python/PyTorch trains an optional binary defect model for ONNX inference.

## Run locally

Open this folder in Cursor or open the parent Fieldwork.code-workspace.

### Docker

Start Docker Desktop, then run `docker compose up --build` from this folder. Open http://localhost:8081.

### Native development

Requires .NET 10 SDK, Visual Studio C++ build tools (or CMake and a C++17 compiler), and Node.js 22.22 or newer.

From a Visual Studio x64 Native Tools terminal, enter the native folder and run:

```text
cl /EHsc /std:c++17 /LD quality.cpp /Fe:image_quality.dll
cl /EHsc /std:c++17 test_quality.cpp quality.cpp /Fe:quality_test.exe
quality_test.exe
```

From the project root:

```powershell
dotnet build api/Inspection.Api.csproj -c Release
Copy-Item native/image_quality.dll api/bin/Release/net10.0/image_quality.dll
dotnet api/bin/Release/net10.0/Inspection.Api.dll
```

In a second terminal:

```powershell
cd frontend
npm ci
npm start
```

Open http://localhost:4201. Upload a photograph, review readiness, record visible observations, and export the JSON record. Photographs are processed in memory and are not included in exports or saved by the API.

## Optional model training

No trained model or representative dataset is included. The working default is photographic readiness plus human review.

```powershell
python -m venv .venv
.venv\Scripts\python.exe -m pip install -r ml/requirements.txt
.venv\Scripts\python.exe ml/train.py --data data --output models --epochs 12
```

Data directories must be `data/train/damaged`, `data/train/intact`, with the same classes under validation and test. Split by physical item so views of one item cannot leak across splits. The tool rejects byte-identical files across splits, but cannot detect all related photographs. Use only images you are authorized to process.

The script trains a small original CNN, selects its checkpoint using validation accuracy, evaluates the test split, exports ONNX and checks numerical parity. Its manifest sets validated=true only when test support is at least 20 per class, precision at the 0.8 score threshold is at least 0.9 per class, and coverage is at least 0.5. These are a minimum artifact gate, not proof of production reliability or calibrated probabilities.

Set DEFECT_MODEL_PATH to the absolute path of defect.onnx. Keep defect.json beside it. The .NET API checks the model hash and manifest, then abstains on poor image readiness, incompatible orientation, low score or model failure. Human review remains required.

## Tests

Native tests exercise brightness, edge variance and invalid buffers. The .NET API build passes. Integration tests cover a valid image, corrupt input, spoofed extension and pixel limits.

```powershell
.venv\Scripts\python.exe -m pip install httpx
.venv\Scripts\python.exe -m pytest ml -q
# With the API running:
.venv\Scripts\python.exe -m pytest tests -q
```

The browser interface was visually inspected. Automated browser file selection was blocked by the Chrome extension's file URL permission; the same upload path was verified directly over HTTP. tests/fixtures/calibration.png is a synthetic quality fixture, not training evidence or a defect prediction.

Docker Compose configuration validates. Container images were not built because the Docker daemon is unavailable. Railway deployment and real dataset validation remain deferred.
