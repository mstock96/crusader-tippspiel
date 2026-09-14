package crusadertippspielbackend.dto;

/**
 * Data Transfer Object providing a condensed view of a group tip prediction.
 * Combines the name of the team and their predicted rank for simpler display purposes.
 */
public record GroupTipShortFormDto(
        String teamName,
        int predictedPosition
) {
}
