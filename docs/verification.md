# Verification record

Verified on 2026-10-25.

GitHub Actions passed the frontend, native C++, .NET API, PyTorch/ONNX contract, Compose containers and production gateway checks.

The live Railway smoke test uploaded the calibration PNG through the public HTTPS API, received all three quality checks, and rejected an invalid upload. A small burst of 30 read requests returned 14 successes and 16 rate-limit responses. The styled inspection interface was inspected in Chrome.

## Scope and limits

No representative labeled inspection dataset has been supplied. The live app measures image readiness and supports human inspection; it does not claim automated defect detection or accuracy. The model pipeline is optional and requires a validated dataset and checkpoint.

Browser file selection remains unverified because the Chrome automation extension does not have file access. The upload flow was verified directly over HTTPS. No browser permission was changed.

Production containers ran successfully in GitHub Actions and Railway. The local Docker engine was unavailable. Phone-sized browser rendering was not verified in this session.
