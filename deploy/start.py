"""Start the API and gateway together; exit the container if either fails."""
import os
import signal
import subprocess
import time
from pathlib import Path

os.umask(0o077)
kind = "visual-inspection-desk"
data = Path(os.getenv("DATA_DIR", "/tmp/demo-data"))
data.mkdir(parents=True, exist_ok=True)
if os.getuid() == 0:
    os.chown(data, 10001, 10001)
    os.setgroups([])
    os.setgid(10001)
    os.setuid(10001)
if kind == "voice-practice-coach":
    import secrets
    secret = data / "django-secret"
    if not secret.exists():
        secret.write_text(secrets.token_urlsafe(64))
    os.environ.setdefault("DJANGO_SECRET_KEY_FILE", str(secret))
    os.environ.setdefault("QUOTA_DATABASE", str(data / "quota.sqlite3"))
    commands = [["gunicorn", "--chdir", "/app/api", "coach.wsgi:application", "--bind", "127.0.0.1:8000", "--workers", "1", "--threads", "4", "--timeout", "45", "--error-logfile", "-"]]
elif kind == "visual-inspection-desk":
    os.environ["ASPNETCORE_URLS"] = "http://127.0.0.1:8001"
    commands = [["dotnet", "/app/api/Inspection.Api.dll"]]
else:
    os.environ.update(PORT="8002", BIND_ADDRESS="127.0.0.1", RANKER_URL="http://127.0.0.1:8090", CATALOG_PATH="/app/api/catalog.json", LISTEN_ADDR="127.0.0.1:8090")
    commands = [["/app/ranker"], ["java", "-Xms32m", "-Xmx192m", "-XX:ActiveProcessorCount=2", "-jar", "/app/api/catalog.jar"]]
config = Path("/app/deploy/nginx.conf").read_text().replace("PUBLIC_SCHEME", os.getenv("PUBLIC_SCHEME", "https"))
Path("/tmp/demo-nginx.conf").write_text(config)
commands.append(["nginx", "-c", "/tmp/demo-nginx.conf", "-g", "daemon off;"])
processes = []
stopping = False

def stop(*_):
    global stopping
    stopping = True
    for process in processes:
        if process.poll() is None:
            process.terminate()

signal.signal(signal.SIGTERM, stop)
signal.signal(signal.SIGINT, stop)
try:
    for command in commands:
        processes.append(subprocess.Popen(command))
    while not stopping and all(p.poll() is None for p in processes):
        time.sleep(0.5)
finally:
    stop()
    deadline = time.monotonic() + 8
    for process in processes:
        try:
            process.wait(timeout=max(0.1, deadline - time.monotonic()))
        except subprocess.TimeoutExpired:
            process.kill()
raise SystemExit(1)
