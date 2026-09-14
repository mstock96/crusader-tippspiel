package crusadertippspielbackend.repository;

import crusadertippspielbackend.entity.Member;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Spring Data JPA Repository for the Member entity.
 * Provides basic CRUD persistence access to all participant accounts.
 */
@Repository
public interface MemberRepository extends JpaRepository<Member, Long> {
}
