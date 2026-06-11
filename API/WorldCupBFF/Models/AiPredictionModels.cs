namespace WorldCupBFF.Models;

public class MatchPredictionInput
{
    public string MatchId { get; set; } = "";
    public string TeamAName { get; set; } = "";
    public string TeamBName { get; set; } = "";
    public string Context { get; set; } = ""; // e.g., "Group A - Match Day 1" or "Round of 16"
}

public class PredictionRequest
{
    public List<MatchPredictionInput> Matches { get; set; } = new();
}

public class MatchPredictionOutput
{
    public string MatchId { get; set; } = "";
    public int ScoreA { get; set; }
    public int ScoreB { get; set; }
    public string? WinnerTeamName { get; set; } // For playoff ties resolved by penalties
}

public class PredictionResponse
{
    public List<MatchPredictionOutput> Predictions { get; set; } = new();
}
