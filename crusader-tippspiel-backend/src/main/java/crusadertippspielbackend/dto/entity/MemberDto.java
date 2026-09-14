package crusadertippspielbackend.dto.entity;

/**
 * Data Transfer Object mirroring physical `Member` entities.
 * Mapped directly from the database schema context.
 */
public record MemberDto(Long id,
                        String name
) {
}
