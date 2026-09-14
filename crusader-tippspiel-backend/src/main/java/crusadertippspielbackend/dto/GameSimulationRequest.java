package crusadertippspielbackend.dto;

import crusadertippspielbackend.dto.entity.GameDto;

/**
 * Data Transfer Object used to simulate the result of a specific game
 * without permanently persisting the outcome to the database.
 */
public record GameSimulationRequest(
        GameDto game,
        GameResultDto gameResultDto
) {
}