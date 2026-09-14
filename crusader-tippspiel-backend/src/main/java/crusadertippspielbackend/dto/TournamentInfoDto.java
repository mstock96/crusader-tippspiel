package crusadertippspielbackend.dto;

/**
 * Data Transfer Object containing the top-level overview structure of a tournament.
 * Used for listing and previewing tournaments without fetching deeper entity graphs.
 */
public record TournamentInfoDto(
        Long id,
        String name,
        boolean finished,
        boolean started,
        int numberOfGroups,
        int teamsPerGroup,
        int aiPerTeam,
        int totalKoParticipants
) {
}
