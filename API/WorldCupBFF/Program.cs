using Microsoft.Extensions.Caching.Memory;
using WorldCupBFF.Services;

var builder = WebApplication.CreateBuilder(args);

// Configure CORS for the React frontend (Vite defaults to port 5173)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// Add internal services
builder.Services.AddMemoryCache();
builder.Services.AddHttpClient();

// Register the background polling service
builder.Services.AddHostedService<FootballPollingService>();

var app = builder.Build();

app.UseCors("AllowReactApp");

// The single endpoint our React app will consume
app.MapGet("/api/live-matches", (IMemoryCache cache) =>
{
    // Try to get the latest matches from cache
    if (cache.TryGetValue("LiveMatchesCacheKey", out object matches))
    {
        return Results.Ok(matches);
    }

    // Return an empty dictionary if cache is empty (e.g., service just started)
    return Results.Ok(new Dictionary<string, object>());
});

app.Run();