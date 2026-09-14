package crusadertippspielbackend.repository;

import crusadertippspielbackend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

/**
 * Spring Data JPA Repository for the User entity.
 * Manages the data lookup required by the authentication filter using raw usernames.
 */
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsername(String username);

}
