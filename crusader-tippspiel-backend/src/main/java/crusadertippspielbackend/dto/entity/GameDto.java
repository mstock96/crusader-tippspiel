package crusadertippspielbackend.dto.entity;

/**
 * Data Transfer Object mirroring physical `Game` entities.
 * Safely masks internal entity relationships to resolve serialization circular dependencies and loading quirks.
 */
public record GameDto(Long id,
                      TeamDto team1,
                      TeamDto team2,
                      int team1Kills,
                      int team2Kills,
                      boolean played,
                      boolean knockout
) {
}
