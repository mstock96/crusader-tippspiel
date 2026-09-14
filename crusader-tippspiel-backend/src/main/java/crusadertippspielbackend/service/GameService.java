package crusadertippspielbackend.service;

import crusadertippspielbackend.dto.GameResultDto;
import crusadertippspielbackend.dto.entity.GameDto;
import crusadertippspielbackend.dto.mapper.TournamentMapper;
import crusadertippspielbackend.entity.Game;
import crusadertippspielbackend.entity.Team;
import crusadertippspielbackend.entity.Tournament;
import crusadertippspielbackend.repository.GameRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * Service for managing game operations.
 * Handles updating of game results, simulating updates, and triggering score distribution.
 */
@Service
public class GameService {

    private final GameRepository gameRepository;
    private final PredictionService predictionService;

    private final TournamentMapper tournamentMapper;

    public GameService(GameRepository gameRepository, PredictionService predictionService, TournamentMapper tournamentMapper) {
        this.gameRepository = gameRepository;
        this.predictionService = predictionService;
        this.tournamentMapper = tournamentMapper;
    }

    @Transactional
    public GameDto updateResult(Long gameId, GameResultDto gameResultDto) {
        Game currentGame = gameRepository.findById(gameId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Spiel nicht gefunden"));

        applyUpdateLogic(currentGame, gameResultDto);

        Game tmp = gameRepository.save(currentGame);
        predictionService.updatePointsOfPredictions(currentGame.getTournament().getId());
        return tournamentMapper.toDto(tmp);
    }

    @Transactional
    public GameDto removeResult(Long gameId) {
        Game currentGame = gameRepository.findById(gameId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Spiel nicht gefunden"));
        Tournament tournament = currentGame.getTournament();
        int maxKills = tournament.getAiPerTeam();
        removeOldResult(currentGame, maxKills);
        Game tmp = gameRepository.save(currentGame);
        predictionService.updatePointsOfPredictions(currentGame.getTournament().getId());
        return tournamentMapper.toDto(tmp);
    }

    public GameDto simulateUpdateResult(GameDto simulatedGameDto, GameResultDto gameResultDto) {
        Game simulatedGame = tournamentMapper.toEntity(simulatedGameDto);
        applyUpdateLogic(simulatedGame, gameResultDto);
        return tournamentMapper.toDto(simulatedGame);
    }

    private void evaluateResult(Game game, GameResultDto gameResultDto, int maxKills) {
        Team team1 = game.getTeam1();
        Team team2 = game.getTeam2();
        int gameTeam1Kills = gameResultDto.team1Kills();
        int gameTeam2Kills = gameResultDto.team2Kills();
        boolean isKnockout = game.isKnockout();

        if (gameTeam1Kills > gameTeam2Kills && (gameTeam1Kills == maxKills || isKnockout)) {
            team1.setWins(team1.getWins() + 1);
            team2.setLosses(team2.getLosses() + 1);
        } else if (gameTeam1Kills < gameTeam2Kills && (gameTeam2Kills == maxKills || isKnockout)) {
            team1.setLosses(team1.getLosses() + 1);
            team2.setWins(team2.getWins() + 1);
        } else {
            team1.setTies(team1.getTies() + 1);
            team2.setTies(team2.getTies() + 1);
        }
        team1.setKills(team1.getKills() + gameTeam1Kills);
        team2.setKills(team2.getKills() + gameTeam2Kills);

        game.setTeam1Kills(gameTeam1Kills);
        game.setTeam2Kills(gameTeam2Kills);

        game.setPlayed(true);
    }

    private void removeOldResult(Game game, int maxKills) {
        Team team1 = game.getTeam1();
        Team team2 = game.getTeam2();
        int gameTeam1Kills = game.getTeam1Kills();
        int gameTeam2Kills = game.getTeam2Kills();
        boolean isKnockout = game.isKnockout();

        if (gameTeam1Kills > gameTeam2Kills && (gameTeam1Kills == maxKills || isKnockout)) {
            team1.setWins(team1.getWins() - 1);
            team2.setLosses(team2.getLosses() - 1);
        } else if (gameTeam1Kills < gameTeam2Kills && (gameTeam2Kills == maxKills || isKnockout)) {
            team1.setLosses(team1.getLosses() - 1);
            team2.setWins(team2.getWins() - 1);
        } else {
            team1.setTies(team1.getTies() - 1);
            team2.setTies(team2.getTies() - 1);
        }
        team1.setKills(team1.getKills() - gameTeam1Kills);
        team2.setKills(team2.getKills() - gameTeam2Kills);

        game.setTeam1Kills(0);
        game.setTeam2Kills(0);

        game.setPlayed(false);
    }

    /**
     * 1 Validates the input.
     * 2 Removes the old results.
     * 3 Adds the new results.
     * @param game the game to be updated
     * @param gameResultDto the new result
     */
    private void applyUpdateLogic(Game game, GameResultDto gameResultDto) {
        //Tournament tournament = game.getTournament();
        //int maxKills = tournament.getAiPerTeam(); klappt nicht in Simulation, da Group das Tournament dort nicht kennt
        int maxKills = game.getTeam1().getMembers().size();

        validateGameResult(gameResultDto, game.isKnockout(), maxKills);

        if (game.isPlayed()) {
            removeOldResult(game, maxKills);
        }

        evaluateResult(game, gameResultDto, maxKills);
    }

    private void validateGameResult(GameResultDto gameResultDto, boolean isKnockoutRound, int maxKills) {
        if (gameResultDto.team1Kills() > maxKills || gameResultDto.team2Kills() > maxKills) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Zu viele Kills.");
        }

        boolean isTie = gameResultDto.team1Kills() == gameResultDto.team2Kills();

        if (isTie) {
            if (isKnockoutRound) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "In der K.o.-Runde gibt es kein Unentschieden.");
            }
            if (gameResultDto.team1Kills() == maxKills) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Beide Teams können nicht gleichzeitig das Limit erreichen.");
            }
        }
    }
}
