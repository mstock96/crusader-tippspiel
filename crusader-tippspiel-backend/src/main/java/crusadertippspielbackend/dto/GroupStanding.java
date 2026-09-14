package crusadertippspielbackend.dto;

import crusadertippspielbackend.entity.Team;
import crusadertippspielbackend.service.GroupTableService;

/**
 * Used for internal calculations of a group standing table in {@link GroupTableService}.
 * Summarizes the points, wins, ties, losses, and kills for a team.
 */
public record GroupStanding(Team team,
                            double points,
                            int wins,
                            int ties,
                            int losses,
                            int kills
) {
}
