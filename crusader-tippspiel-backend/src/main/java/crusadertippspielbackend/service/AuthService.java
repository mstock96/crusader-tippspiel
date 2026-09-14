package crusadertippspielbackend.service;

import crusadertippspielbackend.dto.auth.LoginRequest;
import crusadertippspielbackend.dto.auth.RegisterRequest;
import crusadertippspielbackend.entity.Role;
import crusadertippspielbackend.entity.User;
import crusadertippspielbackend.repository.UserRepository;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

/**
 * Service for handling user authentication logic.
 * Manages user registration and login procedures while issuing JWT tokens.
 */
@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder,
                       JwtService jwtService, AuthenticationManager authenticationManager) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.authenticationManager = authenticationManager;
    }

    public RegisterRequest.AuthResponse register(RegisterRequest request) {
        User user = new User();
        user.setUsername(request.getUsername());

        user.setPassword(passwordEncoder.encode(request.getPassword()));

        user.setRole(Role.USER);

        userRepository.save(user);

        String jwtToken = jwtService.generateToken(user);
        return new RegisterRequest.AuthResponse(jwtToken);
    }

    public RegisterRequest.AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getUsername(),
                        request.getPassword()
                )
        );

        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(); // User must exist or the previous step fails

        String jwtToken = jwtService.generateToken(user);
        return new RegisterRequest.AuthResponse(jwtToken);
    }
}
