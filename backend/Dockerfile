# 1. Build Stage (Compiles the .NET 11 project)
FROM mcr.microsoft.com/dotnet/sdk:11.0 AS build
WORKDIR /src
COPY BudgetApi/BudgetApi.csproj BudgetApi/
RUN dotnet restore BudgetApi/BudgetApi.csproj
COPY BudgetApi/ BudgetApi/
WORKDIR /src/BudgetApi
RUN dotnet publish BudgetApi.csproj -c Release -o /app/publish --no-restore

# 2. Runtime Stage (Runs the compiled API)
FROM mcr.microsoft.com/dotnet/aspnet:11.0
WORKDIR /app
COPY --from=build /app/publish .

# Railway automatically listens on port 8080 by default
ENV ASPNETCORE_URLS=http://0.0.0.0:8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "BudgetApi.dll"]
