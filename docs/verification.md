# Local verification record

Verified on 2026-10-25 from the canonical Project subfolders.

| Check | Result |
| --- | --- |
| Angular production builds | All three passed |
| Django review, CSRF, rate limits, provider validation and token scope | 10 tests passed |
| Voice worker server deadline | 3 tests passed |
| LiveKit worker import against installed SDK | Passed |
| C++ image measurement contract | Executable checks passed |
| .NET API build | Passed with no warnings |
| Image API HTTP integration | 4 tests passed |
| PyTorch contract, abstention, split isolation and ONNX parity | 4 tests passed |
| Java catalog filters and query validation | 5 tests passed |
| Go ranking, profile, TTL, cache bound and input validation | 5 tests passed |
| Java + Go HTTP integration | 4 tests passed |
| Docker Compose configuration | All three validated |
| Browser text rehearsal | Passed against Django with exact answer evidence |
| Browser discovery | Ranking, save, dialog and Escape focus restoration verified |
| Browser inspection | Layout inspected; upload API verified separately |

35 Python, Go and Java tests passed, plus the C++ executable checks. This count does not imply paid-provider or real-dataset validation.

## Limits of this verification

* LiveKit credentials and AI credentials are absent. No live microphone conversation or paid model call was made.
* No representative labeled inspection dataset is present. No trained production defect model or accuracy claim is supplied.
* The ONNX parity test uses synthetic tensors solely to check numerical export behavior. The TorchScript export path emits upstream deprecation warnings; it is retained for the explicit ONNX opset 17 contract.
* Chrome's automation extension lacks file URL access, so browser file selection was not completed. No extension permission was changed. The .NET multipart upload boundary passed direct HTTP integration tests.
* The browser's viewport override did not change its reported viewport. Mobile CSS exists, but a phone-sized browser rendering was not verified in this session.
* Docker Desktop's Linux engine was unavailable. Compose syntax was checked; container images were not built or started here.
* Local test results do not imply that GitHub Actions has passed. Consult the repository Actions page for actual run results.
* Railway deployment is deferred at the user's request.

## Windows Java note

The installed portable JDK initially failed to create its internal socket under the default temporary path. Tests and the server passed when jdk.net.unixdomain.tmpdir pointed to api/.java-tmp. The Windows startup script includes this option.
