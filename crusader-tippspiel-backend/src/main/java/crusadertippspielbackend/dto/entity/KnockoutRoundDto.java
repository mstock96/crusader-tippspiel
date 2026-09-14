package crusadertippspielbackend.dto.entity;

import java.util.List;

/**
 * Data Transfer Object mirroring physical `KnockoutRound` entities.
 * Safely masks internal entity relationships to resolve serialization circular dependencies and loading quirks.
 */
public record KnockoutRoundDto(Long id,
                               String name,
                               List<GameDto> games) {
}
