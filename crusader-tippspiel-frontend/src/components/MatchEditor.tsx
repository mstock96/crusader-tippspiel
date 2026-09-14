import React, {useCallback, useEffect, useState} from "react";
import type {GroupStandingDto, Tournament} from "../types/types.ts";
import MatchRow from "./MatchRow.tsx";
import GroupTable from './GroupTable';
import {fetchWithAuth} from "../api/api.ts";
import {
    areAllGroupsFinished,
    checkIfLastRound,
    findGameInClone,
    getActiveGames,
    isCurrentKoRoundFinished,
    isPhaseLocked
} from "../utils/tournamenthelpers.ts";
import {Box, Button, Divider, Stack, Tabs, Text, Title} from '@mantine/core';
import {notifications} from '@mantine/notifications';

/**
 * Props for the MatchEditor component.
 * @param tournamentId The unique identifier of the tournament being edited.
 * @param activeTabId The ID of the currently active tab (e.g., 'GROUP_1_A' or 'KO_2'), or null if none is selected.
 * @param onTabChange Triggered when the user switches to a different tab.
 * @param onMatchUpdated Triggered after a match score has been successfully updated and saved.
 */
interface MatchEditorProps {
    tournamentId: number;
    activeTabId: string | null;
    onTabChange: (tabId: string) => void;
    onMatchUpdated: () => void;
}

/**
 * Component for viewing and editing matches of a specific tournament.
 * Handles the display of group and knockout stages, tracks live standings,
 * manages score updates, and controls the overall tournament progression
 * (such as generating knockout rounds or finishing the tournament).
 */
export default function MatchEditor({tournamentId, activeTabId, onTabChange, onMatchUpdated}: MatchEditorProps) {

    const [tournament, setTournament] = useState<Tournament | null>(null)
    const [lastRound, setLastRound] = useState<boolean>(false);
    const [liveTable, setLiveTable] = useState<GroupStandingDto[]>([]);

    /**
     * Fetches the tournament data and automatically sets the initial active tab.
     * Prioritizes the latest knockout round if available, otherwise falls back to the first group.
     * Reloads if the chosen tournament changes
     */
    useEffect(() => {
        fetchWithAuth(`/tournaments/${tournamentId}`)
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
     * Fetches the current standings for a specific group from the backend
     * and updates the local live table state.
     * @param groupId The ID of the group to fetch standings for.
     */
    const fetchLiveTable = useCallback((groupId: number) => {
        fetchWithAuth(`/groups/${groupId}/table`)
            .then(res => res.json())
            .then(data => setLiveTable(data))
            .catch(err => console.error("Keine Antwort vom Backend:", err));
    }, []);

    /**
     * Fetches the live standings table whenever a group tab is selected.
     * Extracts the group ID from the current active tab string.
     */
    useEffect(() => {
        if (activeTabId && activeTabId.startsWith('GROUP_')) {
            const groupIdStr = activeTabId.replace('GROUP_', '').split('_')[0];
            const groupId = parseInt(groupIdStr);
            fetchLiveTable(groupId);
        }
    }, [activeTabId, fetchLiveTable]);

    const activeGames = getActiveGames(tournament, activeTabId);

    /**
     * Updates the local state with the new score (kills) for a specific team in a match.
     * These changes are only local and will not be persisted until handleSaveMatch is called.
     * @param gameId The ID of the game being updated.
     * @param team1or2 Boolean flag indicating the team (false for Team 1, true for Team 2).
     * @param kills The updated amount of kills/points.
     */
    const handleScoreChange = (gameId: number, team1or2: boolean, kills: number) => {
        if (!tournament || !activeTabId) return;
        if (kills < 0) return;

        const newTournament = structuredClone(tournament);
        const game = findGameInClone(newTournament, activeTabId, gameId);

        if (!game) return;
        if (team1or2) {
            game.team2Kills = kills;
        } else {
            game.team1Kills = kills;
        }
        setTournament(newTournament);
    }

    /**
     * Persists the match results to the backend and marks the game as played.
     * Automatically triggers a refresh of the live group standings if a group match was saved.
     * @param gameId The ID of the game to be saved.
     */
    const handleSaveMatch = (gameId: number) => {
        if (!tournament || !activeTabId) {
            notifications.show({message: "Fehler beim Speichern des Spiels mit der Id:" + gameId, color: "red"});
            return;
        }

        const newTournament = structuredClone(tournament);
        const game = findGameInClone(newTournament, activeTabId, gameId);

        if (!game) {
            notifications.show({message: "Fehler beim Speichern des Spiels mit der Id:" + gameId, color: "red"});
            return;
        }
        game.played = true;

        setTournament(newTournament);

        fetchWithAuth(`/games/${gameId}/result`, {
            method: 'PATCH',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                team1Kills: game.team1Kills,
                team2Kills: game.team2Kills
            })
        })
            .then(res => {
                if (!res.ok) {
                    notifications.show({message: "Fehler vom Server beim Speichern!", color: "red"});
                    setTournament(tournament);
                }
                if (activeTabId?.startsWith('GROUP_')) {
                    const groupIdStr = activeTabId.replace('GROUP_', '').split('_')[0];
                    const groupId = parseInt(groupIdStr);
                    fetchLiveTable(groupId);
                }
                onMatchUpdated();
            })
            .catch(err => {
                console.error("Keine Antwort vom Backend:", err);
                setTournament(tournament);
            });
    }

    /**
     * Unlocks a previously completed match, allowing its scores to be edited again.
     * Only changes the local 'played' status; needs to be saved to propagate to the backend.
     * @param gameId The ID of the game to unlock.
     */
    const handleEditMatch = (gameId: number) => {
        if (!tournament || !activeTabId) return;

        const newTournament = structuredClone(tournament);
        const game = findGameInClone(newTournament, activeTabId, gameId);

        if (!game) return;
        game.played = false;
        setTournament(newTournament);
    }

    /**
     * Finalizes the group stage and triggers the backend to generate the initial knockout rounds.
     * Automatically transitions the user to the newly created knockout phase tab.
     */
    const handleGenerateKoRounds = () => {
        if (!tournament) return;

        fetchWithAuth(`/tournaments/${tournament.id}/knockout-rounds`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'}
        })
            .then(res => {
                if (!res.ok) throw new Error("Backend meldet einen Fehler bei der KO-Generierung.");
                return fetchWithAuth(`/tournaments/${tournament.id}`);
            })
            .then(res => res.json())
            .then(updatedTournament => {
                setTournament(updatedTournament);

                if (updatedTournament.knockoutRounds && updatedTournament.knockoutRounds.length > 0) {
                    onTabChange(`KO_${updatedTournament.knockoutRounds[0].id}`);
                    setLastRound(checkIfLastRound(updatedTournament));
                }
            })
            .catch(err => {
                console.error("Keine Antwort vom Backend:", err);
                notifications.show({message: "Fehler beim Generieren der KO-Runde.", color: "red"});
            });
    };

    /**
     * Instructs the backend to evaluate the completed knockout round results
     * and generate the matchups for the subsequent round.
     */
    const handleGenerateNextKoRound = () => {
        if (!tournament) return;

        fetchWithAuth(`/tournaments/${tournament.id}/knockout-rounds/next`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'}
        })
            .then(res => {
                if (!res.ok) throw new Error("Backend meldet einen Fehler bei der KO-Generierung.");
                return fetchWithAuth(`/tournaments/${tournament.id}`);
            })
            .then(res => res.json())
            .then(updatedTournament => {
                setTournament(updatedTournament);

                if (updatedTournament.knockoutRounds && updatedTournament.knockoutRounds.length > 0) {
                    const latestRound = updatedTournament.knockoutRounds[updatedTournament.knockoutRounds.length - 1];
                    onTabChange(`KO_${latestRound.id}`);
                    setLastRound(checkIfLastRound(updatedTournament));
                }
            })
            .catch(err => {
                console.error("Keine Antwort vom Backend:", err);
                notifications.show({message: "Fehler beim Generieren der nächsten K.o.-Runde.", color: "red"});
            });
    }

    /**
     * Finalizes the entire tournament after the finals are played
     * and notifies the backend to mark the tournament status as finished.
     */
    const endTournament = () => {
        if (!tournament) return;

        fetchWithAuth(`/tournaments/${tournament.id}/finish`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'}
        })
            .then(res => {
                if (!res.ok) throw new Error("Backend meldet einen Fehler beim Beenden des Turniers.");
                return fetchWithAuth(`/tournaments/${tournament.id}`);
            })
            .then(res => res.json())
            .then(updatedTournament => {
                setTournament(updatedTournament);
                notifications.show({message: "Turnier erfolgreich beendet.", color: "green"});
            })
            .catch(err => {
                console.error("Keine Antwort vom Backend:", err);
                notifications.show({message: "Fehler beim Beenden des Turniers.", color: "red"});
            });
    }

    /** Extracts the currently active knockout round object based on the selected tab ID. */
    const currentKoRound = activeTabId?.startsWith('KO_')
        ? tournament?.knockoutRounds?.find(kr => kr.id === parseInt(activeTabId.replace('KO_', '')))
        : null;

    /** Determines if the active knockout round contains the finals and the 3rd place decider. */
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
                    /** If the final round contains a runners-up game, the view has to be split. */
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
                                readOnly={false}
                                onScoreChange={handleScoreChange}
                                onSave={handleSaveMatch}
                                onEdit={handleEditMatch}
                            />
                        </React.Fragment>
                    );
                })}
            </Stack>

            <Box mt="xl" mb="xl" ta="center">
                {/** The group stage needs to be complete (all games played) to start the knockout stage. If a knockout stage already exists, the button will also be disabled. */}
                {activeTabId && activeTabId.startsWith('GROUP_') && areAllGroupsFinished(tournament) && tournament && (!tournament.knockoutRounds || tournament.knockoutRounds.length === 0) && (
                    <Button
                        onClick={() => handleGenerateKoRounds()}
                        color="green"
                        size="lg"
                        fullWidth
                    >
                        Gruppenphase abschließen & KO-Runden generieren
                    </Button>
                )}
                {/** The previous knockout stage needs to be complete (all games played) to start the next knockout round. If the last round is the final round, there also won't be a next round. */}
                {activeTabId && activeTabId.startsWith('KO_') && isCurrentKoRoundFinished(tournament, parseInt(activeTabId.replace('KO_', ''))) && !lastRound && (
                    <Button
                        onClick={() => handleGenerateNextKoRound()}
                        color="yellow"
                        size="lg"
                        fullWidth
                    >
                        Nächste KO-Runde generieren
                    </Button>
                )}
                {/** The previous knockout stage needs to be complete (all games played) and it needs to be the last round to end the tournament. */}
                {activeTabId && activeTabId.startsWith('KO_') && isCurrentKoRoundFinished(tournament, parseInt(activeTabId.replace('KO_', ''))) && lastRound && (
                    <Button
                        onClick={() => endTournament()}
                        color="grape"
                        size="lg"
                        fullWidth
                    >
                        Spiele speichern und Turnier beenden
                    </Button>
                )}
            </Box>

            {/** Showing the corresponding group live table for an open group tab. */}
            {activeTabId && activeTabId.startsWith('GROUP_') && (
                <Box mt="xl">
                    <GroupTable standings={liveTable}/>
                </Box>
            )}
        </Box>
    );
}