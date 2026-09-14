package crusadertippspielbackend.repository;

import crusadertippspielbackend.dto.TournamentInfoDto;
import crusadertippspielbackend.entity.Tournament;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Spring Data JPA Repository for the Tournament entity.
 * Supplies custom JPQL mapping to extract direct DTO projections safely and efficiently instead of full-graph extractions.
 */
@Repository
public interface TournamentRepository extends JpaRepository<Tournament, Long> {

    @Query("SELECT new crusadertippspielbackend.dto.TournamentInfoDto(t.id, t.name, t.finished, t.started, t.numberOfGroups, t.teamsPerGroup, t.aiPerTeam, t.totalKoParticipants) " +
            "FROM Tournament t " +
            "WHERE t.id = :tournamentId ")
    Optional<TournamentInfoDto> getTournamentInfoById(@Param("tournamentId") Long tournamentId);

    @Query("SELECT new crusadertippspielbackend.dto.TournamentInfoDto(t.id, t.name, t.finished, t.started, t.numberOfGroups, t.teamsPerGroup, t.aiPerTeam, t.totalKoParticipants) " +
            "FROM Tournament t ")
    List<TournamentInfoDto> getAllTournamentInfos();
}
