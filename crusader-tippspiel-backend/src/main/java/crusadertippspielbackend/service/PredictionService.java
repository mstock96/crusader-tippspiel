package crusadertippspielbackend.service;

import crusadertippspielbackend.dto.*;
import crusadertippspielbackend.dto.entity.PredictionDto;
import crusadertippspielbackend.dto.mapper.TournamentMapper;
import crusadertippspielbackend.entity.*;
import crusadertippspielbackend.repository.PredictionRepository;
import crusadertippspielbackend.repository.TournamentRepository;
import crusadertippspielbackend.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Service for processing user predictions on tournaments.
 * Evaluates prediction scores, updates standings, and retrieves leaderboards based on tournament outcome.
 */
@Service
public class PredictionService {

    private final PredictionRepository predictionRepository;
    private final TournamentRepository tournamentRepository;
    private final UserRepository userRepository;

    private final GroupTableService groupTableService;

    private final TournamentMapper tournamentMapper;

    public PredictionService(PredictionRepository predictionRepository, TournamentRepository tournamentRepository, UserRepository userRepository, GroupTableService groupTableService, TournamentMapper tournamentMapper) {
        this.predictionRepository = predictionRepository;
        this.tournamentRepository = tournamentRepository;
        this.userRepository = userRepository;
        this.groupTableService = groupTableService;
        this.tournamentMapper = tournamentMapper;
    }

    @Transactional(readOnly = true)
    public PredictionShortFormDto findPredictionsFromUser(Long tournamentId, String userName) {
        Prediction prediction = predictionRepository.findPredictionsFromUser(tournamentId, userName).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Der User hat zu diesem Turnier keine Tipps abgegeben"));
        List<GroupTipShortFormDto> groupTipShortFormList = new ArrayList<>();
        int groupPoints = prediction.getGroupPoints();
        int podiumPoints = prediction.getPodiumPoints();
        int totalPoints = prediction.getTotalPoints();
        String winnerName = prediction.getWinner().getMembers().stream().map(Member::getName).collect(Collectors.joining(" & "));
        String secondWinnerName = prediction.getSecond().getMembers().stream().map(Member::getName).collect(Collectors.joining(" & "));
        String thirdWinnerName = "";
        Team third = prediction.getThird();
        if (third != null) {
            thirdWinnerName = prediction.getThird().getMembers().stream().map(Member::getName).collect(Collectors.joining(" & "));
        }
        return new PredictionShortFormDto(userName, groupPoints, podiumPoints, totalPoints, winnerName, secondWinnerName, thirdWinnerName, groupTipShortFormList);
    }

    @Transactional(readOnly = true)
    public PredictionShortFormDto findPredictionsFromUserForGroup(Long tournamentId, Long groupId, String userName) {
        Prediction prediction = predictionRepository.findPredictionsFromUserForGroup(tournamentId, groupId, userName).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Der User hat zu diesem Turnier keine Tipps abgegeben"));
        List<GroupTipShortFormDto> groupTipShortFormList = prediction.getGroupTips().stream().map(groupTip -> {
            String teamName = groupTip.getTeam().getMembers().stream().map(Member::getName).collect(Collectors.joining(" & "));
            return new GroupTipShortFormDto(teamName, groupTip.getPredictedPosition());
        }).sorted(Comparator.comparingInt(GroupTipShortFormDto::predictedPosition)).toList();

        int groupPoints = prediction.getGroupPoints();
        int podiumPoints = prediction.getPodiumPoints();
        int totalPoints = prediction.getTotalPoints();
        String winnerName = prediction.getWinner().getMembers().stream().map(Member::getName).collect(Collectors.joining(" & "));
        String secondWinnerName = prediction.getSecond().getMembers().stream().map(Member::getName).collect(Collectors.joining(" & "));
        String thirdWinnerName = "";
        Team third = prediction.getThird();
        if (third != null) {
            thirdWinnerName = prediction.getThird().getMembers().stream().map(Member::getName).collect(Collectors.joining(" & "));
        }
        return new PredictionShortFormDto(userName, groupPoints, podiumPoints, totalPoints, winnerName, secondWinnerName, thirdWinnerName, groupTipShortFormList);
    }

    @Transactional(readOnly = true)
    public List<LeaderboardRowDto> getPredictionLeaderboard(Long tournamentId) {
        return predictionRepository.getLeaderboardByTournamentId(tournamentId);
    }

    public Boolean hasUserPredicted(Long tournamentId, Long userId) {
        return predictionRepository.existsByTournamentIdAndUserId(tournamentId, userId);
    }

    public void updatePointsOfPredictions(Long tournamentId) {
        List<Prediction> predictions = predictionRepository.findByTournamentId(tournamentId);
        Tournament tournament = tournamentRepository.findById(tournamentId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Turnier nicht gefunden"));
        List<Group> groups = tournament.getGroups();
        Map<Long, Integer> teamPlacementMap = new HashMap<>();
        for (Group group : groups) {
            List<GroupStanding> groupStandings = new ArrayList<>(groupTableService.calculateTable(group));
            int index = 1;
            for (GroupStanding groupStanding : groupStandings) {
                teamPlacementMap.put(groupStanding.team().getId(), index);
                index++;
            }
        }
        for (Prediction prediction : predictions) {
            int groupPoints = calculateGroupPoints(prediction, teamPlacementMap, tournament);
            int podiumPoints = calculatePodiumPoints(prediction, tournament);
            prediction.setGroupPoints(groupPoints);
            prediction.setPodiumPoints(podiumPoints);
            prediction.setTotalPoints(groupPoints + podiumPoints);
        }
        predictionRepository.saveAll(predictions);
    }

    @Transactional
    public PredictionDto createPrediction(Long tournamentId, Long userId, CreatePredictionRequest request) {
        Prediction prediction = new Prediction();
        prediction.setUser(userRepository.getReferenceById(userId));
        prediction.setTournament(tournamentRepository.getReferenceById(tournamentId));

        prediction.setWinner(tournamentMapper.toEntity(request.winner()));
        prediction.setSecond(tournamentMapper.toEntity(request.second()));
        if (request.third() != null) {
            prediction.setThird(tournamentMapper.toEntity(request.third()));
        }

        for (CreateGroupTipRequest tipReq : request.groupTips()) {
            GroupTip tip = new GroupTip();
            tip.setTeam(tournamentMapper.toEntity(tipReq.team()));
            tip.setPredictedPosition(tipReq.predictedPosition());
            tip.setPrediction(prediction);
            prediction.getGroupTips().add(tip);
        }

        return tournamentMapper.toDto(predictionRepository.save(prediction));
    }

    private static int calculateGroupPoints(Prediction prediction, Map<Long, Integer> teamPlacementMap, Tournament tournament) {
        int points = 0;
        for (GroupTip groupTip : prediction.getGroupTips()) {
            Integer placement = teamPlacementMap.get(groupTip.getTeam().getId());
            if (placement != null && placement.equals(groupTip.getPredictedPosition())) {
                points += 1;
            }
        }
        return points;
    }

    private static int calculatePodiumPoints(Prediction prediction, Tournament tournament) {
        int points = 0;
        Team winner = tournament.getWinner();
        Team second = tournament.getSecond();
        Team third = tournament.getThird();
        if (winner != null && winner.getId().equals(prediction.getWinner().getId())) {
            points += 3;
        }
        if (second != null && second.getId().equals(prediction.getSecond().getId())) {
            points += 2;
        }
        Team predictionThird = prediction.getThird();
        if (third != null && predictionThird != null && third.getId().equals(prediction.getThird().getId())) {
            points += 1;
        }
        return points;
    }
}
