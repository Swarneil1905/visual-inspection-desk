FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
RUN apt-get update && apt-get install -y --no-install-recommends g++ && rm -rf /var/lib/apt/lists/*
WORKDIR /src
COPY native native
RUN g++ -std=c++17 -O2 -fPIC -shared native/quality.cpp -o /tmp/libimage_quality.so && g++ -std=c++17 native/test_quality.cpp native/quality.cpp -o /tmp/quality_test && /tmp/quality_test
COPY api api
RUN dotnet publish api/Inspection.Api.csproj -c Release -o /app
FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=build /app .
COPY --from=build /tmp/libimage_quality.so .
ENV ASPNETCORE_URLS=http://0.0.0.0:8001
USER $APP_UID
EXPOSE 8001
ENTRYPOINT ["dotnet","Inspection.Api.dll"]
