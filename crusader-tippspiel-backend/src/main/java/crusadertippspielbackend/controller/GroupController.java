package crusadertippspielbackend.controller;

import crusadertippspielbackend.dto.GroupStandingDto;
import crusadertippspielbackend.dto.entity.GroupDto;
import crusadertippspielbackend.service.GroupService;
import jakarta.validation.constraints.Min;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller for managing tournament groups.
 * Provides endpoints for retrieving group tables and updating multiple groups.
 */
@RestController
@RequestMapping("/api/groups")
@Validated
public class GroupController {

    private final GroupService groupService;

    public GroupController(GroupService groupService) {
        this.groupService = groupService;
    }

    @GetMapping("/{groupId}/table")
    public List<GroupStandingDto> getTableForGroup(@PathVariable @Min(1) Long groupId) {
        return groupService.getTableForGroup(groupId);
    }

    @PostMapping("/table")
    public List<GroupStandingDto> getTableForGroup(@RequestBody GroupDto groupDto) {
        return groupService.getTableForGroup(groupDto);
    }

    @PatchMapping("/bulk/update")
    public List<GroupDto> updateAllGroups(@RequestBody List<GroupDto> groupList) {
        return groupService.updateAllGroups(groupList);
    }
}
