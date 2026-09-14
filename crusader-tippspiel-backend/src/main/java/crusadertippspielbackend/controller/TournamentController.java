package crusadertippspielbackend.controller;

import crusadertippspielbackend.dto.CreateTournamentRequest;
import crusadertippspielbackend.dto.TournamentInfoDto;
import crusadertippspielbackend.dto.entity.GroupDto;
import crusadertippspielbackend.dto.entity.KnockoutRoundDto;
import crusadertippspielbackend.dto.entity.TournamentDto;
import crusadertippspielbackend.service.KnockoutRoundService;
import crusadertippspielbackend.service.TournamentService;
import jakarta.validation.constraints.Min;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller for managing tournaments.
 * Provides endpoints for retrieving, creating, starting, and finishing tournaments,
 * as well as generating and simulating knockout rounds.
 */
@RestController
@RequestMapping("/api/tournaments")
@Validated
public class TournamentController {

    private final TournamentService tournamentService;
    private final KnockoutRoundService knockoutRoundService;

    public TournamentController(TournamentService tournamentService, KnockoutRoundService knockoutRoundService) {
        this.tournamentService = tournamentService;
        this.knockoutRoundService = knockoutRoundService;
    }

    @GetMapping("/{tournamentId}")
    public TournamentDto getTournament(@PathVariable @Min(1) Long tournamentId) {
        return tournamentService.getTournament(tournamentId);
    }

    @GetMapping("/infos")
    public List<TournamentInfoDto> getTournamentInfo() {
        return tournamentService.getAllTournamentInfos();
    }

    @GetMapping("/{tournamentId}/info")
    public TournamentInfoDto getTournamentInfo(@PathVariable @Min(1) Long tournamentId) {
        return tournamentService.getTournamentInfo(tournamentId);
    }

    @PostMapping("/create")
    public TournamentDto createTournament(@RequestBody CreateTournamentRequest createTournamentRequest) {
        return tournamentService.createTournament(createTournamentRequest);
    }

    @GetMapping("/{tournamentId}/groups")
    public List<GroupDto> getGroups(@PathVariable @Min(1) Long tournamentId) {
        return tournamentService.getGroups(tournamentId);
    }

    @PostMapping("/{tournamentId}/start")
    public List<GroupDto> startTournament(@PathVariable @Min(1) Long tournamentId) {
        return tournamentService.startTournament(tournamentId);
    }

    @PostMapping("/{tournamentId}/finish")
    public TournamentDto finishTournament(@PathVariable @Min(1) Long tournamentId) {
        return tournamentService.finishTournament(tournamentId);
    }

    @PostMapping("/{tournamentId}/knockout-rounds")
    public KnockoutRoundDto startKnockoutPhase(@PathVariable @Min(1) Long tournamentId) {
        return knockoutRoundService.generateFirstKnockoutRound(tournamentId);
    }

    @PostMapping("/{tournamentId}/knockout-rounds/next")
    public KnockoutRoundDto startNextKnockoutPhase(@PathVariable @Min(1) Long tournamentId) {
        return knockoutRoundService.generateNextKnockoutRound(tournamentId);
    }

    /**
     * Simulates the generation of the first knockout round based on the provided tournament data.
     * Used as a logic calculator for the frontend.
     * Does not open a database connection.
     *
     * @param tournamentDto the tournament data used for simulation
     * @return the simulated {@link KnockoutRoundDto} for the first knockout round
     */
    @PostMapping("/simulate/knockout-rounds")
    public KnockoutRoundDto simulateStartKnockoutPhase(@RequestBody TournamentDto tournamentDto) {
        return knockoutRoundService.generateSimulationFirstKnockoutRound(tournamentDto);
    }

    /**
     * Simulates the generation of the next knockout round based on the provided tournament data.
     * Used as a logic calculator for the frontend.
     * Does not open a database connection.
     *
     * @param tournamentDto the tournament data used for simulation
     * @return the simulated {@link KnockoutRoundDto} for the next knockout round
     */
    @PostMapping("/simulate/knockout-rounds/next")
    public KnockoutRoundDto simulateStartNextKnockoutPhase(@RequestBody TournamentDto tournamentDto) {
        return knockoutRoundService.generateSimulationNextKnockoutRound(tournamentDto);
    }

    /**
     * Simulates finishing the tournament based on the provided tournament data.
     * Used as a logic calculator for the frontend.
     * Does not open a database connection.
     *
     * @param tournamentDto the tournament data used for simulation
     * @return the simulated finalized {@link TournamentDto}
     */
    @PostMapping("/simulate/finish")
    public TournamentDto simulateFinishTournament(@RequestBody TournamentDto tournamentDto) {
        return tournamentService.simulateFinishTournament(tournamentDto);
    }
}
