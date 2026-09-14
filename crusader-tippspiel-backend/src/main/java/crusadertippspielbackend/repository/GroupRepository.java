package crusadertippspielbackend.repository;

import crusadertippspielbackend.entity.Group;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Spring Data JPA Repository for the Group entity.
 * Facilitates custom ordered retrievals of specific tournament groupings.
 */
@Repository
public interface GroupRepository extends JpaRepository<Group, Long> {

    List<Group> findByTournamentIdOrderByNameAsc(Long tournamentId);

}