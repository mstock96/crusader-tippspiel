package crusadertippspielbackend.repository;

import crusadertippspielbackend.entity.GroupTip;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Spring Data JPA Repository for the GroupTip entity.
 * Helps locate prediction tips nested underneath a master prediction ID.
 */
@Repository
public interface GroupTipRepository extends JpaRepository<GroupTip, Long> {

    List<GroupTip> findByPredictionId(Long predictionId);

}
