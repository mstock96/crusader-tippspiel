package crusadertippspielbackend.dto;

import java.util.List;

/**
 * Data Transfer Object providing a summarized and readable overview of a user's predictions.
 * Unpacks nested entities into simpler string formats representing members and placements.
 */
public record PredictionShortFormDto(
        String username,
        int groupPoints,
        int podiumPoints,
        int totalPoints,
        String winner,
        String second,
        String third,
        List<GroupTipShortFormDto> groupTips
) {
}
