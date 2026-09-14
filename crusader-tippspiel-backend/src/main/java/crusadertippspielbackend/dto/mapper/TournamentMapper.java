package crusadertippspielbackend.dto.mapper;

import crusadertippspielbackend.dto.GroupStanding;
import crusadertippspielbackend.dto.GroupStandingDto;
import crusadertippspielbackend.dto.entity.*;
import crusadertippspielbackend.entity.*;
import org.mapstruct.Mapper;

import java.util.List;

/**
 * MapStruct interface defining explicit translation conversions between Data Transfer Objects and standard Database Entities.
 * Crucial for cleanly shifting data across the application layers while evading lazy initialization proxies and circular persistence issues.
 */
@Mapper(componentModel = "spring")
public interface TournamentMapper {

    TournamentDto toDto(Tournament tournament);

    KnockoutRoundDto toDto(KnockoutRound knockoutRound);

    GroupDto toDto(Group group);

    GameDto toDto(Game game);

    TeamDto toDto(Team team);

    MemberDto toDto(Member member);

    PredictionDto toDto(Prediction prediction);

    GroupTipDto toDto(GroupTip groupTip);

    GroupStandingDto toDto(GroupStanding standing);

    List<GroupStandingDto> toGroupStandingDtoList(List<GroupStanding> standings);


    Tournament toEntity(TournamentDto tournamentDto);

    KnockoutRound toEntity(KnockoutRoundDto knockoutRoundDto);

    Group toEntity(GroupDto groupDto);

    Game toEntity(GameDto gameDto);

    Team toEntity(TeamDto teamDto);

    Member toEntity(MemberDto memberDto);

    Prediction toEntity(PredictionDto predictionDto);

    GroupTip toEntity(GroupTipDto groupTipDto);
}
