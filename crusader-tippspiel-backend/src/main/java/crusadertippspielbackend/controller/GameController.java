package crusadertippspielbackend.controller;

import crusadertippspielbackend.dto.GameResultDto;
import crusadertippspielbackend.dto.GameSimulationRequest;
import crusadertippspielbackend.dto.entity.GameDto;
import crusadertippspielbackend.service.GameService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

/**
 * REST Controller for managing games.
 * Provides endpoints for updating and removing game results, as well as simulating game updates.
 */
@RestController
@RequestMapping("/api/games")
@Validated
public class GameController {

    private final GameService gameService;

    public GameController(GameService gameService) {
        this.gameService = gameService;
    }

    @PatchMapping("/{gameId}/result")
    public GameDto updateResult(@PathVariable @Min(1) Long gameId, @Valid @RequestBody GameResultDto gameResultDto) {
        return gameService.updateResult(gameId, gameResultDto);
    }

    @DeleteMapping("/{gameId}/remove")
    public GameDto removeResult(@PathVariable @Min(1) Long gameId) {
        return gameService.removeResult(gameId);
    }

    @PostMapping("/simulate")
    public GameDto simulateUpdateResult(@RequestBody GameSimulationRequest request) {
        return gameService.simulateUpdateResult(request.game(), request.gameResultDto());
    }
}
