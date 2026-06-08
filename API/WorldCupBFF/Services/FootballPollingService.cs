using Microsoft.Extensions.Caching.Memory;
using WorldCupBFF.Models;

namespace WorldCupBFF.Services;

public class FootballPollingService : BackgroundService
{
    private readonly IMemoryCache _cache;
    private readonly ILogger<FootballPollingService> _logger;
    private readonly IHttpClientFactory _httpClientFactory;

    public FootballPollingService(
        IMemoryCache cache,
        ILogger<FootballPollingService> logger,
        IHttpClientFactory httpClientFactory)
    {
        _cache = cache;
        _logger = logger;
        _httpClientFactory = httpClientFactory;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Football Polling Service is starting.");

        // Run the loop every 60 seconds
        using var timer = new PeriodicTimer(TimeSpan.FromSeconds(60));

        try
        {
            do
            {
                await FetchAndCacheLiveMatchesAsync(stoppingToken);
            }
            while (await timer.WaitForNextTickAsync(stoppingToken));
        }
        catch (OperationCanceledException)
        {
            _logger.LogInformation("Polling Service was cancelled.");
        }
    }

    private async Task FetchAndCacheLiveMatchesAsync(CancellationToken cancellationToken)
    {
        try
        {
            _logger.LogInformation("Fetching latest match data...");

            // TODO: Actual API call to Football-Data.org will go here.
            // For now, we inject a mock dictionary to establish the frontend connection.
            var liveMatches = new Dictionary<string, LiveMatchDto>
            {
                // Note: Using uppercase "GER" to match the frontend standard
                { "P_1", new LiveMatchDto(1, 1, "GER", "PEN", 120) }
            };

            // Save to cache. It gets overwritten every 60s anyway.
            _cache.Set("LiveMatchesCacheKey", liveMatches);

            _logger.LogInformation("Successfully updated cache with live matches.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while fetching live matches.");
        }
    }
}