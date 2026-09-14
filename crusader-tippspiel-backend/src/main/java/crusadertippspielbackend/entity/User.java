package crusadertippspielbackend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

/**
 * Entity tracking application login accounts and their authorization roles.
 * Implements Spring Security's UserDetails for direct integration into the authentication workflow.
 */
@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
public class User implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(nullable = false)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    @Override
    @JsonIgnore
    public Collection<? extends GrantedAuthority> getAuthorities() {
        // Spring Security erwartet eine Liste von "GrantedAuthorities" (Berechtigungen).
        // Wir wandeln unser Role-Enum einfach in so eine Authority um.
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    @Override
    @JsonIgnore
    public boolean isAccountNonExpired() {
        return true; // Der Account läuft niemals ab
    }

    @Override
    @JsonIgnore
    public boolean isAccountNonLocked() {
        return true; // Der Account wird nicht gesperrt
    }

    @Override
    @JsonIgnore
    public boolean isCredentialsNonExpired() {
        return true; // Das Passwort läuft nicht ab
    }

    @Override
    @JsonIgnore
    public boolean isEnabled() {
        return true; // Der Account ist sofort aktiv
    }

}
