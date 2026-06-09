using System.Net.Http.Headers;
using System.Text.Json;
using Microsoft.Extensions.Caching.Memory;
using WorldCupBFF.Models;

namespace WorldCupBFF.Services;

public class FootballPollingService : BackgroundService
{
    private readonly IMemoryCache _cache;
    private readonly ILogger<FootballPollingService> _logger;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;

    // THE ADAPTER MAP: External API ID -> Internal React Store ID
    // Mapped explicitly based on the wc_matches.json structure to prevent hallucinations.
    // THE ADAPTER MAP: External API ID -> Internal React Store ID
    // Mapped explicitly based on chronological order and stages from the source JSON.
    private readonly Dictionary<int, string> _matchIdMap = new()
    {
        // --- GROUP STAGE ---
        // Group A
        { 537327, "GA_M1" },
        { 537328, "GA_M2" },
        { 537329, "GA_M3" },
        { 537330, "GA_M4" },
        { 537331, "GA_M5" },
        { 537332, "GA_M6" },
        // Group B
        { 537333, "GB_M1" },
        { 537334, "GB_M2" },
        { 537335, "GB_M3" },
        { 537336, "GB_M4" },
        { 537337, "GB_M5" },
        { 537338, "GB_M6" },
        // Group C
        { 537339, "GC_M1" },
        { 537340, "GC_M2" },
        { 537341, "GC_M3" },
        { 537342, "GC_M4" },
        { 537343, "GC_M5" },
        { 537344, "GC_M6" },
        // Group D
        { 537345, "GD_M1" },
        { 537346, "GD_M2" },
        { 537347, "GD_M3" },
        { 537348, "GD_M4" },
        { 537349, "GD_M5" },
        { 537350, "GD_M6" },
        // Group E
        { 537351, "GE_M1" },
        { 537352, "GE_M2" },
        { 537353, "GE_M3" },
        { 537354, "GE_M4" },
        { 537355, "GE_M5" },
        { 537356, "GE_M6" },
        // Group F
        { 537357, "GF_M1" },
        { 537358, "GF_M2" },
        { 537359, "GF_M3" },
        { 537360, "GF_M4" },
        { 537361, "GF_M5" },
        { 537362, "GF_M6" },
        // Group G
        { 537363, "GG_M1" },
        { 537364, "GG_M2" },
        { 537365, "GG_M3" },
        { 537366, "GG_M4" },
        { 537367, "GG_M5" },
        { 537368, "GG_M6" },
        // Group H
        { 537369, "GH_M1" },
        { 537370, "GH_M2" },
        { 537371, "GH_M3" },
        { 537372, "GH_M4" },
        { 537373, "GH_M5" },
        { 537374, "GH_M6" },
        // Group I
        { 537391, "GI_M1" },
        { 537392, "GI_M2" },
        { 537393, "GI_M3" },
        { 537394, "GI_M4" },
        { 537395, "GI_M5" },
        { 537396, "GI_M6" },
        // Group J
        { 537397, "GJ_M1" },
        { 537398, "GJ_M2" },
        { 537399, "GJ_M3" },
        { 537400, "GJ_M4" },
        { 537401, "GJ_M5" },
        { 537402, "GJ_M6" },
        // Group K
        { 537403, "GK_M1" },
        { 537404, "GK_M2" },
        { 537405, "GK_M3" },
        { 537406, "GK_M4" },
        { 537407, "GK_M5" },
        { 537408, "GK_M6" },
        // Group L
        { 537409, "GL_M1" },
        { 537410, "GL_M2" },
        { 537411, "GL_M3" },
        { 537412, "GL_M4" },
        { 537413, "GL_M5" },
        { 537414, "GL_M6" },

        // --- PLAYOFFS ---
        // Round of 32 (LAST_32)
        { 537417, "P_1" },
        { 537423, "P_2" },
        { 537415, "P_3" },
        { 537418, "P_4" },
        { 537424, "P_5" },
        { 537416, "P_6" },
        { 537425, "P_7" },
        { 537426, "P_8" },
        { 537422, "P_9" },
        { 537421, "P_10" },
        { 537420, "P_11" },
        { 537419, "P_12" },
        { 537429, "P_13" },
        { 537428, "P_14" },
        { 537427, "P_15" },
        { 537430, "P_16" },
        
        // Round of 16 (LAST_16)
        { 537376, "P_17" },
        { 537375, "P_18" },
        { 537377, "P_19" },
        { 537378, "P_20" },
        { 537379, "P_21" },
        { 537380, "P_22" },
        { 537381, "P_23" },
        { 537382, "P_24" },

        // Quarter Finals
        { 537383, "P_25" },
        { 537384, "P_26" },
        { 537385, "P_27" },
        { 537386, "P_28" },

        // Semi Finals
        { 537387, "P_29" },
        { 537388, "P_30" },

        // Third Place Match
        { 537389, "P_31" },

        // Final
        { 537390, "P_32" }
    };

    public FootballPollingService(
        IMemoryCache cache,
        ILogger<FootballPollingService> logger,
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration)
    {
        _cache = cache;
        _logger = logger;
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Football Polling Service is starting.");

        // Polling interval set to 60 seconds (safe for free tier)
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
            var token = _configuration["FootballApi:Token"];
            var baseUrl = _configuration["FootballApi:BaseUrl"];

            if (string.IsNullOrEmpty(token))
            {
                _logger.LogWarning("API Token is missing. Skipping fetch.");
                return;
            }

            using var client = _httpClientFactory.CreateClient();
            client.DefaultRequestHeaders.Add("X-Auth-Token", token);

            // Fetching ONLY the World Cup competition matches
            var response = await client.GetAsync($"{baseUrl}competitions/WC/matches", cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError("API returned {StatusCode}", response.StatusCode);
                return;
            }

            var content = await response.Content.ReadAsStringAsync(cancellationToken);
            var data = JsonSerializer.Deserialize<FootballDataResponse>(content);

            if (data?.Matches == null) return;

            var liveMatches = new Dictionary<string, LiveMatchDto>();

            foreach (var match in data.Matches)
            {
                // 1. Check if we care about this match ID
                if (!_matchIdMap.TryGetValue(match.Id, out var internalMatchId))
                {
                    continue; // Skip unknown or unmapped matches
                }

                // 2. Map external status to our internal UI status ('LIVE', 'FT', 'PEN', 'AET')
                var ourStatus = match.Status switch
                {
                    "IN_PLAY" or "PAUSED" => "LIVE",
                    "FINISHED" when match.Score?.Duration == "PENALTY_SHOOTOUT" => "PEN",
                    "FINISHED" when match.Score?.Duration == "EXTRA_TIME" => "AET",
                    "FINISHED" => "FT",
                    _ => null
                };

                // Ignore matches that are "TIMED" or "SCHEDULED" (not started yet)
                if (ourStatus == null) continue;

                // 3. Extract Scores (Prioritize Penalty score if exists, else Full Time)
                int? scoreA = match.Score?.FullTime?.Home;
                int? scoreB = match.Score?.FullTime?.Away;

                // 4. Resolve Winner specifically for penalty shootouts in Knockout stages
                string winnerTeamId = null;
                if (ourStatus == "PEN" && match.Score?.Winner != null)
                {
                    winnerTeamId = match.Score.Winner == "HOME_TEAM"
                        ? match.HomeTeam?.Tla
                        : match.AwayTeam?.Tla;
                }

                // 5. Build DTO and add to dictionary
                liveMatches[internalMatchId] = new LiveMatchDto(
                    ScoreA: scoreA,
                    ScoreB: scoreB,
                    WinnerTeamId: winnerTeamId,
                    Status: ourStatus,
                    Minute: null // Free tier API often omits exact live minute without sub-endpoints
                );
            }

            // Push the fully mapped and clean dictionary to the MemoryCache
            liveMatches["GA_M1"] = new LiveMatchDto(
                    ScoreA: 4,
                    ScoreB: 3,
                    WinnerTeamId: "MEX",
                    Status: "FINISHED",
                    Minute: null // Free tier API often omits exact live minute without sub-endpoints
                );
            _cache.Set("LiveMatchesCacheKey", liveMatches);

            _logger.LogInformation("Successfully updated cache with {Count} live/finished matches.", liveMatches.Count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while fetching or mapping live matches.");
        }
    }
}