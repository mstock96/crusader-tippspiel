package crusadertippspielbackend.controller;

import crusadertippspielbackend.dto.entity.MemberDto;
import crusadertippspielbackend.service.MemberService;
import jakarta.validation.constraints.NotBlank;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller for managing members.
 * Provides endpoints for retrieving and creating members.
 */
@RestController
@RequestMapping("/api/members")
public class MemberController {

    private final MemberService memberService;

    public MemberController(MemberService memberService) {
        this.memberService = memberService;
    }

    @GetMapping
    public List<MemberDto> getAllMembers() {
        return memberService.getAllMembers();
    }

    @PostMapping
    public MemberDto createMember(@RequestBody @NotBlank String memberName) {
        return memberService.createMember(memberName);
    }
}
