import {useEffect, useState} from "react";
import type {LeaderboardRowDto} from "../types/types.ts";
import LeaderboardTable from "./LeaderboardTable.tsx";
import UserPrediction from "./UserPrediction.tsx";
import {Box, Button, Divider, Group, Paper, Title} from '@mantine/core';

/**
 * Props for the PredictionSidebar component.
 * @param tournamentId The identifier for the tournament this sidebar provides tracking context for.
 * @param activeTabId Contextual parameter passing down what group or knockout phase the user currently is inspecting.
 * @param refreshKey Counter used to force dependency updates whenever top-level match information is committed.
 */
interface PredictionSidebarProps {
    tournamentId: number;
    activeTabId: string | null;
    refreshKey: number;
}

/**
 * High-level organizational component mounted on the right rail during Tournament viewing.
 * Allows visitors to toggle between analyzing the overarching prediction leaderboard and
 * evaluating granular contextual tips belonging to a single specific competitor.
 */
export default function PredictionSidebar({tournamentId, activeTabId, refreshKey}: PredictionSidebarProps) {

    const [leaderBoard, setLeaderBoard] = useState<LeaderboardRowDto[]>([]);
    const [selectedUser, setSelectedUser] = useState<string>("Tipps");

    /**
     * Resolves the current structured leaderboard whenever global matches commit or tournament scope alters.
     */
    useEffect(() => {
        const BASE_URL = import.meta.env.VITE_API_BASE_URL;
        fetch(`${BASE_URL}/predictions/${tournamentId}/leaderboard`)
            .then(res => res.json())
            .then(data => setLeaderBoard(data))
            .catch(err => console.error("Keine Antwort vom Backend:", err));
    }, [tournamentId, refreshKey])

    // Prüfen, ob links gerade eine Gruppe offen ist
    if (!activeTabId) return null;
    const isGroupTabActive = activeTabId.startsWith('GROUP_');

    let activeGroupId = null;
    let activeGroupName = null;

    if (isGroupTabActive) {
        const payload = activeTabId.replace('GROUP_', '');
        const splitIndex = payload.indexOf('_');
        if (splitIndex !== -1) {
            activeGroupId = payload.substring(0, splitIndex);
            activeGroupName = payload.substring(splitIndex + 1);
        } else {
            activeGroupId = payload;
        }
    }

    return (
        <Paper withBorder shadow="sm" p="xl" radius="md">
            <Title order={3} ta="center" mb="xl">
                Tipps & Ranking
            </Title>

            <Group gap="xs" justify="center" mb="xl">
                <Button
                    variant={selectedUser === "Tipps" ? "filled" : "default"}
                    onClick={() => setSelectedUser("Tipps")}
                >
                    Leaderboard
                </Button>

                {leaderBoard.length > 0 && (
                    <Divider orientation="vertical"/>
                )}

                {leaderBoard.map(entry => (
                    <Button
                        key={entry.userName}
                        variant={selectedUser === entry.userName ? "filled" : "default"}
                        onClick={() => setSelectedUser(entry.userName)}
                    >
                        {entry.userName}
                    </Button>
                ))}
            </Group>

            <Box p="lg" bg="gray.0" style={{
                border: '1px solid var(--mantine-color-gray-2)',
                borderRadius: 'var(--mantine-radius-md)',
                minHeight: '300px'
            }}>
                {selectedUser === "Tipps" && (
                    <LeaderboardTable leaderBoardRows={leaderBoard}/>
                )}
                {selectedUser !== "Tipps" && (
                    <UserPrediction
                        tournamentId={tournamentId}
                        userName={selectedUser}
                        activeGroupId={activeGroupId}
                        activeGroupName={activeGroupName}
                        refreshKey={refreshKey}
                    />
                )}
            </Box>
        </Paper>
    );
};