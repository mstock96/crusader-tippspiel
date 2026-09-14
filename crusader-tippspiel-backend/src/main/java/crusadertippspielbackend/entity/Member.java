package crusadertippspielbackend.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Entity describing a participant, e.g. An AI opponent.
 * Members are aggregated into Teams for a given tournament.
 */
@Entity
@Getter
@Setter
@NoArgsConstructor
public class Member {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Der Name des Members darf nicht leer sein!")
    @Column(unique = true, nullable = false)
    private String name;
}
