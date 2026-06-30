using System.Text.Json.Serialization;

namespace WorldCupBFF.Models;

// ARCHITECTURAL ISOLATION: These records strictly mirror the external API payload.
// They are mapped to our internal 'LiveMatchDto' inside the service.

public record FootballDataResponse(
    [property: JsonPropertyName("matches")] List<MatchItem> Matches
);

public record MatchItem(
    [property: JsonPropertyName("id")] int Id,
    [property: JsonPropertyName("status")] string Status,
    [property: JsonPropertyName("score")] ScoreData Score,
    [property: JsonPropertyName("homeTeam")] TeamData HomeTeam,
    [property: JsonPropertyName("awayTeam")] TeamData AwayTeam
);

public record ScoreData(
    [property: JsonPropertyName("winner")] string Winner,
    [property: JsonPropertyName("duration")] string Duration,
    [property: JsonPropertyName("fullTime")] ScoreDetail FullTime,
    [property: JsonPropertyName("regularTime")] ScoreDetail RegularTime,
    [property: JsonPropertyName("penalties")] ScoreDetail Penalties,
    [property: JsonPropertyName("extraTime")] ScoreDetail ExtraTime
);

public record ScoreDetail(
    [property: JsonPropertyName("home")] int Home,
    [property: JsonPropertyName("away")] int Away
);

public record TeamData(
    [property: JsonPropertyName("tla")] string Tla
);