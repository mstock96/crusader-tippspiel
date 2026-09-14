package crusadertippspielbackend.dto.auth;

import lombok.Data;

/**
 * Data Transfer Object for carrying user login credentials.
 */
@Data
public class LoginRequest {
    private String username;
    private String password;
}
