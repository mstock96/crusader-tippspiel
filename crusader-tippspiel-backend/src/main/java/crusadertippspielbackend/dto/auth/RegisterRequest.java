package crusadertippspielbackend.dto.auth;

import lombok.Data;

/**
 * Data Transfer Object for conveying user registration information.
 * It also encapsulates the authentication response which wraps the JWT token.
 */
@Data
public class RegisterRequest {
    private String username;
    private String password;

    @Data
    public static class AuthResponse {
        private String token;

        public AuthResponse(String token) {
            this.token = token;
        }
    }
}
