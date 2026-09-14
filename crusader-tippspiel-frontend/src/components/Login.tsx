import React, {useState} from 'react';
import {Alert, Button, Paper, PasswordInput, Stack, TextInput, Title} from '@mantine/core';

/**
 * Component handling authentication workflows and credential processing.
 * @param onLoginSuccess Callback triggered when the user successfully authenticates and receives a JWT token.
 */
export default function Login({onLoginSuccess}: { onLoginSuccess: () => void }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    /**
     * Submits the authentication credentials directly to the unauthenticated login endpoint.
     * Manages browser persistence of the generated JWT token and updates root authentication state hooks.
     * @param e The form submission event.
     */
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault(); // Verhindert, dass die Seite beim Abschicken neu lädt
        setError('');

        try {
            // WICHTIG: Hier nutzen wir das normale fetch, da wir für den Login ja noch kein Token haben!
            const BASE_URL = import.meta.env.VITE_API_BASE_URL;
            const response = await fetch(`${BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({username, password}),
            });

            if (!response.ok) {
                throw new Error('Falscher Benutzername oder Passwort.');
            }

            // Das Backend antwortet mit { "token": "eyJhb..." }
            const data = await response.json();

            // 1. Token sicher im Browser-Speicher ablegen
            localStorage.setItem('jwt_token', data.token);

            // 2. Der Haupt-App Bescheid geben, dass wir drin sind
            onLoginSuccess();

        } catch (err: any) {
            setError(err.message);
        }
    };

    return (
        <Paper withBorder shadow="sm" p="xl" maw={400} mx="auto" mt={50} radius="md">
            <Title order={2} ta="center" mb="md">Login</Title>

            {error && <Alert color="red" mb="md">{error}</Alert>}

            <form onSubmit={handleSubmit}>
                <Stack>
                    <TextInput
                        label="Benutzername:"
                        value={username}
                        onChange={(e) => setUsername(e.currentTarget.value)}
                        required
                    />
                    <PasswordInput
                        label="Passwort:"
                        value={password}
                        onChange={(e) => setPassword(e.currentTarget.value)}
                        required
                    />
                    <Button type="submit" fullWidth color="blue">
                        Einloggen
                    </Button>
                </Stack>
            </form>
        </Paper>
    );
}