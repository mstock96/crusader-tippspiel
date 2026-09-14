package crusadertippspielbackend.dto.entity;

import java.util.List;

/**
 * Data Transfer Object mirroring physical `Prediction` entities.
 * Condenses loaded sub-entities and flattens associations to ensure stable, standalone serialization avoiding lazy-load DB exceptions.
 */
public record PredictionDto(Long id,
                            int groupPoints,
                            int podiumPoints,
                            int totalPoints,
                            TeamDto winner,
                            TeamDto second,
                            TeamDto third,
                            List<GroupTipDto> groupTips
) {
}
