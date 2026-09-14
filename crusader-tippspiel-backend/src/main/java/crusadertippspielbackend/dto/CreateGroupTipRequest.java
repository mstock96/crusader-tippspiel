package crusadertippspielbackend.dto;

import crusadertippspielbackend.dto.entity.TeamDto;

/**
 * Data Transfer Object for carrying the user's prediction of a team's final position within a group.
 * It is typically used as part of a larger prediction request for a tournament.
 */
public record CreateGroupTipRequest(
        TeamDto team,
        int predictedPosition
) {
}
