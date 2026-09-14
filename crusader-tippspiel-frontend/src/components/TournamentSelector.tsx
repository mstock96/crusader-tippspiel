import {useEffect, useState} from 'react';
import type {TournamentInfoDto} from "../types/types.ts";
import {Badge, Box, Button, Group, Paper, Stack, Title} from '@mantine/core';

/**
 * Props for the TournamentSelector component.
 * @param onSelect Callback invoked when a user clicks on a particular listed tournament.
 * @param isVisitor Flag designating whether the user only possesses unauthenticated read permissions.
 */
interface SelectorProps {
    onSelect: (tournament: TournamentInfoDto) => void;
    isVisitor: boolean;
}

/**
 * Index component mapping all retrieved tournaments (past, present, and scheduled) offering a
 * selection interface to initiate deep routing into a singular TournamentDashboard context.
 */
export default function TournamentSelector({onSelect, isVisitor}: SelectorProps) {

    const [tournaments, setTournaments] = useState<TournamentInfoDto[]>([])

    /** Gathers the global manifest of tournaments across the platform context on mounting point */
    useEffect(() => {
        const BASE_URL = import.meta.env.VITE_API_BASE_URL;
        fetch(`${BASE_URL}/tournaments/infos`)
            .then(res => res.json())
            .then(data => setTournaments(data))
            .catch(err => console.error("Keine Antwort vom Backend:", err));
    }, []);

    /** Maps the local button click to the parent navigation prop. */
    const handleSelectTournament = (tournament: TournamentInfoDto) => {
        onSelect(tournament);
    }

    return (
        <Box maw={800} mx="auto" mt={40} p="md">
            <Title order={1} ta="center" mb="xl">
                Turnier auswählen
            </Title>

            <Stack gap="md">
                {tournaments.filter(tournament => !isVisitor || tournament.started).map((tournament) => (
                    <Paper
                        key={tournament.id}
                        withBorder
                        shadow="sm"
                        p="lg"
                        radius="md"
                    >
                        <Group justify="space-between" align="center" wrap="nowrap">
                            <Box style={{textAlign: 'left'}}>
                                <Title order={3} mb="xs">
                                    {tournament.name}
                                </Title>
                                {tournament.started ? (
                                    tournament.finished ? (
                                        <Badge color="grape" variant="light">Beendet</Badge>
                                    ) : (
                                        <Badge color="red" variant="light">Gestartet</Badge>
                                    )
                                ) : (
                                    <Badge color="green" variant="light">In Planung</Badge>
                                )}
                            </Box>

                            <Button onClick={() => handleSelectTournament(tournament)}>
                                Auswählen
                            </Button>
                        </Group>
                    </Paper>
                ))}
            </Stack>
        </Box>
    );
}