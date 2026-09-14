package crusadertippspielbackend.dto;

import crusadertippspielbackend.dto.entity.TeamDto;

/**
 * Data Transfer Object representing a single entry in a group standing table.
 * Summarizes the points, wins, ties, losses, and kills for a team.
 */
public record GroupStandingDto(
        TeamDto team,
        double points,
        int wins,
        int ties,
        int losses,
        int kills
) {
}
