package crusadertippspielbackend.dto.entity;

import java.util.List;

/**
 * Data Transfer Object mirroring physical `Group` entities.
 * Recombines grouped relationships free from raw ORM complexities to ensure a clean transmission layout.
 */
public record GroupDto(Long id,
                       String name,
                       List<TeamDto> teams,
                       List<GameDto> games
) {
}
