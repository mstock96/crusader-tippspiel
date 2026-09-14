package crusadertippspielbackend.dto.entity;

/**
 * Data Transfer Object mirroring physical `GroupTip` entities.
 * Mapped directly from the database schema context while removing recursive object links that would corrupt endpoint payloads.
 */
public record GroupTipDto(Long id,
                          TeamDto team,
                          int predictedPosition
) {
}
