package crusadertippspielbackend.repository;

import crusadertippspielbackend.entity.Game;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Spring Data JPA Repository for the Game entity.
 * Provides custom JPQL queries to fetch games across specific tournaments.
 */
@Repository
public interface GameRepository extends JpaRepository<Game, Long> {

    @Query("SELECT g FROM Game g " +
            "LEFT JOIN g.group gr " +
            "LEFT JOIN g.knockoutRound ko " +
            "WHERE gr.tournament.id = :tournamentId OR ko.tournament.id = :tournamentId")
    List<Game> findAllGamesByTournamentId(@Param("tournamentId") Long tournamentId);

}