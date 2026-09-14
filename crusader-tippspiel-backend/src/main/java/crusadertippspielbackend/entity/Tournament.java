package crusadertippspielbackend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

/**
 * Entity serving as the top-level aggregate root for an entire event.
 * Contains configuration attributes and houses the relational trees for Groups, KnockoutRounds, and final Podium placements.
 */
@Entity
@Getter
@Setter
@NoArgsConstructor
public class Tournament {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false)
    private String name;
    private boolean finished = false;
    private boolean started = false;
    private int numberOfGroups = 4;
    private int teamsPerGroup = 4;
    private int aiPerTeam = 2;
    private int totalKoParticipants = 8;
    @ManyToOne
    private Team winner;

    @ManyToOne
    private Team second;

    @ManyToOne
    private Team third;

    @OneToMany(mappedBy = "tournament", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Group> groups = new ArrayList<>();

    @OneToMany(mappedBy = "tournament", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<KnockoutRound> knockoutRounds = new ArrayList<>();

    @Transient
    @JsonIgnore
    public boolean isGroupStageCompleted() {
        for (Group group : this.groups) {
            for (Game game : group.getGames()) {
                if (!game.isPlayed()) {
                    return false;
                }
            }
        }
        return true;
    }

    @Transient
    @JsonIgnore
    public int getMaxKnockoutRounds() {
        return (int) (Math.log(this.totalKoParticipants) / Math.log(2));
    }

    @Transient
    @JsonIgnore
    public boolean areAllKnockoutRoundsGenerated() {
        return this.knockoutRounds.size() >= getMaxKnockoutRounds();
    }

    @Transient
    @JsonIgnore
    public boolean isKnockoutPhaseFinished() {
        if (!areAllKnockoutRoundsGenerated()) {
            return false;
        }
        KnockoutRound finalRound = this.knockoutRounds.getLast();
        return finalRound.isCompleted();
    }
}
