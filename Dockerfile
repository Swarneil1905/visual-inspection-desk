FROM node:22-bookworm-slim AS frontend
WORKDIR /src/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS backend
RUN apt-get update && apt-get install -y --no-install-recommends g++ && rm -rf /var/lib/apt/lists/*
WORKDIR /src
COPY native native
RUN g++ -std=c++17 -O2 -fPIC -shared native/quality.cpp -o /tmp/libimage_quality.so && g++ -std=c++17 native/test_quality.cpp native/quality.cpp -o /tmp/quality_test && /tmp/quality_test
COPY api api
RUN dotnet publish api/Inspection.Api.csproj -c Release -o /out
FROM mcr.microsoft.com/dotnet/aspnet:10.0
COPY --from=backend /out /app/api
COPY --from=backend /tmp/libimage_quality.so /app/api/libimage_quality.so
RUN apt-get update && apt-get install -y --no-install-recommends nginx python3 ca-certificates && rm -rf /var/lib/apt/lists/* && useradd --create-home --uid 10001 demo
WORKDIR /app
COPY --from=frontend /src/frontend/dist/studio/browser /app/public
COPY deploy /app/deploy
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
EXPOSE 8080
CMD ["python3", "/app/deploy/start.py"]
