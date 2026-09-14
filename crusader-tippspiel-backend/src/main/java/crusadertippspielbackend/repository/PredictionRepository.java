package crusadertippspielbackend.repository;

import crusadertippspielbackend.dto.LeaderboardRowDto;
import crusadertippspielbackend.entity.Prediction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Spring Data JPA Repository for the Prediction entity.
 * Executes advanced queries involving explicit fetching of nested tables to mitigate lazy-loading during REST conversion, and resolves dynamic leaderboard compilations.
 */
@Repository
public interface PredictionRepository extends JpaRepository<Prediction, Long> {

    List<Prediction> findByTournamentId(Long tournamentId);

    @Query("SELECT new crusadertippspielbackend.dto.LeaderboardRowDto(u.username, p.groupPoints, p.podiumPoints, p.totalPoints) " +
            "FROM Prediction p " +
            "LEFT JOIN p.user u " +
            "WHERE p.tournament.id = :tournamentId " +
            "ORDER BY p.totalPoints DESC")
    List<LeaderboardRowDto> getLeaderboardByTournamentId(@Param("tournamentId") Long tournamentId);

    @Query("SELECT p FROM Prediction p " +
            "LEFT JOIN FETCH p.user u " +
            "WHERE p.tournament.id = :tournamentId AND u.username = :userName")
    Optional<Prediction> findPredictionsFromUser(@Param("tournamentId") Long tournamentId, @Param("userName") String userName);

    @Query("SELECT p FROM Prediction p " +
            "LEFT JOIN FETCH p.groupTips gt " +
            "LEFT JOIN FETCH p.user u " +
            "WHERE p.tournament.id = :tournamentId AND u.username = :userName AND gt.team.group.id = :groupId")
    Optional<Prediction> findPredictionsFromUserForGroup(@Param("tournamentId") Long tournamentId, @Param("groupId") Long groupId, @Param("userName") String userName);

    boolean existsByTournamentIdAndUserId(Long tournamentId, Long userId);
}
