package crusadertippspielbackend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

/**
 * Entity defining a competing side within a tournament consisting of one or more grouped Members.
 * It accumulates long-term statistics (wins, losses) dynamically over the course of the associated tournament Group.
 */
@Entity
@Getter
@Setter
@NoArgsConstructor
public class Team {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private int wins = 0;
    private int losses = 0;
    private int ties = 0;
    private int kills = 0;

    @ManyToMany
    @JoinTable(
            name = "team_members",
            joinColumns = @JoinColumn(name = "team_id"),
            inverseJoinColumns = @JoinColumn(name = "member_id")
    )
    private List<Member> members = new ArrayList<>();

    @ManyToOne(optional = false)
    @JoinColumn(nullable = false)
    @JsonIgnore
    private Group group;
}
