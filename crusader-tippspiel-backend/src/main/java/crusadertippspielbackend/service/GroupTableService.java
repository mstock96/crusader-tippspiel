package crusadertippspielbackend.service;

import crusadertippspielbackend.dto.GroupStanding;
import crusadertippspielbackend.entity.Game;
import crusadertippspielbackend.entity.Group;
import crusadertippspielbackend.entity.Team;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/**
 * Service for calculating group standings.
 * Translates match results into points based on custom game logic.
 */
@Service
public class GroupTableService {

    public List<GroupStanding> calculateTable(Group group) {
        List<Game> games = group.getGames();
        List<GroupStanding> standings = calculatePoints(group, games);

        // Table sort: points > wins > ties > kills > head-to-head > first team named - should never happen, but case needs to be caught
        standings.sort(Comparator
                .comparing(GroupStanding::points, Comparator.reverseOrder())
                .thenComparing(GroupStanding::wins, Comparator.reverseOrder())
                .thenComparing(GroupStanding::ties, Comparator.reverseOrder())
                .thenComparing(GroupStanding::kills, Comparator.reverseOrder())
                .thenComparing((s1, s2) -> {
                    Team t1 = s1.team();
                    Team t2 = s2.team();

                    for (Game game : games) {
                        if (!game.isPlayed()) continue;

                        boolean isHeadToHead = (game.getTeam1().equals(t1) && game.getTeam2().equals(t2)) ||
                                (game.getTeam1().equals(t2) && game.getTeam2().equals(t1));

                        if (isHeadToHead) {
                            int k1 = game.getTeam1().equals(t1) ? game.getTeam1Kills() : game.getTeam2Kills();
                            int k2 = game.getTeam1().equals(t2) ? game.getTeam1Kills() : game.getTeam2Kills();

                            return Integer.compare(k2, k1);
                        }
                    }
                    return 0;
                })
        );

        return standings;
    }

    private static List<GroupStanding> calculatePoints(Group group, List<Game> games) {
        List<Team> teams = group.getTeams();
        //int maxKills = group.getTournament().getAiPerTeam(); klappt nicht in Simulation, da Group da das Tournament nicht hat
        int maxKills = group.getTeams().getFirst().getMembers().size();

        List<GroupStanding> standings = new ArrayList<>();

        // Calculating team statistics
        for (Team team : teams) {
            int wins = 0, ties = 0, losses = 0, kills = 0;

            for (Game game : games) {
                if (!game.isPlayed()) continue;

                if (game.getTeam1().getId().equals(team.getId())) {
                    kills += game.getTeam1Kills();
                    boolean isWin = game.getTeam1Kills() > game.getTeam2Kills() && game.getTeam1Kills() == maxKills;
                    boolean isLoss = game.getTeam2Kills() > game.getTeam1Kills() && game.getTeam2Kills() == maxKills;

                    if (isWin) wins++;
                    else if (isLoss) losses++;
                    else ties++;

                } else if (game.getTeam2().getId().equals(team.getId())) {
                    kills += game.getTeam2Kills();
                    boolean isWin = game.getTeam2Kills() > game.getTeam1Kills() && game.getTeam2Kills() == maxKills;
                    boolean isLoss = game.getTeam1Kills() > game.getTeam2Kills() && game.getTeam1Kills() == maxKills;

                    if (isWin) wins++;
                    else if (isLoss) losses++;
                    else ties++;
                }
            }

            // The chosen point distribution
            double points = (wins * 1.0) + (ties * 0.5) + (kills * 0.5);

            standings.add(new GroupStanding(team, points, wins, ties, losses, kills));
        }
        return standings;
    }
}