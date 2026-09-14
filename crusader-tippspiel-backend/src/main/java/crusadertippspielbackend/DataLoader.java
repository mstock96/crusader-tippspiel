package crusadertippspielbackend;

import crusadertippspielbackend.entity.Member;
import crusadertippspielbackend.entity.Role;
import crusadertippspielbackend.entity.User;
import crusadertippspielbackend.repository.MemberRepository;
import crusadertippspielbackend.repository.TournamentRepository;
import crusadertippspielbackend.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Data initializer component acting as a bootstrapper.
 * Automatically inserts initial administration accounts and test fixtures during startup if the database is empty.
 */
@Component
@Profile("dev")
public class DataLoader implements CommandLineRunner {

    private final TournamentRepository tournamentRepository;
    private final MemberRepository memberRepository;
    private final UserRepository userRepository;

    private final PasswordEncoder passwordEncoder;

    public DataLoader(TournamentRepository tournamentRepository,
                      MemberRepository memberRepository,
                      UserRepository userRepository,
                      PasswordEncoder passwordEncoder) {
        this.tournamentRepository = tournamentRepository;
        this.memberRepository = memberRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) throws Exception {

        System.out.println("=== DATENLOADER START ===");

        if (userRepository.findByUsername("admin").isEmpty()) {
            User adminUser = new User();
            adminUser.setUsername("admin");
            adminUser.setPassword(passwordEncoder.encode("admin123"));
            adminUser.setRole(Role.ADMIN);

            userRepository.save(adminUser);
            System.out.println("=> Initialer Admin-User ('admin' / 'admin123') wurde angelegt!");
        }
        if (userRepository.findByUsername("user").isEmpty()) {
            User adminUser = new User();
            adminUser.setUsername("user");
            adminUser.setPassword(passwordEncoder.encode("user123"));
            adminUser.setRole(Role.USER);

            userRepository.save(adminUser);
            System.out.println("=> Initialer User ('user' / 'user123') wurde angelegt!");
        }

        if (tournamentRepository.count() == 0) {
            Member ratte = new Member();
            ratte.setName("Ratte");
            memberRepository.save(ratte);

            Member wolf = new Member();
            wolf.setName("Wolf");
            memberRepository.save(wolf);

            Member sultan = new Member();
            sultan.setName("Sultan");
            memberRepository.save(sultan);

            Member loewin = new Member();
            loewin.setName("Löwin");
            memberRepository.save(loewin);

            System.out.println("=> Test-Turnier und Members wurden erfolgreich gespeichert!");
        } else {
            System.out.println("=> Datenbank ist nicht leer, überspringe das Anlegen von Turnieren.");
        }

        System.out.println("Aktuelle Turniere in der Datenbank: " + tournamentRepository.count());
        System.out.println("Aktuelle Members in der Datenbank: " + memberRepository.count());
        System.out.println("Aktuelle User in der Datenbank: " + userRepository.count());

        System.out.println("=== DATENLOADER ENDE ===");
    }
}
