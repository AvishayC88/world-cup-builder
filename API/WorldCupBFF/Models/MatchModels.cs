namespace WorldCupBFF.Models;

// The unified structure the React frontend expects
public record LiveMatchDto(
    int? ScoreA,
    int? ScoreB,
    string WinnerTeamId,
    string Status,
    int? Minute
);