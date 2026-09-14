import {useEffect, useState} from 'react';
import type {Group, Member, Tournament} from '../types/types.ts';
import GroupEditor from './GroupEditor';
import {fetchWithAuth} from "../api/api.ts";
import {Box, Button, Divider, Stack, Tabs, Title} from '@mantine/core';
import {notifications} from '@mantine/notifications';

/**
 * Props for the GroupManager component.
 * @param tournamentId The unique identifier of the tournament managing the groups.
 * @param onTournamentStart Callback triggered when the tournament is successfully fully assigned and started.
 */
interface GroupManagerProps {
    tournamentId: number;
    onTournamentStart: () => void;
}

/**
 * Component for managing all groups and their team assignments internally in a tournament.
 * Provides tabs to switch between groups, manages state validation for assigning members to teams, 
 * and handles the API requests to bulk-save all group states and start the tournament phase.
 */
export default function GroupManager({tournamentId, onTournamentStart}: GroupManagerProps) {

    const [groups, setGroups] = useState<Group[]>([]);
    const [members, setMembers] = useState<Member[]>([]);
    const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
    const [tournament, setTournament] = useState<Tournament | null>(null);

    /**
     * Initializes the component by fetching groups, available members, and basic tournament info from the backend.
     */
    useEffect(() => {
        fetchWithAuth(`/tournaments/${tournamentId}/groups`)
            .then(res => res.json())
            .then(data => {
                setGroups(data);
                if (data.length > 0) {
                    setActiveGroupId(data[0].id.toString());
                }
            })
            .catch(err => console.error("Keine Antwort vom Backend:", err));

        fetchWithAuth(`/members`)
            .then(res => res.json())
            .then(data => setMembers(data))
            .catch(err => console.error("Keine Antwort vom Backend:", err));

        fetchWithAuth(`/tournaments/${tournamentId}`)
            .then(res => res.json())
            .then(data => setTournament(data))
            .catch(err => console.error("Keine Antwort vom Backend:", err));

    }, [tournamentId]);


    /**
     * Updates the local state when a member is assigned to a specific team slot within a group.
     * @param groupId The ID of the group containing the team.
     * @param teamId The ID of the specific team receiving the new member.
     * @param playerIndex The slot index of the player within this specific team.
     * @param memberId The ID of the newly assigned member.
     */
    const handleMemberSelected = (groupId: number, teamId: number, playerIndex: number, memberId: number) => {
        const selectedMember = members.find(m => m.id === memberId);
        if (!selectedMember) return;

        setGroups(prevGroup =>
            prevGroup.map((group => {
                if (group.id !== groupId) return group;

                return {
                    ...group,
                    teams: group.teams.map(team => {
                        if (team.id !== teamId) return team;

                        const newMembers = [...(team.members || [])];
                        newMembers[playerIndex] = selectedMember;

                        return {...team, members: newMembers};
                    })
                }
            }))
        )
    }

    /**
     * Saves the current team assignments of all groups to the backend via a bulk update patch operation.
     */
    const handleSaveAll = () => {
        return fetchWithAuth(`/groups/bulk/update`, {
            method: 'PATCH',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(groups)
        })
            .then(res => {
                if (!res.ok) throw new Error("Fehler beim Speichern");
                notifications.show({message: "Alle Gruppen erfolgreich gespeichert!", color: "green"});
            })
            .catch(err => console.error("Keine Antwort vom Backend:", err));
    }

    /**
     * Initiates the overall tournament start sequence.
     * Safely executes a save state block first across all groups, then triggers the final tournament start API call.
     */
    const handleStartTournament = () => {
        handleSaveAll()
            .then(() => {
                return fetchWithAuth(`/tournaments/${tournamentId}/start`, {
                    method: 'POST'
                });
            })
            .then(res => {
                if (!res.ok) throw new Error("Fehler beim Starten des Turniers");
                onTournamentStart();
            })
            .catch(err => {
                console.error("Keine Antwort vom Backend:", err);
            });
    }

    const activeGroup = groups.find(g => g.id.toString() === activeGroupId);

    /** 
     * Validates whether all configured groups have the required number of teams,
     * and every team has the required number of correctly assigned members.
     * Necessary to enforce integrity before locking in and starting the tournament.
     */
    const groupsAreReady = () => {
        if (!tournament) return false;

        if (groups.length !== tournament.numberOfGroups) return false;
        return groups.every((group) => {
            if (group.teams.length !== tournament.teamsPerGroup) return false;

            return group.teams.every((team) => team.members.length === tournament.aiPerTeam);
        });
    }

    /** Disables the start functionality if conditions are unmet or if it has already been launched. */
    const isStartDisabled = tournament?.started || !groupsAreReady();

    return (
        <Box>
            <Title order={2} mb="md">Gruppen verwalten</Title>

            <Tabs value={activeGroupId} onChange={setActiveGroupId} mb="xl">
                <Tabs.List>
                    {groups.map((group) => (
                        <Tabs.Tab key={group.id} value={group.id.toString()}>
                            {group.name}
                        </Tabs.Tab>
                    ))}
                </Tabs.List>
            </Tabs>

            {tournament && activeGroup && (
                <GroupEditor
                    group={activeGroup}
                    members={members}
                    aiPerTeam={tournament.aiPerTeam}
                    isReadOnly={tournament.started}
                    onMemberChange={handleMemberSelected}
                />
            )}

            <Divider my="xl"/>

            <Stack gap="md">
                <Button
                    onClick={handleSaveAll}
                    disabled={tournament?.started}
                    color="green"
                    size="md"
                    fullWidth
                >
                    Alle Gruppen speichern
                </Button>

                <Button
                    onClick={handleStartTournament}
                    disabled={isStartDisabled}
                    color="blue"
                    size="md"
                    fullWidth
                >
                    Turnier starten
                </Button>
            </Stack>
        </Box>
    );
}