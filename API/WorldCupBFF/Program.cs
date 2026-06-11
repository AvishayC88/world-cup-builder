using Microsoft.Extensions.Caching.Memory;
using WorldCupBFF.Models;
using WorldCupBFF.Services;

var builder = WebApplication.CreateBuilder(args);

// Configure CORS for the React frontend (Vite defaults to port 5173)
// builder.Services.AddCors(options =>
// {
// options.AddPolicy("AllowReactApp", policy =>
// {
// policy.WithOrigins("http://localhost:5173")
// .AllowAnyHeader()
// .AllowAnyMethod();
// });
// });
builder.Services.AddCors(options =>
{
    options.AddPolicy("VercelAndLocalPolicy", policyBuilder =>
    {
        policyBuilder.SetIsOriginAllowed(origin =>
        {
            var host = new Uri(origin).Host;
            return host == "localhost" || host.EndsWith(".vercel.app");
        })
        .AllowAnyMethod()
        .AllowAnyHeader();
    });
});
// Add internal services
builder.Services.AddMemoryCache();
builder.Services.AddHttpClient();

// Register the background polling service
builder.Services.AddHostedService<FootballPollingService>();

// Register the AI prediction service
builder.Services.AddTransient<AiPredictionService>();

var app = builder.Build();
app.UseCors("VercelAndLocalPolicy");
// app.UseCors("AllowReactApp");

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

// AI Prediction endpoint - accepts match data and returns AI-predicted scores
// The client sends its own Gemini API key via the X-Gemini-Api-Key header
app.MapPost("/api/ai-predict", async (PredictionRequest request, AiPredictionService aiService, HttpContext httpContext) =>
{
    if (request.Matches == null || request.Matches.Count == 0)
    {
        return Results.BadRequest("No matches provided for prediction.");
    }

    // Read the user's API key from the request header
    var clientApiKey = httpContext.Request.Headers["X-Gemini-Api-Key"].FirstOrDefault();

    var predictions = await aiService.GetPredictionsAsync(request, clientApiKey);
    return Results.Ok(predictions);
});

app.Run();