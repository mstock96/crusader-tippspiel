package crusadertippspielbackend.controller;

import crusadertippspielbackend.dto.CreatePredictionRequest;
import crusadertippspielbackend.dto.LeaderboardRowDto;
import crusadertippspielbackend.dto.PredictionShortFormDto;
import crusadertippspielbackend.dto.entity.PredictionDto;
import crusadertippspielbackend.service.PredictionService;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller for managing user predictions.
 * Provides endpoints for retrieving, creating, and leaderboard scoring of user predictions in tournaments.
 */
@RestController
@RequestMapping("/api/predictions")
public class PredictionController {

    private final PredictionService predictionService;

    public PredictionController(PredictionService predictionService) {
        this.predictionService = predictionService;
    }

    @GetMapping("/{tournamentId}/prediction/{userName}")
    public PredictionShortFormDto findPredictionsFromUser(@PathVariable @Min(1) Long tournamentId, @PathVariable @NotBlank String userName) {
        return predictionService.findPredictionsFromUser(tournamentId, userName);
    }

    @GetMapping("/{tournamentId}/prediction/{userName}/group/{groupId}")
    public PredictionShortFormDto findPredictionsFromUserForGroup(@PathVariable @Min(1) Long tournamentId, @PathVariable @Min(1) Long groupId, @PathVariable @NotBlank String userName) {
        return predictionService.findPredictionsFromUserForGroup(tournamentId, groupId, userName);
    }

    @GetMapping("/{tournamentId}/leaderboard")
    public List<LeaderboardRowDto> getPredictionLeaderboard(@PathVariable @Min(1) Long tournamentId) {
        return predictionService.getPredictionLeaderboard(tournamentId);
    }

    @GetMapping("/{tournamentId}/has-predicted/{userId}")
    public Boolean hasUserPredicted(@PathVariable @Min(1) Long tournamentId, @PathVariable @Min(1) Long userId) {
        return predictionService.hasUserPredicted(tournamentId, userId);
    }

    @PostMapping("/{tournamentId}/create/{userId}")
    public PredictionDto createPrediction(@PathVariable @Min(1) Long tournamentId, @PathVariable @Min(1) Long userId, @RequestBody CreatePredictionRequest createPredictionRequest) {
        return predictionService.createPrediction(tournamentId, userId, createPredictionRequest);
    }
}