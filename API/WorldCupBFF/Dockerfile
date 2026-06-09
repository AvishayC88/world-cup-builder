# Stage 1: Build environment
FROM mcr.microsoft.com/dotnet/sdk:10.0-alpine AS build
WORKDIR /src

# Copy just the project file and restore dependencies
# This caches the restore layer, speeding up future builds
COPY ["WorldCupBFF.csproj", "./"]
RUN dotnet restore "WorldCupBFF.csproj"

# Copy the rest of the code and build
COPY . .
RUN dotnet publish "WorldCupBFF.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Stage 2: Runtime environment
FROM mcr.microsoft.com/dotnet/aspnet:10.0-alpine AS final
WORKDIR /app

# Expose standard HTTP port
EXPOSE 8080

# Create a non-root user for security best practices
RUN adduser -u 5678 --disabled-password --gecos "" appuser && chown -R appuser /app
USER appuser

# Copy the compiled binaries from the build stage
COPY --from=build /app/publish .

# Set environment variables
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production

# Run the application
ENTRYPOINT ["dotnet", "WorldCupBFF.dll"]