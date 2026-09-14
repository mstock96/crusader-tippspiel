package crusadertippspielbackend.service;

import crusadertippspielbackend.dto.entity.MemberDto;
import crusadertippspielbackend.dto.mapper.TournamentMapper;
import crusadertippspielbackend.entity.Member;
import crusadertippspielbackend.repository.MemberRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Service for handling member operations.
 * Allows retrieving all registered members and registering new ones.
 */
@Service
public class MemberService {

    private final MemberRepository memberRepository;

    private final TournamentMapper tournamentMapper;

    public MemberService(MemberRepository memberRepository, TournamentMapper tournamentMapper) {
        this.memberRepository = memberRepository;
        this.tournamentMapper = tournamentMapper;
    }

    public List<MemberDto> getAllMembers() {
        return memberRepository.findAll(Sort.by(Sort.Direction.ASC, "name")).stream().map(tournamentMapper::toDto).toList();
    }

    public MemberDto createMember(String memberName) {
        Member newMember = new Member();
        newMember.setName(memberName);
        return tournamentMapper.toDto(memberRepository.save(newMember));
    }
}
