package crusadertippspielbackend.service;

import crusadertippspielbackend.dto.GroupStanding;
import crusadertippspielbackend.dto.entity.KnockoutRoundDto;
import crusadertippspielbackend.dto.entity.TournamentDto;
import crusadertippspielbackend.dto.mapper.TournamentMapper;
import crusadertippspielbackend.entity.*;
import crusadertippspielbackend.repository.KnockoutRoundRepository;
import crusadertippspielbackend.repository.TournamentRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Service for managing tournament knockout rounds.
 * Constructs, advances, and simulates the knockout brackets based on standings and match results.
 */
@Service
public class KnockoutRoundService {

    //Negativ id for simulated knockout round games, so they don't interfere with regular ids
    private static final AtomicLong SIM_ID_GENERATOR = new AtomicLong(-1);

    private final KnockoutRoundRepository knockoutRoundRepository;
    private final TournamentRepository tournamentRepository;

    private final GroupTableService groupTableService;

    private final TournamentMapper tournamentMapper;

    public KnockoutRoundService(KnockoutRoundRepository knockoutRoundRepository, TournamentRepository tournamentRepository, GroupTableService groupTableService, TournamentMapper tournamentMapper) {
        this.knockoutRoundRepository = knockoutRoundRepository;
        this.tournamentRepository = tournamentRepository;
        this.groupTableService = groupTableService;
        this.tournamentMapper = tournamentMapper;
    }

    @Transactional
    public KnockoutRoundDto generateFirstKnockoutRound(Long tournamentId) {
        Tournament tournament = tournamentRepository.findById(tournamentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Turnier nicht gefunden"));

        KnockoutRound firstRound = buildFirstKnockoutRound(tournament);
        return tournamentMapper.toDto(knockoutRoundRepository.save(firstRound));
    }

    @Transactional
    public KnockoutRoundDto generateNextKnockoutRound(Long tournamentId) {
        Tournament tournament = tournamentRepository.findById(tournamentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Turnier nicht gefunden"));

        KnockoutRound nextRound = buildNextKnockoutRound(tournament);
        return tournamentMapper.toDto(knockoutRoundRepository.save(nextRound));
    }

    public KnockoutRoundDto generateSimulationFirstKnockoutRound(TournamentDto tournamentDto) {
        Tournament tournament = tournamentMapper.toEntity(tournamentDto);
        KnockoutRound knockoutRound = buildFirstKnockoutRound(tournament);
        return tournamentMapper.toDto(setIdsForSimulatedKnockoutGames(knockoutRound));
    }

    public KnockoutRoundDto generateSimulationNextKnockoutRound(TournamentDto tournamentDto) {
        Tournament tournament = tournamentMapper.toEntity(tournamentDto);
        KnockoutRound previousKnockoutRound = tournament.getKnockoutRounds().getLast();
        previousKnockoutRound.setTournament(tournament);
        KnockoutRound knockoutRound = buildNextKnockoutRound(tournament);
        return tournamentMapper.toDto(setIdsForSimulatedKnockoutGames(knockoutRound));
    }

    private KnockoutRound buildFirstKnockoutRound(Tournament tournament) {
        if (!tournament.getKnockoutRounds().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Die K.o.-Runde für dieses Turnier wurde bereits gestartet!");
        }
        if (!tournament.isGroupStageCompleted()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Es wurden noch nicht alle Gruppenspiele gespielt");
        }

        List<GroupStanding> finalSeed = buildFinalSeedList(tournament);
        return createKnockoutRoundFromSeed(tournament, finalSeed);
    }

    private KnockoutRound createKnockoutRoundFromSeed(Tournament tournament, List<GroupStanding> finalSeed) {
        KnockoutRound firstRound = new KnockoutRound();
        firstRound.setTournament(tournament);
        List<Game> knockoutGames = foldAndCreateGames(finalSeed, firstRound);

        switch (knockoutGames.size()) {
            case 1:
                firstRound.setName("Finale");
                break;
            case 2:
                firstRound.setName("Halbfinale");
                break;
            case 4:
                firstRound.setName("Viertelfinale");
                break;
            case 8:
                firstRound.setName("Achtelfinale");
                break;
            case 16:
                firstRound.setName("Sechzehntelfinale");
                break;
            default:
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ungültige K.o-Rundengröße: " + knockoutGames.size());
        }
        firstRound.setGames(knockoutGames);
        return firstRound;
    }

    private KnockoutRound buildNextKnockoutRound(Tournament tournament) {
        KnockoutRound previousKnockoutRound = tournament.getKnockoutRounds().getLast();

        if (previousKnockoutRound.getTournament().areAllKnockoutRoundsGenerated()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Das Turnierbaum ist komplett, es können keine weiteren Runden generiert werden.");
        }

        if (!previousKnockoutRound.isCompleted()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Es wurden noch nicht alle Spiele der aktuellen K.o.-Runde gespielt");
        }

        KnockoutRound nextRound = new KnockoutRound();
        nextRound.setTournament(previousKnockoutRound.getTournament());

        List<Game> previousKnockoutRoundGames = previousKnockoutRound.getGames();
        int totalGames = previousKnockoutRoundGames.size();
        List<Game> knockoutGames = new ArrayList<>();
        boolean lastRound = false;


        if (totalGames > 2) {
            for (int i = 0; i < totalGames / 2; i++) {
                Game firstGame = previousKnockoutRoundGames.get(i);
                Game lastGame = previousKnockoutRoundGames.get(totalGames - 1 - i);

                Team strongTeam = firstGame.getWinner();
                Team weakTeam = lastGame.getWinner();

                knockoutGames.add(createKnockoutGame(strongTeam, weakTeam, nextRound));
            }
        } else { //Final and runners up game combined in one round
            Game semi1 = previousKnockoutRoundGames.get(0);
            Game semi2 = previousKnockoutRoundGames.get(1);

            Team winnerFirstGame = semi1.getWinner();
            Team winnerSecondGame = semi2.getWinner();

            Team loserFirstGame = semi1.getLoser();
            Team loserSecondGame = semi2.getLoser();

            knockoutGames.add(createKnockoutGame(winnerFirstGame, winnerSecondGame, nextRound));
            knockoutGames.add(createKnockoutGame(loserFirstGame, loserSecondGame, nextRound));
            lastRound = true;
        }
        if (lastRound) {
            nextRound.setName("Finale / Spiel um Platz 3");
        } else {
            switch (knockoutGames.size()) {
                case 4:
                    nextRound.setName("Viertelfinale");
                    break;
                case 8:
                    nextRound.setName("Achtelfinale");
                    break;
                case 16:
                    nextRound.setName("Sechzehntelfinale");
                    break;
                default:
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Diese K.o-Rundengröße" + knockoutGames.size() + "ist (noch) nicht vorgesehen");
            }
        }

        nextRound.setGames(knockoutGames);
        return nextRound;
    }

    private List<GroupStanding> buildFinalSeedList(Tournament tournament) {
        int qualifiedTeamsPerGroup = tournament.getTotalKoParticipants() / tournament.getNumberOfGroups();
        int wildcards = tournament.getTotalKoParticipants() % tournament.getNumberOfGroups();

        List<List<GroupStanding>> allGroupTables = new ArrayList<>();
        for (Group group : tournament.getGroups()) {
            allGroupTables.add(groupTableService.calculateTable(group));
        }
        Comparator<GroupStanding> crossGroupComparator = Comparator
                .comparingDouble(GroupStanding::points).reversed()
                .thenComparing(GroupStanding::wins, Comparator.reverseOrder())
                .thenComparing(GroupStanding::kills, Comparator.reverseOrder());

        List<GroupStanding> finalSeed = new ArrayList<>();

        // Puts the guaranteed qualified teams in the pots for the knockout round
        for (int rank = 0; rank < qualifiedTeamsPerGroup; rank++) {
            List<GroupStanding> pot = new ArrayList<>();
            for (List<GroupStanding> table : allGroupTables) {
                pot.add(table.get(rank));
            }
            pot.sort(crossGroupComparator);
            finalSeed.addAll(pot);
        }

        // Puts the wildcard teams in wildcard pots and evaluates the last knockout round teams by comparing their group statistics
        if (wildcards > 0) {
            List<GroupStanding> wildcardPot = new ArrayList<>();
            int wildcardRank = qualifiedTeamsPerGroup; // The spot just below the cut-off line. Assigned to a variable for better readability.

            for (List<GroupStanding> table : allGroupTables) {
                wildcardPot.add(table.get(wildcardRank));
            }

            wildcardPot.sort(crossGroupComparator);
            finalSeed.addAll(wildcardPot.subList(0, wildcards));
        }
        return finalSeed;
    }

    private List<Game> foldAndCreateGames(List<GroupStanding> finalSeed, KnockoutRound knockoutRound) {
        List<Game> knockoutGames = new ArrayList<>();
        int totalTeams = finalSeed.size();

        for (int i = 0; i < totalTeams / 2; i++) {
            Team strongTeam = finalSeed.get(i).team();
            Team weakTeam = finalSeed.get(totalTeams - 1 - i).team();

            knockoutGames.add(createKnockoutGame(strongTeam, weakTeam, knockoutRound));
        }

        return knockoutGames;
    }

    private Game createKnockoutGame(Team team1, Team team2, KnockoutRound round) {
        Game game = new Game();
        game.setTeam1(team1);
        game.setTeam2(team2);
        game.setKnockout(true);
        game.setPlayed(false);
        game.setKnockoutRound(round);
        return game;
    }

    private KnockoutRound setIdsForSimulatedKnockoutGames(KnockoutRound knockoutRound) {
        knockoutRound.setId(SIM_ID_GENERATOR.getAndDecrement());
        long simulatedIdCounter = -1L;
        for (Game game : knockoutRound.getGames()) {
            if (game.getId() == null) {
                game.setId(simulatedIdCounter);
                simulatedIdCounter--;
            }
        }
        return knockoutRound;
    }
}