package crusadertippspielbackend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

/**
 * Entity mapping a user's collection of predictions targeting a specific tournament.
 * Bundles the overall winner choices along with specific lower-level group picks and stores evaluated scoring details.
 */
@Entity
@Table(
        name = "predictions",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"user_id", "tournament_id"})
        }
)
@Getter
@Setter
@NoArgsConstructor
public class Prediction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private int groupPoints = 0;
    private int podiumPoints = 0;
    private int totalPoints = 0;

    @ManyToOne(optional = false)
    @JoinColumn(nullable = false)
    @JsonIgnore
    private User user;

    @ManyToOne(optional = false)
    @JoinColumn(nullable = false)
    @JsonIgnore
    private Tournament tournament;

    @ManyToOne(optional = false)
    @JoinColumn(nullable = false)
    private Team winner;

    @ManyToOne(optional = false)
    @JoinColumn(nullable = false)
    private Team second;

    @ManyToOne()
    private Team third;

    @OneToMany(mappedBy = "prediction", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<GroupTip> groupTips = new ArrayList<>();
}
