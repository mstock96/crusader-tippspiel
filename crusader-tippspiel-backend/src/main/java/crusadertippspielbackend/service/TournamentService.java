package crusadertippspielbackend.service;

import crusadertippspielbackend.dto.CreateTournamentRequest;
import crusadertippspielbackend.dto.TournamentInfoDto;
import crusadertippspielbackend.dto.entity.GroupDto;
import crusadertippspielbackend.dto.entity.TournamentDto;
import crusadertippspielbackend.dto.mapper.TournamentMapper;
import crusadertippspielbackend.entity.*;
import crusadertippspielbackend.repository.GroupRepository;
import crusadertippspielbackend.repository.TournamentRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

/**
 * Service for central tournament operations.
 * Handles the creation, starting, logic-validation, and finalization of tournaments alongside empty-group generation.
 */
@Service
public class TournamentService {

    private final TournamentRepository tournamentRepository;
    private final GroupRepository groupRepository;

    private final GroupService groupService;

    private final TournamentMapper tournamentMapper;

    public TournamentService(TournamentRepository tournamentRepository, GroupRepository groupRepository, GroupService groupService, TournamentMapper tournamentMapper) {
        this.tournamentRepository = tournamentRepository;
        this.groupRepository = groupRepository;
        this.groupService = groupService;
        this.tournamentMapper = tournamentMapper;
    }

    @Transactional(readOnly = true)
    public TournamentDto getTournament(Long tournamentId) {
        Tournament tournament = tournamentRepository.findById(tournamentId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Turnier nicht gefunden"));
        return tournamentMapper.toDto(tournament);
    }

    @Transactional(readOnly = true)
    public List<TournamentInfoDto> getAllTournamentInfos() {
        return tournamentRepository.getAllTournamentInfos();
    }

    public TournamentInfoDto getTournamentInfo(Long tournamentId) {
        return tournamentRepository.getTournamentInfoById(tournamentId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Turnier nicht gefunden"));
    }

    @Transactional
    public TournamentDto createTournament(CreateTournamentRequest createTournamentRequest) {
        Tournament tournament = new Tournament();
        tournament.setName(createTournamentRequest.name());
        tournament.setNumberOfGroups(createTournamentRequest.numberOfGroups());
        tournament.setTeamsPerGroup(createTournamentRequest.teamsPerGroup());
        tournament.setAiPerTeam(createTournamentRequest.aiPerTeam());
        tournament.setTotalKoParticipants(createTournamentRequest.totalKoParticipants());

        int koP = tournament.getTotalKoParticipants();
        if (koP <= 0 || (koP & (koP - 1)) != 0) { //Is  the number of knockout round participants to the power of two
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "K.o.-Teilnehmer müssen eine Zweierpotenz sein (2, 4, 8, 16...)");
        }
        if (!(tournament.getNumberOfGroups() > 0 && tournament.getTeamsPerGroup() > 0 && tournament.getAiPerTeam() > 0)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Einstellungen dürfen nicht 0 sein");
        }
        if (tournament.getNumberOfGroups() * tournament.getTeamsPerGroup() < koP) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Zu wenig Teams für die gewünschte K.o.-Rundengröße");
        }

        Tournament retT = tournamentRepository.save(tournament);
        generateEmptyGroups(retT.getId());
        return tournamentMapper.toDto(retT);
    }

    @Transactional(readOnly = true)
    public List<GroupDto> getGroups(Long tournamentId) {
        return groupRepository.findByTournamentIdOrderByNameAsc(tournamentId).stream().map(tournamentMapper::toDto).toList();
    }

    @Transactional
    public List<GroupDto> startTournament(Long tournamentId) {
        Tournament currentTournament = tournamentRepository.findById(tournamentId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Turnier nicht gefunden"));
        List<Group> groups = currentTournament.getGroups();

        validateTournament(currentTournament);

        for (Group group : groups) {
            groupService.generateGamesForGroup(group);
        }
        currentTournament.setStarted(true);
        tournamentRepository.save(currentTournament);
        return groups.stream().map(tournamentMapper::toDto).toList();
    }

    @Transactional
    public TournamentDto finishTournament(Long tournamentId) {
        Tournament currentTournament = tournamentRepository.findById(tournamentId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Turnier nicht gefunden"));
        applyFinishLogic(currentTournament);
        return tournamentMapper.toDto(tournamentRepository.save(currentTournament));
    }

    public TournamentDto simulateFinishTournament(TournamentDto tournamentDto) {
        Tournament tournament = tournamentMapper.toEntity(tournamentDto);
        applyFinishLogic(tournament);
        return tournamentMapper.toDto(tournament);
    }

    private void applyFinishLogic(Tournament tournament) {
        if (!tournament.isKnockoutPhaseFinished()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Das Turnier kann noch nicht beendet werden, da das (Kleine-)Finale noch nicht fertig gespielt ist.");
        }
        tournament.setFinished(true);
        KnockoutRound lastRound = tournament.getKnockoutRounds().getLast();
        Game finalGame = lastRound.getGames().getFirst();
        Game runnersupGame = lastRound.getGames().getLast();
        tournament.setWinner(finalGame.getWinner());
        tournament.setSecond(finalGame.getLoser());
        if (finalGame != runnersupGame) {
            tournament.setThird(runnersupGame.getWinner());
        }
    }

    private void validateTournament(Tournament tournament) {
        List<Group> groups = tournament.getGroups();

        if (groups.size() != tournament.getNumberOfGroups()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unzulässige Gruppengröße");
        }

        for (Group group : groups) {
            if (group.getTeams().size() != tournament.getTeamsPerGroup()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unzulässige Teamanzahl");
            }

            for (Team team : group.getTeams()) {
                if (team.getMembers().size() != tournament.getAiPerTeam()) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unzulässige Teamgröße");
                }
            }
        }
    }

    private void generateEmptyGroups(Long tournamentId) {
        Tournament currentTournament = tournamentRepository.findById(tournamentId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Turnier nicht gefunden"));
        int numberOfGroups = currentTournament.getNumberOfGroups();

        char groupName = 'A';

        for (int i = 0; i < numberOfGroups; i++) {
            Group group = new Group();
            group.setName("Gruppe " + groupName);
            group.setTournament(currentTournament);

            for (int j = 0; j < currentTournament.getTeamsPerGroup(); j++) {
                Team emptyTeam = new Team();
                emptyTeam.setGroup(group);

                group.getTeams().add(emptyTeam);
            }

            currentTournament.getGroups().add(group);
            groupName++;
        }
        tournamentRepository.save(currentTournament);
    }
}