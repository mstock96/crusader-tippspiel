import React, {useState} from "react";
import TournamentSelector from './components/TournamentSelector';
import GroupManager from "./components/GroupManager";
import CreateTournament from "./components/CreateTournament.tsx";
import CreateMember from "./components/CreateMember.tsx";
import Login from "./components/Login.tsx";
import CreateUser from "./components/CreateUser.tsx";
import TournamentDashboard from "./components/TournamentDashboard.tsx";
import type {TournamentInfoDto} from "./types/types.ts";
import {Accordion, AppShell, Box, Button, Container, Group, Title} from '@mantine/core';

/**
 * Root application component governing high-level authenticated routing, global state preservation,
 * and context initialization for the underlying tournament workflows.
 * Mounts standard structural containers (AppShell, Toolbars, routing switches).
 */
function App() {
    const token = localStorage.getItem("jwt_token");

    const [isAuthenticated, setIsAuthenticated] = useState(!!token);
    const [userRole, setUserRole] = useState<string | null>(getRoleFromToken(token));
    const [userId, setUserId] = useState<number | null>(getIdFromToken(token));

    const [showLogin, setShowLogin] = useState(false);
    const [selectedTournament, setSelectedTournament] = useState<TournamentInfoDto | null>(null);
    const [userMode, setUserMode] = useState<'VIEW' | 'PREDICT_MANUAL' | 'PREDICT_SIM'>('VIEW');

    /**
     * Bootstraps local storage keys initializing user session scopes post-login phase.
     */
    const handleLoginSuccess = () => {
        const newToken = localStorage.getItem("jwt_token");
        setIsAuthenticated(true);
        setUserRole(getRoleFromToken(newToken));
        setUserId(getIdFromToken(newToken));
        setShowLogin(false);
    };

    /**
     * Purges runtime states and invalidates browser cached tokens to disconnect sessions safely.
     */
    const handleLogout = () => {
        localStorage.removeItem("jwt_token");
        setIsAuthenticated(false);
        setUserRole(null);
        setUserId(null);
        setSelectedTournament(null);
    };

    /**
     * Deserializes encoded JWT payload tokens to extract administrative permission strings.
     * @param token Captured authorization string containing encoded credential roles.
     * @returns Parsed role string ("ADMIN" | "USER") or null if undefined.
     */
    function getRoleFromToken(token: string | null): string | null {
        if (!token) return null;
        try {
            const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
            return JSON.parse(atob(base64)).role;
        } catch (e) {
            return null;
        }
    }

    /**
     * Deserializes encoded JWT payload tokens to extract absolute database user correlation bindings.
     * @param token Captured authorization string containing encoded numerical identifiers.
     * @returns Parsed user entity integer ID or null resolving safely against tampering.
     */
    function getIdFromToken(token: string | null): number | null {
        if (!token) return null;
        try {
            const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
            return JSON.parse(atob(base64)).id;
        } catch (e) {
            return null;
        }
    }

    if (showLogin) {
        return (
            <Container size="sm" mt="xl">
                <Button variant="default" onClick={() => setShowLogin(false)} mb="xl">Zurück</Button>
                <Login onLoginSuccess={handleLoginSuccess}/>
            </Container>
        );
    }

    return (
        <AppShell
            header={{height: 60}}
            padding="md"
        >
            <AppShell.Header>
                <Group h="100%" px="md" justify="space-between">
                    <Title order={2}>Stronghold Crusader Tippspiel</Title>

                    <Group>
                        {selectedTournament !== null && (
                            <Button variant="default" onClick={() => setSelectedTournament(null)}>
                                Zurück zur Auswahl
                            </Button>
                        )}

                        {!isAuthenticated ? (
                            <Button onClick={() => setShowLogin(true)} color="blue">
                                Anmelden
                            </Button>
                        ) : (
                            <Button onClick={handleLogout} color="red">
                                Abmelden
                            </Button>
                        )}
                    </Group>
                </Group>
            </AppShell.Header>

            <AppShell.Main>
                <Container size="xl">
                    {selectedTournament === null ? (
                        <React.Fragment>
                            {userRole === "ADMIN" && (
                                <Box mb="xl" mt="md">
                                    <Title order={2} mb="lg" pb="xs" style={{
                                        borderBottom: '2px solid var(--mantine-color-blue-filled)',
                                        display: 'inline-block'
                                    }}>
                                        Admin Dashboard
                                    </Title>

                                    <Accordion variant="separated" radius="md">
                                        {/* Widget 1: Turnier erstellen */}
                                        <Accordion.Item value="tournament">
                                            <Accordion.Control>
                                                <Title order={3}>Turnier erstellen</Title>
                                            </Accordion.Control>
                                            <Accordion.Panel>
                                                <CreateTournament/>
                                            </Accordion.Panel>
                                        </Accordion.Item>

                                        {/* Widget 2: KIs anlegen */}
                                        <Accordion.Item value="ai-members">
                                            <Accordion.Control>
                                                <Title order={3}>KIs anlegen</Title>
                                            </Accordion.Control>
                                            <Accordion.Panel>
                                                <CreateMember/>
                                            </Accordion.Panel>
                                        </Accordion.Item>

                                        {/* Widget 3: Benutzer anlegen */}
                                        <Accordion.Item value="users">
                                            <Accordion.Control>
                                                <Title order={3}>Benutzer anlegen</Title>
                                            </Accordion.Control>
                                            <Accordion.Panel>
                                                <CreateUser/>
                                            </Accordion.Panel>
                                        </Accordion.Item>
                                    </Accordion>
                                </Box>
                            )}
                            <TournamentSelector
                                isVisitor={!userId || userRole === "USER"}
                                onSelect={(tournament) => {
                                    setSelectedTournament(tournament);
                                    setUserMode('VIEW');
                                }}
                            />
                        </React.Fragment>
                    ) : (
                        <React.Fragment>
                            {userRole === "ADMIN" && !selectedTournament.started ? (
                                <GroupManager
                                    tournamentId={selectedTournament.id}
                                    onTournamentStart={() => {
                                        setSelectedTournament({...selectedTournament, started: true});
                                    }}
                                />
                            ) : (
                                <TournamentDashboard
                                    tournament={selectedTournament}
                                    userRole={userRole}
                                    userId={userId}
                                    userMode={userMode}
                                    setUserMode={setUserMode}
                                />
                            )}
                        </React.Fragment>
                    )}
                </Container>
            </AppShell.Main>
        </AppShell>
    );
}

export default App;