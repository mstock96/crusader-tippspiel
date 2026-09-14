package crusadertippspielbackend.dto.entity;

import java.util.List;

/**
 * Data Transfer Object mirroring physical `Team` entities.
 * Abstracts away parent back-references (like groups and games) to break circular bindings during REST serialization.
 */
public record TeamDto(Long id,
                      int wins,
                      int losses,
                      int ties,
                      int kills,
                      List<MemberDto> members
) {
}
