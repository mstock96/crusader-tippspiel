package crusadertippspielbackend.repository;

import crusadertippspielbackend.entity.KnockoutRound;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Spring Data JPA Repository for the KnockoutRound entity.
 * Supplies standard CRUD implementations for persistence logic.
 */
@Repository
public interface KnockoutRoundRepository extends JpaRepository<KnockoutRound, Long> {
}
