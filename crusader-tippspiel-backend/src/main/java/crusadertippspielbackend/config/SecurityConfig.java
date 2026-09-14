package crusadertippspielbackend.config;

import crusadertippspielbackend.security.JwtAuthenticationFilter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

/**
 * Filter chain and security policy configuration class.
 * Establishes endpoint routing rules, configures stateless sessions, sets up CORS headers and injects custom JWT filtering.
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Value("${app.frontend.url}")
    private String frontendUrl;

    private final JwtAuthenticationFilter jwtAuthFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthFilter) {
        this.jwtAuthFilter = jwtAuthFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(AbstractHttpConfigurer::disable) //JWT instead of cookies
                .authorizeHttpRequests(auth -> auth
                        // Get-Endpoints which need to be accessible to all visitors
                        //Login
                        .requestMatchers("/api/auth/login").permitAll()
                        //Available Tournaments
                        .requestMatchers(HttpMethod.GET, "/api/tournaments/infos").permitAll()
                        //Specific Tournament
                        .requestMatchers(HttpMethod.GET, "/api/tournaments/{tournamentId}").permitAll()
                        //Current standing in the chosen Group
                        .requestMatchers(HttpMethod.GET, "/api/groups/{groupId}/table").permitAll()
                        //Prediction related infos
                        .requestMatchers(HttpMethod.GET, "/api/predictions/**").permitAll()
                        //disabled because new accounts new to be created by admins to avoid bot problems
                        //needs to be handled differently, if a larger playerbase is realistic
                        //.requestMatchers("/api/auth/**").permitAll()

                        // Everything else and POST, PUT, DELETE etc. needs a valid token
                        .anyRequest().authenticated()
                )
                // Every request must send the token
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                //
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        configuration.setAllowedOrigins(List.of(frontendUrl));

        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));

        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type"));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);

        return source;
    }
}
