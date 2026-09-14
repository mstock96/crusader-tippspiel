package crusadertippspielbackend.repository;

import crusadertippspielbackend.entity.Team;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Spring Data JPA Repository for the Team entity.
 * Automates base persistence operations required for team building logic.
 */
@Repository
public interface TeamRepository extends JpaRepository<Team, Long> {
}
