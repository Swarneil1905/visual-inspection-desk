# Production architecture

Angular and Nginx proxy to a .NET API in the same container. The API calls the native C++ image library and optionally loads an ONNX model. Images remain in memory and JSON exports omit image bytes. There is no trained production defect model bundled with the application.

## Public gateway

Railway terminates HTTPS and routes to Nginx on port 8080. Backend ports bind to loopback. The gateway permits two API requests per second per client with a burst of 12, plus a shared 20 requests per second limit and six concurrent API connections. Railway's edge supplies X-Real-IP. The gateway overwrites the client address and scheme passed to Django. This trust model is specific to the Railway edge; do not expose the container directly to the internet without an equivalent trusted proxy.

The apps are public portfolio demos, without accounts or tenant storage. The gateway sets a content security policy, frame protection, MIME protection and a permissions policy. Uploads are capped at 11 MB at the gateway and 10 MB per image in the API. Requests and images are not included in access logs. Public rate limits reduce accidental or casual abuse; they are not a substitute for a workspace spending cap.

## Bounded work

- Voice: 120 second join tokens, 480 second sessions, three token requests per hour per observed IP.
- Paid shared allowances: 10 voice sessions per UTC month, three per day, with two 600 second reservations at once; 100 AI reviews per UTC month, 20 per day. SQLite transactions prevent concurrent requests from exceeding the allowance. Failed provider calls consume an allowance. Counters survive voice API restarts on its volume.
- AI review: 30 second provider timeout, 600 output tokens, explicit consent.
- Inspection: 20 megapixels, two concurrent image operations, optional model abstention.
- Ranking: 30 second cache TTL, 256 entries, a 3 second Java request timeout. Cache entries include the full ranking input; current stock is still checked by Java.

Only the boundaries used by this application apply. Each web app runs one replica with a 512 MB memory limit. The voice worker has a 768 MB limit and no idle job process pool. Web apps can sleep when inactive; the connected voice worker stays awake. These are resource limits, not a guaranteed monthly bill.

## Health and process lifecycle

`/healthz` checks the API through Nginx. Inspection health verifies native interop; recommendation health verifies inventory and ranking. If a required process exits, the container supervisor terminates the remaining processes and exits so Railway can restart it. Railway allows three restart retries. No unhealthy deployment is promoted by its health check.

## CI/CD

GitHub Actions tests the source, builds the frontends and containers, starts the production image and exercises real HTTP flows. Only after every required job succeeds does the publish job advance the `production` branch to the tested commit. It checks that the commit is still the newest main commit. Railway follows `production`, so failed tests leave the live source unchanged. Pull requests cannot publish.

The source branch and service settings are recorded in `deploy/railway-settings.json`. That file documents the applied platform settings; Railway does not execute it. Settings are configured through the Railway API. Legacy railway.json configuration is not used.

Before adding replicas, move per-client limits to shared storage, provide appropriate accounts for any private data, and revisit quotas and inventory persistence. Railway supplies edge routing; a separate paid load balancer is unnecessary for this single-replica demo.
