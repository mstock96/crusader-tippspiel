import {useEffect, useMemo, useState} from "react";
import {fetchWithAuth} from "../api/api.ts";
import type {Group, Prediction, Team, TournamentInfoDto} from "../types/types.ts";
import {Button, Group as MantineGroup, NumberInput, Paper, Select, Stack, Tabs, Text, Title} from '@mantine/core';
import {notifications} from '@mantine/notifications';

/**
 * Props for the CreatePrediction component, inheriting standard tournament info.
 * @param userId The unique database identifier of the user submitting the predictions.
 * @param onSuccess Callback triggered successfully after the tips are stored via the backend.
 */
interface CreatePredictionProps extends TournamentInfoDto {
    userId: number;
    onSuccess: () => void;
}

/**
 * Primary component enabling a user to manually forecast tournament outcomes.
 * Allows step-by-step guessing of individual group standings followed by a podium prediction
 * generated dynamically from those very group selections.
 */
export default function CreatePrediction({
                                             id: tournamentId,
                                             numberOfGroups,
                                             teamsPerGroup,
                                             totalKoParticipants,
                                             userId,
                                             onSuccess
                                         }: CreatePredictionProps) {

    type PredictionState = Record<number, Record<number, { team: Team, predictedPosition: number }>>;

    const [predictions, setPredictions] = useState<PredictionState>({});
    const [groups, setGroups] = useState<Group[]>([])
    const [activeGroupId, setActiveGroupId] = useState<string | null>(null)
    const [podiumTeams, setPodiumTeams] = useState<(Team | null)[]>([])

    /** 
     * Hooks into component mount to fetch structural groupings.
     * Establishes the necessary UI placeholders for dynamic podium selections.
     */
    useEffect(() => {
        fetchWithAuth(`/tournaments/${tournamentId}/groups`)
            .then(res => res.json())
            .then(data => {
                setGroups(data)
                if (data.length > 0) {
                    setActiveGroupId(data[0].id.toString());
                }
                const placeholder = [null, null]
                if (totalKoParticipants > 0) placeholder.push(null);
                setPodiumTeams(placeholder);
            })
            .catch(err => console.error("Fehler beim Laden der Gruppen:", err));
    }, [tournamentId, totalKoParticipants])

    /**
     * Mutates local state when a user manually predicts a team's resulting group position.
     * @param groupId ID of the parent group tier.
     * @param team The team object being placed.
     * @param position The predicted integer standing sequence.
     */
    const handleTeamPredictionChange = (groupId: number, team: Team, position: number) => {

        setPredictions(prev => {
            const newState = {...prev};

            const groupTips = newState[groupId] ? {...newState[groupId]} : {};
            groupTips[team.id] = {team: team, predictedPosition: position};

            newState[groupId] = groupTips;
            return newState;
        });
    };

    /** 
     * Evaluates if a specified group's manual predictions correctly assign 
     * exactly one distinct sequential position value per team.
     */
    const isGroupComplete = (groupId: number, expectedTeamCount: number) => {
        const groupTips = predictions[groupId];
        if (!groupTips) return false;

        const positions = Object.values(groupTips).map(tip => tip.predictedPosition);
        if (positions.length !== expectedTeamCount) return false;

        const allInRange = positions.every(tip => tip >= 1 && tip <= expectedTeamCount)
        if (!allInRange) return false;

        const uniquePositions = new Set(positions);
        return uniquePositions.size === expectedTeamCount;
    };

    /** Aggregates boolean group completeness constraints across all tracked groupings. */
    const areAllGroupsComplete = () => {
        return groups.every(group => {
            return isGroupComplete(group.id, group.teams.length);
        });
    };

    const allGroupsComplete = areAllGroupsComplete();

    /** 
     * Memoized calculation mapping validated group predictions onto abstract knockout round seedings.
     * Dynamically deduces advancing candidates handling wildcard fractions internally.
     */
    const koRoundTeams = useMemo(() => {
        if (!allGroupsComplete) {
            return [];
        }

        const qualifiedTeamsPerGroup = Math.floor(totalKoParticipants / numberOfGroups);
        const hasWildcards = (totalKoParticipants % numberOfGroups) > 0;
        const candidates: Team[] = [];

        groups.forEach(group => {
            const groupTips = predictions[group.id];

            const sortedTeams = [...group.teams].sort((a, b) => {
                return (groupTips[a.id]?.predictedPosition ?? teamsPerGroup) - (groupTips[b.id].predictedPosition ?? teamsPerGroup);
            });

            candidates.push(...sortedTeams.slice(0, qualifiedTeamsPerGroup));

            if (hasWildcards && sortedTeams.length > qualifiedTeamsPerGroup) {
                candidates.push(sortedTeams[qualifiedTeamsPerGroup]);
            }
        });

        return candidates;
    }, [allGroupsComplete, groups, predictions, totalKoParticipants, numberOfGroups, teamsPerGroup]);

    /** Restricts podium selection drop-downs to negate duplicate assignments globally. */
    const getAvailableTeamsForDropdown = (dropdownIndex: number) => {
        return koRoundTeams.filter(team => {
            const isSelectedElsewhere = podiumTeams.some((selectedTeam, index) => {
                return selectedTeam !== null
                    && selectedTeam.id === team.id
                    && index !== dropdownIndex;
            });
            return !isSelectedElsewhere;
        });
    };

    /** Updates the corresponding selected element residing internally in a dedicated slot arrays constraint list. */
    const handlePodiumSelect = (dropdownIndex: number, val: string | null) => {
        const team = koRoundTeams.find(t => t.id.toString() === val) || null;
        const newPodium = [...podiumTeams];
        newPodium[dropdownIndex] = team;
        setPodiumTeams(newPodium);
    };

    /** Builds the full complex prediction schema payload and dispatches it statically to persistence endpoints. */
    const handleSavePrediction = () => {
        const groupTipsList = Object.values(predictions).flatMap(groupTips => Object.values(groupTips));
        const prediction: Omit<Prediction, 'id' | 'groupPoints' | 'podiumPoints' | 'totalPoints'> = {
            winner: podiumTeams[0]!,
            second: podiumTeams[1]!,
            third: totalKoParticipants > 2 ? (podiumTeams[2] || null) : null,
            groupTips: groupTipsList
        };

        fetchWithAuth(`/predictions/${tournamentId}/create/${userId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(prediction)
        })
            .then(res => {
                if (res.ok) {
                    notifications.show({message: "Tipps erfolgreich gespeichert!", color: "green"});
                    onSuccess()
                } else {
                    notifications.show({message: "Fehler vom Server. Status: " + res.status, color: "red"});
                }
            })
            .catch(err => {
                console.error("Netzwerkfehler (läuft das Backend?):", err);
            });
    }

    /** Verifies overall entry integrity against potential undefined gaps before unlocking network dispatching bounds. */
    const isPredictionFinished = allGroupsComplete && podiumTeams.every((team, index) => team || (index === podiumTeams.length - 1 && totalKoParticipants === 2 && team === null))

    const activeGroup = groups.find(group => group.id.toString() === activeGroupId);


    return (
        <Paper withBorder p="md" shadow="sm" radius="md">
            <Title order={3} mb="xl">
                Tipps erstellen
            </Title>

            <Tabs value={activeGroupId} onChange={setActiveGroupId} mb="xl" variant="pills">
                <Tabs.List justify="center">
                    {groups.map(group => (
                        <Tabs.Tab
                            key={group.id}
                            value={group.id.toString()}
                            style={{
                                border: activeGroupId === group.id.toString() ? '1px solid transparent' : '1px solid var(--mantine-color-gray-3)',
                                fontWeight: 'bold'
                            }}
                        >
                            {group.name || `Gruppe ${group.id}`}
                        </Tabs.Tab>
                    ))}
                </Tabs.List>
            </Tabs>

            <Stack gap="md" mb="xl">
                {activeGroup && activeGroup.teams.map((team) => {
                    const currentTip = predictions[activeGroup.id]?.[team.id]?.predictedPosition;

                    return (
                        <Paper key={team.id} withBorder shadow="sm" p="md" radius="md">
                            <MantineGroup key={team.id} wrap="nowrap" align="center">
                                <Text fw={700} style={{flex: 1}}>
                                    {team.members.map(m => m.name).join(" & ")}
                                </Text>
                                <NumberInput
                                    min={1}
                                    max={activeGroup.teams.length}
                                    value={currentTip !== undefined ? currentTip : ''}
                                    onChange={(val) => {
                                        if (val) handleTeamPredictionChange(activeGroup.id, team, Number(val))
                                    }}
                                    required
                                    w={80}
                                />
                            </MantineGroup>
                        </Paper>
                    );
                })}
            </Stack>

            {allGroupsComplete && (
                <Paper withBorder p="md" radius="md" bg="gray.0" mb="xl">
                    <Title order={4} mb="sm">Podium Tipps</Title>
                    <Stack gap="md">
                        <Select
                            label="Platz 1 wählen"
                            placeholder="-- Platz 1 wählen --"
                            value={podiumTeams[0]?.id.toString() || null}
                            onChange={(val) => handlePodiumSelect(0, val)}
                            data={getAvailableTeamsForDropdown(0).map(t => ({
                                value: t.id.toString(),
                                label: t.members.map(m => m.name).join(' & ')
                            }))}
                            searchable
                        />
                        <Select
                            label="Platz 2 wählen"
                            placeholder="-- Platz 2 wählen --"
                            value={podiumTeams[1]?.id.toString() || null}
                            onChange={(val) => handlePodiumSelect(1, val)}
                            data={getAvailableTeamsForDropdown(1).map(t => ({
                                value: t.id.toString(),
                                label: t.members.map(m => m.name).join(' & ')
                            }))}
                            searchable
                        />
                        {totalKoParticipants > 2 && (
                            <Select
                                label="Platz 3 wählen"
                                placeholder="-- Platz 3 wählen --"
                                value={podiumTeams[2]?.id.toString() || null}
                                onChange={(val) => handlePodiumSelect(2, val)}
                                data={getAvailableTeamsForDropdown(2).map(t => ({
                                    value: t.id.toString(),
                                    label: t.members.map(m => m.name).join(' & ')
                                }))}
                                searchable
                            />
                        )}
                    </Stack>
                </Paper>
            )}

            <Button
                onClick={handleSavePrediction}
                disabled={!isPredictionFinished}
                color={isPredictionFinished ? "blue" : "gray"}
                fullWidth
                size="lg"
            >
                {isPredictionFinished ? 'Tipps speichern' : 'Tipps unvollständig'}
            </Button>
        </Paper>
    );
}