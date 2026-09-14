package crusadertippspielbackend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Entity representing a scheduled match between two teams.
 * Contains information about the score line, the type of the round, and linkages to the tournament phases.
 */
@Entity
@Getter
@Setter
@NoArgsConstructor
public class Game {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(nullable = false)
    private Team team1;
    @ManyToOne(optional = false)
    @JoinColumn(nullable = false)
    private Team team2;
    private int team1Kills = 0;
    private int team2Kills = 0;
    private boolean played = false;
    private boolean knockout = false;

    @ManyToOne
    @JsonIgnore
    private Group group;

    @ManyToOne
    @JoinColumn(name = "knockoutRound_id")
    @JsonIgnore
    private KnockoutRound knockoutRound;

    @PrePersist
    @PreUpdate
    @JsonIgnore
    private void validateGameType() {
        boolean hasGroup = (group != null);
        boolean hasKnockout = (knockoutRound != null);

        if (hasGroup && hasKnockout) {
            throw new IllegalStateException("Ein Spiel darf nicht gleichzeitig in einer Gruppe und einer K.o.-Runde sein.");
        }
        if (!hasGroup && !hasKnockout) {
            throw new IllegalStateException("Ein Spiel muss entweder einer Gruppe oder einer K.o.-Runde zugeordnet sein.");
        }
    }

    @Transient
    @JsonIgnore
    public Tournament getTournament() {
        if (this.group != null) {
            return this.group.getTournament();
        }
        if (this.knockoutRound != null) {
            return this.knockoutRound.getTournament();
        }
        throw new IllegalStateException("Spiel ist weder einer Gruppe noch einer K.o.-Runde zugewiesen!");
    }

    @Transient
    @JsonIgnore
    public Team getWinner() {
        return team1Kills > team2Kills ? team1 : team2;
    }

    @Transient
    @JsonIgnore
    public Team getLoser() {
        return team1Kills > team2Kills ? team2 : team1;
    }
}
