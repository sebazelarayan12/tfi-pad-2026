FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy only the project files first so the restore layer is cached until a dependency changes.
COPY global.json Aseguradora.sln ./
COPY Aseguradora.Domain/Aseguradora.Domain.csproj Aseguradora.Domain/
COPY Aseguradora.Data/Aseguradora.Data.csproj Aseguradora.Data/
COPY Aseguradora.Application/Aseguradora.Application.csproj Aseguradora.Application/
COPY Aseguradora.Integrations/Aseguradora.Integrations.csproj Aseguradora.Integrations/
COPY Aseguradora.Api/Aseguradora.Api.csproj Aseguradora.Api/
RUN dotnet restore Aseguradora.Api/Aseguradora.Api.csproj

COPY . .
RUN dotnet publish Aseguradora.Api/Aseguradora.Api.csproj -c Release -o /app --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app .
ENV ASPNETCORE_HTTP_PORTS=8080
EXPOSE 8080
USER $APP_UID
ENTRYPOINT ["dotnet", "Aseguradora.Api.dll"]
