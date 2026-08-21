# Architecture and operating boundaries

This is a local single-user implementation. The Docker entry point binds only to 127.0.0.1:8081. It does not implement public account registration or tenant isolation. Public hosting is deferred.

## Request path

Angular browser application -> Nginx same-origin /api proxy -> application API. Recommendation requests also call a private Go ranker. Inspection requests call the C++ library through P/Invoke and optionally an ONNX model. Voice rooms use LiveKit directly after a server-issued token and consent.

## TTL and bounded work

| Boundary | Limit | Behavior |
| --- | --- | --- |
| Go ranking cache | 30 seconds, 256 entries | Key includes query, saved IDs and full catalog descriptions. Java applies current stock, budget and category after ranking. |
| Java ranking request | 2 second connect, 3 second request | Returns an explicit 503 on unavailable ranking. No fabricated ranking fallback. |
| Voice join token | 2 minutes | Limits joining. It does not end an active call. |
| Voice session | 480 seconds | Browser disconnect plus independent worker closure and room deletion. |
| Voice token issuance | 3 per hour per API-observed IP | In-memory limit for one API process. Restarts clear it. |
| Text review | 30 per minute per API-observed IP | In-memory limit for one API process. |
| AI review provider | 30 seconds, 600 output tokens | HTTPS only; failure returns 502. |
| Image upload | 10 MB, 20 megapixels | Reject before full decoding where possible; two concurrent requests. |
| Browser catalog request | Latest result wins | Earlier responses cannot overwrite a later search. |

## Data retention

No user account database is required. Voice/text answers and uploaded photographs are not persisted by application code. Optional external speech and AI providers have their own retention policies. Saved catalog IDs use browser localStorage. Inspection records are downloaded by the user as JSON. The sample catalog is stored in api/catalog.json. Application logs must not contain request bodies or credentials.

## Scaling and load balancing

Nginx currently proxies one API process. This is an intentional local topology, not a deployed load-balanced cluster. Before adding Railway replicas, use authenticated users, shared rate limiting, a canonical inventory store and deployment secrets. Railway can distribute HTTP traffic among replicas; no custom load balancer is required for this budget. LiveKit handles WebRTC media; it should not be proxied through an ordinary HTTP load balancer.

## CI and future delivery

.github/workflows/ci.yml defines test, frontend build and container build checks. Local test results are recorded separately from GitHub Actions runs. There is no automatic deployment workflow. A future Railway release should require an explicit approval, configured provider budgets and a successful health check. Do not expose this local edition publicly with its current single-user controls.
