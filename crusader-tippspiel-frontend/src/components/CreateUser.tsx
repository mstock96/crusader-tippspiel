import React, {useState} from 'react';
import {fetchWithAuth} from '../api/api.ts';
import {Alert, Box, Button, Stack, Text, TextInput} from '@mantine/core';

/**
 * Component for registering a new user account (participant) in the application.
 * Allows an admin or organizer to create accounts and set initial passwords for other players.
 */
export default function CreateUser() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);

    /**
     * Submits the registration form to create a new user entity.
     * Handles the API request, duplicate username errors, and displays feedback messages.
     * @param e The form submission event.
     */
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setMessage('');
        setIsError(false);

        fetchWithAuth('/auth/register', {
            method: 'POST',
            body: JSON.stringify({username, password}),
        })
            .then(response => {
                if (!response.ok) {
                    setIsError(true);
                    setMessage('Fehler beim Anlegen. Ist der Benutzername evtl. schon vergeben?');
                    return;
                }

                setMessage(`Mitspieler "${username}" wurde erfolgreich angelegt!`);
                setUsername('');
                setPassword('');
            })
            .catch((err: unknown) => {
                setIsError(true);
                if (err instanceof Error) {
                    setMessage(err.message);
                } else {
                    setMessage('Ein unerwarteter Fehler ist beim Erstellen eines Users aufgetreten.');
                }
            });
    };

    const isFormValid = username.trim() !== '' && password.trim() !== '';

    return (
        <Box>
            <Text size="sm" c="dimmed" mb="md">
                Legt einen neuen Account an. Das Start-Passwort kannst du dem Spieler dann einfach mitteilen.
            </Text>

            {message && (
                <Alert color={isError ? 'red' : 'green'} mb="md" fw={700}>
                    {message}
                </Alert>
            )}

            <form onSubmit={handleSubmit}>
                <Stack>
                    <TextInput
                        label="Benutzername:"
                        value={username}
                        onChange={(e) => setUsername(e.currentTarget.value)}
                        required
                        styles={{label: {fontWeight: 'bold'}}}
                    />
                    <TextInput
                        label="Passwort:"
                        value={password}
                        onChange={(e) => setPassword(e.currentTarget.value)}
                        required
                        styles={{label: {fontWeight: 'bold'}}}
                    />
                    <Button
                        type="submit"
                        disabled={!isFormValid}
                        color={isFormValid ? 'blue' : 'gray'}
                        mt="xs"
                    >
                        User speichern
                    </Button>
                </Stack>
            </form>
        </Box>
    );
}