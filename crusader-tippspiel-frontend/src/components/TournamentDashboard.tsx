import {useEffect, useState} from "react";
import MatchEditor from "./MatchEditor";
import MatchSpectator from "./MatchSpectator";
import CreateMatchPrediction from "./CreateMatchPrediction";
import CreatePrediction from "./CreatePrediction";
import PredictionSidebar from "./PredictionSidebar";
import type {TournamentInfoDto} from "../types/types.ts";
import {fetchWithAuth} from "../api/api.ts";
import {Alert, Box, Button, Group, Paper, Stack, Text, Title} from '@mantine/core';

/**
 * Props for the TournamentDashboard component.
 * @param tournament The general Data Transfer Object for the active tournament context.
 * @param userRole Role identifier indicating whether the current visitor is an admin capable of edits.
 * @param userId Unique identifier for the viewing user.
 * @param userMode Controls whether the viewer is actively entering manual predictions or viewing/administering.
 * @param setUserMode State mutation callback to transition layout between viewing and predicting setups.
 */
interface DashboardProps {
    tournament: TournamentInfoDto;
    userRole: string | null;
    userId: number | null;
    userMode: 'VIEW' | 'PREDICT_SIM' | 'PREDICT_MANUAL';
    setUserMode: (mode: 'VIEW' | 'PREDICT_SIM' | 'PREDICT_MANUAL') => void;
}

/**
 * Super-component delegating core tournament operations to appropriate sub-layouts (Editor, Spectator, Predictor).
 * Contains the routing logic handling whether authentications entitle users to submit guesses, 
 * observe games passively, or log authenticated administrative decisions.
 */
export default function TournamentDashboard({tournament, userRole, userId, userMode, setUserMode}: DashboardProps) {
    const [activeTabId, setActiveTabId] = useState<string | null>(null);
    const [hasPredicted, setHasPredicted] = useState<boolean | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);

    /** Resolves initialization status determining if the specific user has already committed predictions. */
    useEffect(() => {
        if (userId && tournament.id) {
            fetchWithAuth(`/predictions/${tournament.id}/has-predicted/${userId}`)
                .then(res => res.json())
                .then(data => setHasPredicted(data))
                .catch(err => console.error("Fehler beim Prüfen des Tipp-Status:", err));
        }
    }, [tournament.id, userId, userRole, refreshKey]);

    /** Cascading trigger alerting parallel components to fetch new state properties when games finalize. */
    const handleMatchUpdated = () => {
        setRefreshKey(prev => prev + 1);
    };

    return (
        <Group align="flex-start" gap="xl" wrap="wrap">

            <Box style={{flex: '1 1 500px', minWidth: 0}}>

                {userMode === 'PREDICT_SIM' && userId && (
                    <Box>
                        <Button
                            variant="default"
                            onClick={() => setUserMode('VIEW')}
                            mb="md"
                        >
                            &larr; Abbrechen / Zurück zur Übersicht
                        </Button>
                        <CreateMatchPrediction tournamentId={tournament.id} activeTabId={activeTabId}
                                               onTabChange={setActiveTabId} userId={userId} onSuccess={() => {
                            setRefreshKey(prev => prev + 1);
                            setUserMode('VIEW');
                        }}/>
                    </Box>
                )}

                {userMode === 'PREDICT_MANUAL' && userId && (
                    <Box>
                        <Button
                            variant="default"
                            onClick={() => setUserMode('VIEW')}
                            mb="md"
                        >
                            &larr; Abbrechen / Zurück zur Übersicht
                        </Button>
                        <CreatePrediction {...tournament} userId={userId} onSuccess={() => {
                            setRefreshKey(prev => prev + 1);
                            setUserMode('VIEW');
                        }}/>
                    </Box>
                )}

                {userMode === 'VIEW' && (
                    <Box>
                        {userId && tournament.started && !tournament.finished && !hasPredicted && (
                            <Paper withBorder p="xl" bg="gray.0" mb="xl" radius="md">
                                <Stack align="center" gap="sm">
                                    <Title order={3}>Tipp abgeben</Title>
                                    <Text c="dimmed">
                                        Wie wird das Turnier ausgehen? Reiche jetzt deinen Tipp ein:
                                    </Text>
                                    <Group justify="center" mt="md">
                                        <Button variant="default" onClick={() => setUserMode('PREDICT_MANUAL')}>
                                            Gruppen & Podium tippen
                                        </Button>
                                        <Button variant="default" onClick={() => setUserMode('PREDICT_SIM')}>
                                            Turnier simulieren
                                        </Button>
                                    </Group>
                                </Stack>
                            </Paper>
                        )}

                        {hasPredicted && (
                            <Alert color="green" mb="xl" title="Top!" variant="light">
                                Du hast deinen Tipp für dieses Turnier bereits abgegeben!
                            </Alert>
                        )}
                        {userRole === "ADMIN" ? (
                            <MatchEditor tournamentId={tournament.id} activeTabId={activeTabId}
                                         onTabChange={setActiveTabId}
                                         onMatchUpdated={handleMatchUpdated}/>
                        ) : (
                            <MatchSpectator tournamentId={tournament.id} activeTabId={activeTabId}
                                            onTabChange={setActiveTabId}/>
                        )}
                    </Box>
                )}
            </Box>

            {userMode === 'VIEW' && (
                <Box style={{flex: '1 1 350px', minWidth: 0}}>
                    <PredictionSidebar tournamentId={tournament.id} activeTabId={activeTabId} refreshKey={refreshKey}/>
                </Box>
            )}
        </Group>
    );
}