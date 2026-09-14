package crusadertippspielbackend.dto;

/**
 * Data Transfer Object representing a row on the prediction leaderboard.
 * Displays a user's scores for different stages and their overall points.
 */
public record LeaderboardRowDto(
        String userName,
        int groupPoints,
        int podiumPoints,
        int totalPoints
) {
}
