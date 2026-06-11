using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using WorldCupBFF.Models;

namespace WorldCupBFF.Services;

public class AiPredictionService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly ILogger<AiPredictionService> _logger;

    public AiPredictionService(HttpClient httpClient, IConfiguration configuration, ILogger<AiPredictionService> logger)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<PredictionResponse> GetPredictionsAsync(PredictionRequest request, string? clientApiKey = null)
    {
        // Priority: client-provided key > server config
        var apiKey = !string.IsNullOrEmpty(clientApiKey) 
            ? clientApiKey 
            : _configuration["GeminiApi:ApiKey"];
        var model = _configuration["GeminiApi:Model"] ?? "gemini-2.5-flash";

        if (string.IsNullOrEmpty(apiKey) || apiKey == "YOUR_GEMINI_API_KEY")
        {
            _logger.LogWarning("No Gemini API key provided (neither from client nor server config). Returning empty predictions.");
            return new PredictionResponse();
        }

        try
        {
            var prompt = BuildPrompt(request);
            var geminiResponse = await CallGeminiAsync(apiKey, model, prompt);
            return ParseResponse(geminiResponse, request);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get AI predictions from Gemini");
            return new PredictionResponse();
        }
    }

    private string BuildPrompt(PredictionRequest request)
    {
        var sb = new StringBuilder();
        sb.AppendLine("You are an expert football analyst predicting FIFA World Cup 2026 match results.");
        sb.AppendLine("Consider each team's current FIFA ranking, recent form, historical World Cup performance, squad strength, and tactical style.");
        sb.AppendLine("Produce realistic, varied scorelines — not every game should be 1-0 or 2-1. Include occasional upsets, high-scoring games, and draws where appropriate.");
        sb.AppendLine();
        sb.AppendLine("For knockout/playoff matches: if you predict a draw, you MUST also specify the \"winner\" field with the team name that wins on penalties.");
        sb.AppendLine();
        sb.AppendLine("Return ONLY a valid JSON array, with no markdown formatting, no code fences, no extra text. Each element must have exactly these fields:");
        sb.AppendLine("  { \"matchId\": string, \"scoreA\": number, \"scoreB\": number, \"winner\": string|null }");
        sb.AppendLine();
        sb.AppendLine("The \"winner\" field should be null unless it's a knockout match that ends in a draw (penalty shootout).");
        sb.AppendLine();
        sb.AppendLine("Here are the matches to predict:");
        sb.AppendLine();

        foreach (var match in request.Matches)
        {
            sb.AppendLine($"- matchId: \"{match.MatchId}\", Team A: \"{match.TeamAName}\" vs Team B: \"{match.TeamBName}\", Context: \"{match.Context}\"");
        }

        return sb.ToString();
    }

    private async Task<string> CallGeminiAsync(string apiKey, string model, string prompt)
    {
        var url = $"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={apiKey}";

        var requestBody = new
        {
            contents = new[]
            {
                new
                {
                    parts = new[]
                    {
                        new { text = prompt }
                    }
                }
            },
            generationConfig = new
            {
                temperature = 1.0,
                maxOutputTokens = 8192,
                responseMimeType = "application/json"
            }
        };

        var json = JsonSerializer.Serialize(requestBody);
        
        int maxRetries = 3;
        int delayMs = 1000;

        for (int i = 0; i <= maxRetries; i++)
        {
            var content = new StringContent(json, Encoding.UTF8, "application/json");
            var response = await _httpClient.PostAsync(url, content);
            var responseBody = await response.Content.ReadAsStringAsync();

            if (response.IsSuccessStatusCode)
            {
                return responseBody;
            }

            if (i < maxRetries && (response.StatusCode == System.Net.HttpStatusCode.ServiceUnavailable || response.StatusCode == System.Net.HttpStatusCode.TooManyRequests))
            {
                _logger.LogWarning($"Gemini API returned {response.StatusCode}. Retrying in {delayMs}ms... ({i + 1}/{maxRetries})");
                await Task.Delay(delayMs);
                delayMs *= 2; // Exponential backoff
                continue;
            }

            _logger.LogError("Gemini API returned {StatusCode}: {Body}", response.StatusCode, responseBody);
            throw new HttpRequestException($"Gemini API returned {response.StatusCode}. Details: {responseBody}");
        }

        throw new HttpRequestException("Gemini API call failed after retries.");
    }

    private PredictionResponse ParseResponse(string geminiResponse, PredictionRequest request)
    {
        var result = new PredictionResponse();

        try
        {
            using var doc = JsonDocument.Parse(geminiResponse);
            var root = doc.RootElement;

            // Navigate: candidates[0].content.parts[0].text
            var candidates = root.GetProperty("candidates");
            var firstCandidate = candidates[0];
            var contentParts = firstCandidate.GetProperty("content").GetProperty("parts");
            var text = contentParts[0].GetProperty("text").GetString();

            if (string.IsNullOrEmpty(text))
            {
                _logger.LogWarning("Gemini returned empty text in response");
                return result;
            }

            // Clean up potential markdown fences
            text = text.Trim();
            if (text.StartsWith("```json")) text = text[7..];
            if (text.StartsWith("```")) text = text[3..];
            if (text.EndsWith("```")) text = text[..^3];
            text = text.Trim();

            var predictions = JsonSerializer.Deserialize<List<GeminiPrediction>>(text, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            if (predictions == null)
            {
                _logger.LogWarning("Failed to deserialize Gemini predictions");
                return result;
            }

            // Build a lookup of input matches for team name resolution
            var inputLookup = request.Matches.ToDictionary(m => m.MatchId, m => m);

            foreach (var pred in predictions)
            {
                var output = new MatchPredictionOutput
                {
                    MatchId = pred.MatchId,
                    ScoreA = pred.ScoreA,
                    ScoreB = pred.ScoreB,
                    WinnerTeamName = pred.Winner
                };
                result.Predictions.Add(output);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to parse Gemini response");
        }

        return result;
    }

    private class GeminiPrediction
    {
        [JsonPropertyName("matchId")]
        public string MatchId { get; set; } = "";

        [JsonPropertyName("scoreA")]
        public int ScoreA { get; set; }

        [JsonPropertyName("scoreB")]
        public int ScoreB { get; set; }

        [JsonPropertyName("winner")]
        public string? Winner { get; set; }
    }
}
