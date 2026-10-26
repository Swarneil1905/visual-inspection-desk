# Visual Inspection Desk

Review product return photographs, check whether the images are usable, and export a structured inspection record. An optional trained model can add a defect prediction alongside the human review.

[Live demo](https://visual-inspection-desk-production.up.railway.app) · [CI](https://github.com/Swarneil1905/visual-inspection-desk/actions) · [Architecture](docs/architecture.md) · [Verification notes](docs/verification.md) · [MIT license](LICENSE)

Add up to 10 photographs to a review queue, zoom each image, record observations and choose a decision. Completed reviews can be exported together as JSON. Photos and drafts stay in the current tab and are cleared when it closes.

## What you can do

- Upload a JPEG, PNG or WebP photograph and inspect it alongside image quality measurements.
- Check brightness, edge detail and resolution before making an assessment.
- Record visible observations and reviewer notes.
- Export the review as JSON without embedding the photograph.
- Optionally load a validated ONNX model for a damaged or intact prediction, with abstention when the evidence is insufficient.

The default workflow is image quality measurement plus human review. No trained defect model or representative training dataset is included. Image quality measurements do not establish whether a product is damaged.

## How it works

```text
Angular interface → .NET API → C++ image quality measurements
                            → Optional ONNX defect inference
Python / PyTorch training → ONNX model + validation manifest
```

| Component | Responsibility |
| --- | --- |
| Angular | Image preview, observations, notes and JSON export |
| C# / .NET | Bounded uploads, image decoding and inference orchestration |
| C++ | Brightness and edge detail measurements |
| Python / PyTorch | Optional model training, evaluation and ONNX export |
| ONNX Runtime | Optional model inference within the API |

Uploads are limited to 10 MB and 20 megapixels. The API processes photographs in memory and does not save them. At most two inspections run concurrently.

## Quick start with Docker

Requires Docker Desktop or Docker Engine with Compose. From the repository root:

```sh
docker compose up --build
```

Open **http://localhost:8081**. Upload a photograph, review its quality, record observations and export the result. Stop the stack with `docker compose down`.

## Run without Docker on Windows

Requires .NET 10 SDK, Visual Studio C++ build tools and Node.js 22.22+.

From a Visual Studio **x64 Native Tools** terminal, enter the repository's `native` directory:

```bat
cl /EHsc /std:c++17 /LD quality.cpp /Fe:image_quality.dll
cl /EHsc /std:c++17 test_quality.cpp quality.cpp /Fe:quality_test.exe
quality_test.exe
```

From the repository root in PowerShell:

```powershell
dotnet build api/Inspection.Api.csproj -c Release
Copy-Item native/image_quality.dll api/bin/Release/net10.0/image_quality.dll
dotnet api/bin/Release/net10.0/Inspection.Api.dll
```

In a separate terminal:

```sh
cd frontend
npm ci
npm start
```

Open **http://localhost:4201**. The API listens on port **8001**. CMake is also supported for building and testing the native library; the Dockerfile and CI workflow show the Linux setup.

## Optional defect model

Install the training dependencies in a separate Python environment:

```powershell
python -m venv .venv
.venv\Scripts\python.exe -m pip install -r ml/requirements.txt
.venv\Scripts\python.exe ml/train.py --data data --output models --epochs 12
```

On macOS or Linux, use `.venv/bin/python` instead. Prepare this directory structure:

```text
data/
  train/       damaged/  intact/
  validation/  damaged/  intact/
  test/        damaged/  intact/
```

Each split contains two class directories. Split by physical item so that photographs of the same item do not cross between training, validation and test sets. The training script rejects byte identical files across splits but cannot detect every related photograph.

Training selects a checkpoint using validation accuracy, evaluates the held out test split, exports ONNX and checks numerical parity. The manifest passes its artifact gate only when:

- The test split has at least 20 examples per class.
- Precision is at least 0.9 per class at the 0.8 score threshold.
- Prediction coverage is at least 0.5.

These checks are not proof of production reliability or calibrated probabilities. Set `DEFECT_MODEL_PATH` to the absolute path of `defect.onnx` and keep `defect.json` beside it. The API checks the manifest and model hash, then abstains for poor image quality, incompatible orientation, low score or inference failure. Human review remains required.

The default Compose file does not mount a trained model. Add a model volume and `DEFECT_MODEL_PATH` when enabling inference in a container.

## API

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Service health |
| POST | `/api/inspection/quality` | Multipart image upload for quality checks and optional inference |

## Development checks

After installing the training dependencies:

```powershell
.venv\Scripts\python.exe -m pip install httpx
.venv\Scripts\python.exe -m pytest ml -q
# With the API running:
.venv\Scripts\python.exe -m pytest tests -q
cd frontend
npm run build
```

Native tests cover brightness, edges and invalid buffers. HTTP tests cover valid images, corrupt files, spoofed extensions and oversized images. Model tests cover export parity, duplicate data and abstention. GitHub Actions also builds the frontend, .NET API and containers.

The synthetic image at `tests/fixtures/calibration.png` is a quality test fixture, not training evidence. See the [verification notes](docs/verification.md) for test results and browser verification limits.

## Repository guide

| Path | Contents |
| --- | --- |
| `frontend/src/inspection.ts` | Image review and export workflow |
| `api/Program.cs` | Upload validation, native interop and optional inference |
| `native/` | C++ measurements, CMake configuration and tests |
| `ml/` | PyTorch training, export and model contract tests |
| `tests/` | HTTP integration tests and a synthetic image fixture |
| `docs/` | Architecture, design provenance and verification details |

The public demo uses bounded uploads and a rate limited gateway. Representative dataset validation remains required for meaningful defect predictions. See [deployment and operations](docs/deployment.md).

## License

Original project code is licensed under the [MIT License](LICENSE), copyright © 2026 Swarneil Pradhan. Bundled DM Sans and Instrument Serif fonts retain their SIL Open Font Licenses in [`frontend/public/fonts`](frontend/public/fonts). Third party dependencies retain their respective licenses.
