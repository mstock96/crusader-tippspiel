package crusadertippspielbackend.service;

import crusadertippspielbackend.dto.GroupStandingDto;
import crusadertippspielbackend.dto.entity.GroupDto;
import crusadertippspielbackend.dto.mapper.TournamentMapper;
import crusadertippspielbackend.entity.Game;
import crusadertippspielbackend.entity.Group;
import crusadertippspielbackend.entity.Team;
import crusadertippspielbackend.repository.GroupRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;

/**
 * Service for managing tournament groups.
 * Handles the generation of game schedules, group updates, and table retrieval.
 */
@Service
public class GroupService {

    private final GroupTableService groupTableService;

    private final GroupRepository groupRepository;

    private final TournamentMapper tournamentMapper;

    public GroupService(GroupRepository groupRepository, GroupTableService groupTableService, TournamentMapper tournamentMapper) {
        this.groupTableService = groupTableService;
        this.groupRepository = groupRepository;
        this.tournamentMapper = tournamentMapper;
    }

    @Transactional
    public void generateGamesForGroup(Group group) {
        if (!group.getGames().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Der Spielplan für diese Gruppe wurde bereits generiert!");
        }

        List<Team> teams = group.getTeams();

        for (int i = 0; i < teams.size(); i++) {
            for (int j = i + 1; j < teams.size(); j++) {
                Game game = new Game();
                game.setTeam1(teams.get(i));
                game.setTeam2(teams.get(j));
                game.setGroup(group);

                group.getGames().add(game);
            }
        }
    }

    @Transactional(readOnly = true)
    public List<GroupStandingDto> getTableForGroup(Long groupId) {
        Group group = groupRepository.findById(groupId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Gruppe nicht gefunden"));
        return tournamentMapper.toGroupStandingDtoList(groupTableService.calculateTable(group));
    }

    public List<GroupStandingDto> getTableForGroup(GroupDto groupDto) {
        return tournamentMapper.toGroupStandingDtoList(groupTableService.calculateTable(tournamentMapper.toEntity(groupDto)));
    }

    @Transactional
    public List<GroupDto> updateAllGroups(List<GroupDto> groupDtoList) {
        List<Group> retGroupList = new ArrayList<>();
        List<Group> groupList = groupDtoList.stream().map(tournamentMapper::toEntity).toList();
        for (Group updateGroup : groupList) {
            Group existingGroup = groupRepository.findById(updateGroup.getId()).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Gruppe nicht gefunden"));
            for (Team updateTeam : updateGroup.getTeams()) {
                existingGroup.getTeams().stream()
                        .filter(t -> t.getId().equals(updateTeam.getId()))
                        .findFirst()
                        .ifPresent(existingTeam -> {
                            existingTeam.setMembers((updateTeam.getMembers()));
                        });
            }
            retGroupList.add(groupRepository.save(existingGroup));
        }
        return retGroupList.stream().map(tournamentMapper::toDto).toList();
    }
}
