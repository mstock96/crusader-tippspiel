package crusadertippspielbackend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Entity recording a user's bet on where a single team will rank in a group.
 * A distinct atomic entity belonging to the wider {@link Prediction} object.
 */
@Entity
@Table(
        name = "group_tips",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"prediction_id", "team_id"})
        }
)
@Getter
@Setter
@NoArgsConstructor
public class GroupTip {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(nullable = false)
    @JsonIgnore
    private Prediction prediction;

    @ManyToOne(optional = false)
    @JoinColumn(nullable = false)
    private Team team;

    @Column(nullable = false)
    @JoinColumn(nullable = false)
    private int predictedPosition;
}
