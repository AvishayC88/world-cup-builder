using System.Text.Json.Serialization;

namespace WorldCupBFF.Services;

public partial class AiPredictionService
{
    private class AiPredictionModel
    {
        [JsonPropertyName("matchId")]
        public string MatchId { get; set; } = "";

        [JsonPropertyName("scoreA")]
        public int ScoreA { get; set; }

        [JsonPropertyName("scoreB")]
        public int ScoreB { get; set; }

        [JsonPropertyName("winner")]
        public string Winner { get; set; }
    }
}
