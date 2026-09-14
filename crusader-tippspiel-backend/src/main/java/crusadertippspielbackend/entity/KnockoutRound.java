package crusadertippspielbackend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

/**
 * Entity tracking a single stage in the knockout bracket (e.g., Final, Quarter-final).
 * Owns the collection of games belonging to this specific progression phase.
 */
@Entity
@Getter
@Setter
@NoArgsConstructor
public class KnockoutRound {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false)
    private String name;

    @OneToMany(mappedBy = "knockoutRound", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Game> games;

    @ManyToOne(optional = false)
    @JoinColumn(nullable = false)
    @JsonIgnore
    private Tournament tournament;

    @Transient
    @JsonIgnore
    public boolean isCompleted() {
        for (Game game : this.games) {
            if (!game.isPlayed()) {
                return false;
            }
        }
        return true;
    }
}
