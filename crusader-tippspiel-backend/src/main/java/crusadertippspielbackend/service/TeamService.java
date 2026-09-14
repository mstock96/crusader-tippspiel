package crusadertippspielbackend.service;

import crusadertippspielbackend.entity.Member;
import crusadertippspielbackend.entity.Team;
import crusadertippspielbackend.entity.Tournament;
import crusadertippspielbackend.repository.MemberRepository;
import crusadertippspielbackend.repository.TeamRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

/**
 * Service for team management.
 * Registers and manages relationships between members and teams within a tournament.
 */
@Service
public class TeamService {

    private final TeamRepository teamRepository;
    private final MemberRepository memberRepository;

    public TeamService(TeamRepository teamRepository, MemberRepository memberRepository) {
        this.teamRepository = teamRepository;
        this.memberRepository = memberRepository;
    }

    public Team addMemberToTeam(Long teamId, Long memberId) {
        Team currentTeam = teamRepository.findById(teamId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Team nicht gefunden"));
        Member currentMember = memberRepository.findById(memberId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Member nicht gefunden"));

        Tournament tournament = currentTeam.getGroup().getTournament();
        if (currentTeam.getMembers().size() >= tournament.getAiPerTeam()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Maximale Teamgröße überschritten");
        }

        currentTeam.getMembers().add(currentMember);
        return teamRepository.save(currentTeam);
    }

    public Team updateTeamMembers(Long teamId, List<Member> memberList) {
        Team currentTeam = teamRepository.findById(teamId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Team nicht gefunden"));
        currentTeam.setMembers(memberList);
        return teamRepository.save(currentTeam);
    }
}
