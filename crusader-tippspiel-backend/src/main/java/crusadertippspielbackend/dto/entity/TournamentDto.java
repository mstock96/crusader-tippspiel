package crusadertippspielbackend.dto.entity;

import java.util.List;

/**
 * Data Transfer Object mirroring physical `Tournament` entities.
 * Extracts the full top-down node hierarchy so the database session can close before returning data to the client safely.
 */
public record TournamentDto(
        Long id,
        String name,
        boolean finished,
        boolean started,
        int numberOfGroups,
        int teamsPerGroup,
        int aiPerTeam,
        int totalKoParticipants,
        TeamDto winner,
        TeamDto second,
        TeamDto third,
        List<GroupDto> groups,
        List<KnockoutRoundDto> knockoutRounds
) {
}
