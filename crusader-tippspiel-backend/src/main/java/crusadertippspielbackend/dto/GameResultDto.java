package crusadertippspielbackend.dto;

import jakarta.validation.constraints.Min;

/**
 * Data Transfer Object for transmitting the final kills/scores of a game.
 * Used for both permanently submitting results and for simulations.
 */
public record GameResultDto(
        @Min(0)
        int team1Kills,
        @Min(0)
        int team2Kills
) {
}
