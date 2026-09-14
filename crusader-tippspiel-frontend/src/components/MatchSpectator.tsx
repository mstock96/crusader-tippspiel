import React, {useCallback, useEffect, useState} from "react";
import type {GroupStandingDto, Tournament} from "../types/types.ts";
import MatchRow from "./MatchRow.tsx";
import GroupTable from './GroupTable';
import {getActiveGames, isPhaseLocked} from "../utils/tournamenthelpers.ts";
import {Box, Divider, Stack, Tabs, Text, Title} from '@mantine/core';

/**
 * Props for the MatchSpectator component.
 * @param tournamentId The unique identifier of the tournament to be spectated.
 * @param activeTabId The ID of the currently active tab (e.g., 'GROUP_1' or 'KO_2'), or null if none is selected.
 * @param onTabChange Callback triggered when the spectator switches to a different tab.
 */
interface MatchSpectatorProps {
    tournamentId: number;
    activeTabId: string | null;
    onTabChange: (tabId: string) => void;
}

/**
 * Read-only component for spectating matches and results of a tournament.
 * Similar to MatchEditor, but lacks editing capabilities and is designed for unauthenticated or read-only users.
 */
export default function MatchSpectator({tournamentId, activeTabId, onTabChange}: MatchSpectatorProps) {

    const [tournament, setTournament] = useState<Tournament | null>(null)
    const [liveTable, setLiveTable] = useState<GroupStandingDto[]>([]);

    /**
     * Fetches the tournament data and automatically sets the initial active tab.
     * Prioritizes the latest knockout round if available, otherwise falls back to the first group.
     * Uses an unauthenticated public API endpoint.
     */
    useEffect(() => {
        const BASE_URL = import.meta.env.VITE_API_BASE_URL;
        fetch(`${BASE_URL}/tournaments/${tournamentId}`)
            .then(res => res.json())
            .then(data => {
                setTournament(data);
                if (data.knockoutRounds && data.knockoutRounds.length > 0) {
                    const latestKoRound = data.knockoutRounds[data.knockoutRounds.length - 1];
                    onTabChange(`KO_${latestKoRound.id}`);
                } else if (data.groups && data.groups.length > 0) {
                    onTabChange(`GROUP_${data.groups[0].id}_${data.groups[0].name}`);
                }
            })
            .catch(err => console.error("Keine Antwort vom Backend:", err));
    }, [tournamentId, onTabChange]);

    /**
     * Fetches the current standings for a specific group from the unauthenticated backend API
     * and updates the local live table state.
     * @param groupId The ID of the group to fetch standings for.
     */
    const fetchLiveTable = useCallback((groupId: number) => {
        const BASE_URL = import.meta.env.VITE_API_BASE_URL;
        fetch(`${BASE_URL}/groups/${groupId}/table`)
            .then(res => res.json())
            .then(data => setLiveTable(data))
            .catch(err => console.error("Keine Antwort vom Backend:", err));
    }, []);

    /**
     * Triggers a fetch of the live standings table whenever a group tab is selected.
     * Extracts the group ID from the currently active tab string.
     */
    useEffect(() => {
        if (activeTabId && activeTabId.startsWith('GROUP_')) {
            const groupIdStr = activeTabId.replace('GROUP_', '').split('_')[0];
            const groupId = parseInt(groupIdStr);
            fetchLiveTable(groupId);
        }
    }, [activeTabId, fetchLiveTable]);

    /** Filters the games of the current tournament based on the selected tab (group or knockout round). */
    const activeGames = getActiveGames(tournament, activeTabId);

    /** Extracts the specific knockout round object based on the currently selected tab ID. */
    const currentKoRound = activeTabId?.startsWith('KO_')
        ? tournament?.knockoutRounds?.find(kr => kr.id === parseInt(activeTabId.replace('KO_', '')))
        : null;

    /** Determines if the currently displayed knockout round is the final round (including the 3rd place decider). */
    const isFinalRound = currentKoRound?.name === "Finale / Spiel um Platz 3";

    return (
        <Box maw={800} mx="auto" px="sm">
            <Title order={2} ta="center" mb="xl">Partien & Ergebnisse</Title>

            <Tabs
                value={activeTabId}
                onChange={(val) => val && onTabChange(val)}
                mb="xl"
                variant="pills"
            >
                <Tabs.List justify="center">
                    {tournament?.groups?.map(group => {
                        const tabId = `GROUP_${group.id}_${group.name}`;
                        return (
                            <Tabs.Tab
                                key={tabId}
                                value={tabId}
                                style={{
                                    border: activeTabId === tabId ? '1px solid transparent' : '1px solid var(--mantine-color-gray-3)',
                                    fontWeight: 'bold'
                                }}
                            >
                                {group.name || `Gruppe ${group.id}`}
                            </Tabs.Tab>
                        );
                    })}

                    {tournament?.knockoutRounds?.map(koRound => {
                        const tabId = `KO_${koRound.id}`;
                        return (
                            <Tabs.Tab
                                key={tabId}
                                value={tabId}
                                color="red"
                                style={{
                                    border: activeTabId === tabId ? '1px solid transparent' : '1px solid var(--mantine-color-gray-3)',
                                    fontWeight: 'bold'
                                }}
                            >
                                {koRound.name || `KO-Runde ${koRound.id}`}
                            </Tabs.Tab>
                        );
                    })}
                </Tabs.List>
            </Tabs>

            <Stack gap="md" pb="sm">
                {activeGames.map((game, index) => {
                    const isSpielUmPlatz3 = activeTabId?.startsWith('KO_') && activeGames.length === 2 && index === 1 && isFinalRound;

                    return (
                        <React.Fragment key={game.id}>
                            {isSpielUmPlatz3 && (
                                <Box mt="xl" mb="sm" ta="center">
                                    <Divider my="sm" variant="dashed"/>
                                    <Title order={3} c="dimmed" mt="md">Spiel um Platz 3</Title>
                                    <Text size="sm" c="dimmed" mt={4}>
                                        Die Verlierer der Halbfinals spielen hier um den dritten Platz.
                                    </Text>
                                </Box>
                            )}

                            <MatchRow
                                game={game}
                                maxKills={tournament?.aiPerTeam ?? 10}
                                isLocked={isPhaseLocked(tournament, activeTabId)}
                                readOnly={true}
                            />
                        </React.Fragment>
                    );
                })}
            </Stack>

            {/** Showing the corresponding group live table for an open group tab. */}
            {activeTabId && activeTabId.startsWith('GROUP_') && (
                <Box mt="xl">
                    <GroupTable standings={liveTable}/>
                </Box>
            )}
        </Box>
    );
}