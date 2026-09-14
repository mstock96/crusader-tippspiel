package crusadertippspielbackend.controller;

import crusadertippspielbackend.entity.Member;
import crusadertippspielbackend.entity.Team;
import crusadertippspielbackend.service.TeamService;
import jakarta.validation.constraints.Min;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller for managing teams.
 * Provides endpoints for configuring and updating team members.
 */
@RestController
@RequestMapping("/api/teams")
@Validated
public class TeamController {

    private final TeamService teamService;

    public TeamController(TeamService teamService) {
        this.teamService = teamService;
    }

    @PostMapping("/{teamId}/members/{memberId}")
    public Team addMemberToTeam(@PathVariable @Min(1) Long teamId, @PathVariable @Min(1) Long memberId) {
        return teamService.addMemberToTeam(teamId, memberId);
    }

    @PatchMapping("/{teamId}/update-members")
    public Team updateTeamMembers(@PathVariable @Min(1) Long teamId, @RequestBody List<Member> memberList) {
        return teamService.updateTeamMembers(teamId, memberList);
    }
}
