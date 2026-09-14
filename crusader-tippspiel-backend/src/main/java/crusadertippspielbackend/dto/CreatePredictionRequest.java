package crusadertippspielbackend.dto;

import crusadertippspielbackend.dto.entity.TeamDto;

import java.util.List;

/**
 * Data Transfer Object representing the payload when a user submits their predictions.
 * Encapsulates the picks for the tournament podium (winner, second, third)
 * as well as the predicted placements for the group stages.
 */
public record CreatePredictionRequest(
        TeamDto winner,
        TeamDto second,
        TeamDto third,
        List<CreateGroupTipRequest> groupTips
) {
}
