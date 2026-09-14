import {useEffect, useState} from "react";
import type {PredictionShortFormDto} from "../types/types.ts";
import {Box, Group, Paper, Stack, Table, Text, Title} from '@mantine/core';

/**
 * Props for the UserPrediction component.
 * @param tournamentId Associated tournament context identifier.
 * @param userName The localized string name of the user whose tips are rendering.
 * @param activeGroupId Defines the specific contextual group subset to review predictions for.
 * @param activeGroupName Associated UI presentation name for the currently active group subset.
 * @param refreshKey Counter enforcing a cascade hook re-evaluation whenever new global data commits.
 */
interface UserPredictionProps {
    tournamentId: number;
    userName: string;
    activeGroupId: string | null;
    activeGroupName: string | null;
    refreshKey: number;
}

/**
 * Child component for displaying an individual verified user's contextual tipping layout (Podium guesses
 * and specific group standings permutations). Mounts adjacent to the global rankings on the sidebar.
 */
export default function UserPrediction({
                                           tournamentId,
                                           userName,
                                           activeGroupId,
                                           activeGroupName,
                                           refreshKey
                                       }: UserPredictionProps) {
    const [predictionShort, setPredictionShort] = useState<PredictionShortFormDto>();

    /** Fetches the specific payload representing the queried users subset guesses whenever tab indexing or commits shift. */
    useEffect(() => {
        const BASE_URL = import.meta.env.VITE_API_BASE_URL;
        const url = !activeGroupId ? `${BASE_URL}/predictions/${tournamentId}/prediction/${userName}` : `${BASE_URL}/predictions/${tournamentId}/prediction/${userName}/group/${activeGroupId}`;
        fetch(url)
            .then(res => res.json())
            .then(data => setPredictionShort(data))
            .catch(err => console.error("Keine Antwort vom Backend:", err));
    }, [tournamentId, userName, activeGroupId, refreshKey]);

    if (!predictionShort) return null;

    const displayGroupName = activeGroupName || `Gruppe ${activeGroupId}`;

    return (
        <Stack gap="xl">

            {/* 1. Header & Punkte-Übersicht */}
            <Box>
                <Title order={3} mb="md">
                    Punkte von <Text span c="blue" inherit>{userName}</Text>
                </Title>
                <Group grow gap="xs">
                    <Paper withBorder p="sm" radius="md" ta="center">
                        <Text fz="xs" c="dimmed" tt="uppercase" fw={700}>Gruppe</Text>
                        <Text fz="lg" fw={700}>{predictionShort.groupPoints}</Text>
                    </Paper>
                    <Paper withBorder p="sm" radius="md" ta="center">
                        <Text fz="xs" c="dimmed" tt="uppercase" fw={700}>Podium</Text>
                        <Text fz="lg" fw={700}>{predictionShort.podiumPoints}</Text>
                    </Paper>
                    <Paper withBorder p="sm" radius="md" ta="center" bg="blue.0"
                           style={{borderColor: 'var(--mantine-color-blue-3)'}}>
                        <Text fz="xs" c="blue.8" tt="uppercase" fw={700}>Gesamt</Text>
                        <Text fz="xl" fw={700} c="blue">{predictionShort.totalPoints}</Text>
                    </Paper>
                </Group>
            </Box>

            {/* 2. Podium Tipps */}
            <Paper withBorder p="md" radius="md" shadow="xs">
                <Title order={4} mb="sm" pb="xs" style={{borderBottom: '1px solid var(--mantine-color-gray-2)'}}>
                    Podium Tipps
                </Title>
                <Stack gap="xs" fz="sm">
                    <Text><Text span fw={700}>1. Platz:</Text> {predictionShort.winner}</Text>
                    <Text><Text span fw={700}>2. Platz:</Text> {predictionShort.second}</Text>
                    {predictionShort.third && predictionShort.third.length > 0 && (
                        <Text><Text span fw={700}>3. Platz:</Text> {predictionShort.third}</Text>
                    )}
                </Stack>
            </Paper>

            {/* 3. Gruppen-Tipps Tabelle */}
            {activeGroupName && (
                <Paper withBorder radius="md" shadow="xs" style={{overflow: 'hidden'}}>
                    <Box bg="gray.0" p="md" style={{borderBottom: '1px solid var(--mantine-color-gray-2)'}}>
                        <Title order={4}>{displayGroupName}</Title>
                    </Box>
                    <Table striped highlightOnHover fz="sm">
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th w={60} ta="center">Platz</Table.Th>
                                <Table.Th ta="left">Team</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {predictionShort.groupTips?.map((teamRow) => (
                                <Table.Tr key={teamRow.predictedPosition}>
                                    <Table.Td fw={700} c="dimmed" ta="center">
                                        {teamRow.predictedPosition}.
                                    </Table.Td>
                                    <Table.Td fw={500} ta="left">
                                        {teamRow.teamName}
                                    </Table.Td>
                                </Table.Tr>
                            ))}
                        </Table.Tbody>
                    </Table>
                </Paper>
            )}

        </Stack>
    );
}