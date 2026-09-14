package crusadertippspielbackend.dto;

/**
 * Data Transfer Object containing the configuration details for newly created tournaments.
 * Sets the layout such as group count, teams per group, AI count, and knockout participants.
 */
public record CreateTournamentRequest(String name,
                                      int numberOfGroups,
                                      int teamsPerGroup,
                                      int aiPerTeam,
                                      int totalKoParticipants
) {
}
