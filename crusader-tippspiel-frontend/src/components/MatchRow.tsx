import type {Game, Member} from "../types/types.ts";
import {Box, Button, Group, NumberInput, Paper, Text} from '@mantine/core';

/**
 * Props for the MatchRow component.
 * @param game The specific game object data (including involved teams and current recorded scores) to render.
 * @param maxKills Limit integer for input validation checking (typically dependent on AI per Team).
 * @param isLocked Whether the result input is locked from changes (e.g. if the broader tournament phase is completed).
 * @param readOnly Controls rendering of plain text score versus interactive number inputs and save controls.
 * @param onScoreChange Callback triggered continuously as input values fluctuate.
 * @param onSave Callback triggered exactly when the user confirms preserving the match outcome to the backend.
 * @param onEdit Callback triggered to toggle a completed match back into an interactive state.
 */
interface MatchRowProps {
    game: Game;
    maxKills: number;
    isLocked: boolean;
    readOnly: boolean;
    onScoreChange?: (gameId: number, isTeam2: boolean, kills: number) => void;
    onSave?: (gameId: number) => void;
    onEdit?: (gameId: number) => void;
}

/**
 * Component for rendering a single match/game between two established teams.
 * Transitions functionally between an interactive input row (during predicting or admin data-entry) 
 * and a static readable score layout for simple viewing configurations.
 */
export default function MatchRow({
                                     game,
                                     maxKills = 10,
                                     isLocked,
                                     readOnly = false,
                                     onScoreChange,
                                     onSave,
                                     onEdit
                                 }: MatchRowProps) {
    const isTeam1Invalid = game.team1Kills > maxKills;
    const isTeam2Invalid = game.team2Kills > maxKills;
    const isInvalid = isTeam1Invalid || isTeam2Invalid;

    return (
        <Paper withBorder shadow="sm" p="md" radius="md">
            <Group justify="center" align="center" gap="md" wrap="wrap">

                <Box style={{flex: '1 1 120px', minWidth: '120px'}}>
                    <Text fw={700} size="md" ta="right" style={{wordBreak: 'break-word'}}>
                        {game.team1?.members.map((m: Member) => m.name).join(' & ')}
                    </Text>
                </Box>

                <Group gap="sm" justify="center" align="center" wrap="nowrap">
                    {readOnly ? (
                        <Text fw={700} size="xl" c="dark" px="sm" style={{whiteSpace: 'nowrap'}}>
                            {game.team1Kills} : {game.team2Kills}
                        </Text>
                    ) : (
                        <>
                            <NumberInput
                                min={0}
                                allowNegative={false}
                                allowDecimal={false}
                                hideControls
                                value={game.team1Kills ?? ''}
                                onChange={(val) => {
                                    if (val === '') {
                                        onScoreChange?.(game.id, false, 0);
                                        return;
                                    }
                                    const kills = Number(val);
                                    if (kills >= 0) {
                                        onScoreChange?.(game.id, false, kills);
                                    }
                                }}
                                disabled={game.played}
                                w={60}
                                error={isTeam1Invalid}
                                styles={{input: {textAlign: 'center', fontSize: '18px', fontWeight: 'bold'}}}
                            />

                            <Text fw={700} size="xl" c="dimmed">:</Text>

                            <NumberInput
                                min={0}
                                allowNegative={false}
                                allowDecimal={false}
                                hideControls
                                value={game.team2Kills ?? ''}
                                onChange={(val) => {
                                    if (val === '') {
                                        onScoreChange?.(game.id, true, 0);
                                        return;
                                    }
                                    const kills = Number(val);
                                    if (kills >= 0) {
                                        onScoreChange?.(game.id, true, kills);
                                    }
                                }}
                                disabled={game.played}
                                w={60}
                                error={isTeam2Invalid}
                                styles={{input: {textAlign: 'center', fontSize: '18px', fontWeight: 'bold'}}}
                            />
                        </>
                    )}
                </Group>

                <Box style={{flex: '1 1 120px', minWidth: '120px'}}>
                    <Text fw={700} size="md" ta="left" style={{wordBreak: 'break-word'}}>
                        {game.team2?.members.map((m: Member) => m.name).join(' & ')}
                    </Text>
                </Box>

                {!readOnly && (
                    <Group gap="sm" justify="center">
                        <Button
                            onClick={() => onSave?.(game.id)}
                            disabled={game.played || isInvalid}
                            color="blue"
                        >
                            Speichern
                        </Button>
                        <Button
                            onClick={() => onEdit?.(game.id)}
                            disabled={!game.played || isLocked}
                            color="yellow"
                        >
                            Bearbeiten
                        </Button>
                    </Group>
                )}
            </Group>
        </Paper>
    );
}