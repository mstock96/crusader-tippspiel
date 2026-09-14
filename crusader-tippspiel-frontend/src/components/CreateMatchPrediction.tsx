import React, {useCallback, useEffect, useState} from "react";
import type {Group, GroupStandingDto, GroupTip, Prediction, Team, Tournament} from "../types/types.ts";
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
 * Props for the CreateMatchPrediction component.
 * @param tournamentId The unique identifier of the tournament being predicted.
 * @param activeTabId The ID of the currently active tab (e.g., 'GROUP_1' or 'KO_2'), or null if none is selected.
 * @param onTabChange Triggered when the user switches to a different tab.
 * @param userId The unique identifier of the user creating the prediction.
 * @param onSuccess Callback triggered when the prediction has been successfully saved.
 */
interface MatchEditorProps {
    tournamentId: number;
    activeTabId: string | null;
    onTabChange: (tabId: string) => void;
    userId: number
    onSuccess: () => void;
}

/**
 * Component for simulating tournament results to create a prediction.
 * Allows the user to predict group matches, simulate knockout phases,
 * and finalize a full tournament prediction which is then saved for the user.
 */
export default function CreateMatchPrediction({
                                                  tournamentId,
                                                  activeTabId,
                                                  onTabChange,
                                                  userId,
                                                  onSuccess
                                              }: MatchEditorProps) {

    const [tournament, setTournament] = useState<Tournament | null>(null)
    const [lastRound, setLastRound] = useState<boolean>(false);
    const [liveTable, setLiveTable] = useState<GroupStandingDto[]>([]);
    const [groupTablesCache, setGroupTablesCache] = useState<Record<number, GroupStandingDto[]>>({});

    /**
     * Initializes the tournament simulation data and sets the active tab.
     * Prioritizes the latest knockout round if present, otherwise defaults to the first group.
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
     * Fetches the simulated standings for a specific group based on the ongoing predictions.
     * Updates both the currently displayed live table and a cache for the final prediction calculation.
     * @param group The group object to fetch standings for.
     */
    const fetchLiveTable = useCallback((group: Group) => {
        fetchWithAuth(`/groups/table`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(group)
        })
            .then(res => {
                if (!res.ok) {
                    throw new Error(`Fehler bei der Livetabelle mit Status: ${res.status}`);
                }
                return res.json();
            })
            .then(data => {
                setLiveTable(data);
                setGroupTablesCache(prevCache => ({
                    ...prevCache,
                    [group.id]: data
                }));
            })
            .catch(err => console.error("Keine Antwort vom Backend:", err));
    }, []);

    /**
     * Retrieves the live standings whenever a user switches to a group tab.
     */
    useEffect(() => {
        if (activeTabId && activeTabId.startsWith('GROUP_') && tournament) {
            const groupIdStr = activeTabId.replace('GROUP_', '').split('_')[0];
            const groupId = parseInt(groupIdStr);
            const group = tournament.groups?.find(group => group.id === groupId);
            if (group) fetchLiveTable(group);
        }
    }, [activeTabId, fetchLiveTable, tournament]);

    const activeGames = getActiveGames(tournament, activeTabId);

    /**
     * Updates the predicted score (kills) of a specific team locally.
     * @param gameId The ID of the game being predicted.
     * @param team1or2 Boolean indicating the team (false = Team 1, true = Team 2).
     * @param kills The predicted score.
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
     * Submits the predicted score for a match to the backend for simulation.
     * Receives updated simulation state and refreshes the live table based on the new results.
     * @param gameId The ID of the simulated game to be saved.
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

        setTournament(newTournament);
        fetchWithAuth(`/games/simulate`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                game: game,
                gameResultDto: {
                    team1Kills: game.team1Kills,
                    team2Kills: game.team2Kills
                }
            })

        })
            .then(res => {
                if (!res.ok) {
                    throw new Error("Fehler vom Server beim Speichern!");
                }
                return res.json();
            })
            .then(updatedGameFromServer => {
                const nextTournament = structuredClone(tournament);
                const gameToUpdate = findGameInClone(nextTournament, activeTabId, gameId);

                if (gameToUpdate) {
                    Object.assign(gameToUpdate, updatedGameFromServer)
                }

                setTournament(nextTournament);

                if (activeTabId?.startsWith('GROUP_')) {
                    const groupIdStr = activeTabId.replace('GROUP_', '').split('_')[0];
                    const groupId = parseInt(groupIdStr);
                    const group = nextTournament.groups?.find(g => g.id === groupId);

                    if (group) {
                        fetchLiveTable(group);
                    }
                }

            })
            .catch(err => {
                console.error(err.message);
                notifications.show({
                    message: "Speichern fehlgeschlagen. Änderungen werden zurückgesetzt.",
                    color: "red"
                });
                setTournament(tournament);
            });
    }

    /**
     * Unlocks a previously saved match simulation, allowing the user to change their prediction.
     * @param gameId The ID of the game to edit.
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
     * Finalizes the group stage predictions and queries the backend to generate the first knockout round simulations.
     * Transitions the user to the newly simulated knockout phase tab.
     */
    const handleGenerateKoRounds = () => {
        if (!tournament) return;

        fetchWithAuth(`/tournaments/simulate/knockout-rounds`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(tournament)
        })
            .then(res => {
                if (!res.ok) throw new Error("Backend meldet einen Fehler bei der KO-Generierung.");
                return res.json();
            })
            .then(firstKoRound => {
                const nextTournament = structuredClone(tournament);
                nextTournament.knockoutRounds?.push(firstKoRound);
                setTournament(nextTournament);

                if (nextTournament.knockoutRounds && nextTournament.knockoutRounds.length > 0) {
                    onTabChange(`KO_${nextTournament.knockoutRounds[0].id}`);
                    setLastRound(checkIfLastRound(nextTournament));
                }
            })
            .catch(err => {
                console.error("Keine Antwort vom Backend:", err);
                notifications.show({message: "Fehler beim Generieren der KO-Runde.", color: "red"});
            });
    };

    /**
     * Validates the current knockout round simulated results and asks the backend
     * to generate the upcoming matchups for the next continuous round.
     */
    const handleGenerateNextKoRound = () => {
        if (!tournament) return;

        fetchWithAuth(`/tournaments/simulate/knockout-rounds/next`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(tournament)
        })
            .then(res => {
                if (!res.ok) throw new Error("Backend meldet einen Fehler bei der KO-Generierung.");
                return res.json();
            })
            .then(nextKoRound => {
                const nextTournament = structuredClone(tournament);
                nextTournament.knockoutRounds?.push(nextKoRound);

                setTournament(nextTournament);

                if (nextTournament.knockoutRounds && nextTournament.knockoutRounds.length > 0) {
                    const latestRound = nextTournament.knockoutRounds[nextTournament.knockoutRounds.length - 1];
                    onTabChange(`KO_${latestRound.id}`);
                    setLastRound(checkIfLastRound(nextTournament));
                }
            })
            .catch(err => {
                console.error("Keine Antwort vom Backend:", err);
                notifications.show({message: "Fehler beim Generieren der nächsten K.o.-Runde.", color: "red"});
            });
    }

    /**
     * Finalizes the full tournament prediction by collecting all standings and final match outcomes.
     * Transforms the simulated progression into a prediction payload and submits it to the backend.
     */
    const endTournament = () => {
        if (!tournament) return;

        fetchWithAuth(`/tournaments/simulate/finish`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(tournament)
        })
            .then(res => {
                if (!res.ok) throw new Error("Backend meldet einen Fehler beim Beenden des Turniers.");
                return res.json();
            })
            .then(updatedTournament => {
                setTournament(updatedTournament);

                const winner: Team = updatedTournament.winner;
                const second: Team = updatedTournament.second;
                const third: Team | null = updatedTournament.third ? updatedTournament.third : null;

                const groupTipsList: GroupTip[] = updatedTournament.groups.flatMap((group: Group) => {
                    const cachedTable = groupTablesCache[group.id] || [];

                    let sortedTeams: Team[];

                    if (cachedTable.length > 0) {
                        sortedTeams = cachedTable.map(standing => standing.team);
                    } else {
                        sortedTeams = group.teams;
                    }
                    return sortedTeams.map((team, index) => ({
                        team: team,
                        predictedPosition: index + 1
                    }));
                });

                const prediction: Omit<Prediction, 'id' | 'groupPoints' | 'podiumPoints' | 'totalPoints'> = {
                    winner: winner,
                    second: second,
                    third: third,
                    groupTips: groupTipsList
                };

                return fetchWithAuth(`/predictions/${tournament.id}/create/${userId}`, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(prediction)
                });
            })
            .then(res => {
                if (res.ok) {
                    notifications.show({
                        message: "Turnier simuliert und Tipps erfolgreich gespeichert!",
                        color: "green"
                    });
                    onSuccess();
                } else {
                    throw new Error("Fehler beim Speichern der Tipps in der Datenbank.");
                }
            })
            .catch(err => {
                console.error("Fehler im Ablauf:", err);
                notifications.show({message: "Ein Fehler ist aufgetreten: " + err.message, color: "red"});
            });
    }

    /** Extracts the specific knockout round object from the active tab. */
    const currentKoRound = activeTabId?.startsWith('KO_')
        ? tournament?.knockoutRounds?.find(kr => kr.id === parseInt(activeTabId.replace('KO_', '')))
        : null;

    /** Checks whether the active component displays the final round/3rd place decider. */
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
                    /** If the final round contains a runners-up game, the view has to be split */
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
                        Turnier beenden und Tipps speichern
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