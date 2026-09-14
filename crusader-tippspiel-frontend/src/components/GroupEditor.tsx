import type {Group, Member} from '../types/types.ts';
import {Box, Group as MantineGroup, Paper, Select, Stack, Text, Title} from '@mantine/core';

/**
 * Props for the GroupEditor component.
 * @param group The group being edited.
 * @param members The list of all available members (players) that can be assigned to teams.
 * @param aiPerTeam The required number of members per team.
 * @param isReadOnly Indicates if the tournament has already started. If true, team editing is disabled.
 * @param onMemberChange Callback triggered when a member is selected for a specific team slot.
 */
interface GroupEditorProps {
    group: Group;
    members: Member[];
    aiPerTeam: number;
    isReadOnly: boolean;
    onMemberChange: (groupId: number, teamId: number, playerIndex: number, memberId: number) => void;
}

/**
 * Component for editing the team compositions within a single group.
 * Allows assigning members (players or AI characters) to slots in each team belonging to the group.
 * Enforces read-only mode automatically once the parent tournament has started.
 */
export default function GroupEditor({
                                        group,
                                        members,
                                        aiPerTeam,
                                        isReadOnly,
                                        onMemberChange
                                    }: GroupEditorProps) {

    /** Options mapped for the Mantine Select component. */
    const memberOptions = members.map(m => ({value: m.id.toString(), label: m.name}));

    return (
        <Paper withBorder p="md" mt="md">
            <Title order={3} mb="sm">Bearbeite: {group.name}</Title>

            {isReadOnly && (
                <Text c="red" fw={700} mb="md">
                    Turnier ist gestartet. Keine Änderungen möglich!
                </Text>
            )}

            <Stack gap="md">
                {group.teams.map((team, index) => (
                    <Box key={team.id} style={{padding: '10px', background: '#f9f9f9', borderRadius: '4px'}}>
                        <Title order={4} mb="sm">Team {index + 1}</Title>

                        <MantineGroup gap="sm" wrap="wrap">
                            {Array.from({length: aiPerTeam}).map((_, playerIndex) => {
                                const existingMember = team.members ? team.members[playerIndex] : undefined;

                                return (
                                    <Select
                                        key={`player-slot-${team.id}-${playerIndex}`}
                                        label={`Spieler ${playerIndex + 1}`}
                                        disabled={isReadOnly}
                                        value={existingMember ? existingMember.id.toString() : null}
                                        onChange={(val) => {
                                            if (val) {
                                                const newMemberId = parseInt(val);
                                                onMemberChange(group.id, team.id, playerIndex, newMemberId);
                                            }
                                        }}
                                        w={120}
                                        data={memberOptions}
                                        placeholder="-- Leer --"
                                        searchable
                                    />
                                );
                            })}
                        </MantineGroup>
                    </Box>
                ))}
            </Stack>
        </Paper>
    );
}