import type {LeaderboardRowDto} from "../types/types.ts";
import {Paper, Table} from '@mantine/core';

/**
 * Props for the LeaderboardTable component.
 * @param leaderBoardRows The sorted array of leaderboard entries representing player predictions and points.
 */
interface LeaderboardTableProps {
    leaderBoardRows: LeaderboardRowDto[];
}

/**
 * Component for displaying the prediction standings amongst the users.
 * Automatically handles the tiering logic where players with equal overall scores tie for the same rank.
 */
export default function LeaderboardTable({leaderBoardRows}: LeaderboardTableProps) {

    const rankedRows = [];
    let currentRank = 1;

    for (let i = 0; i < leaderBoardRows.length; i++) {
        const currentRow = leaderBoardRows[i];

        if (i > 0 && currentRow.totalPoints < leaderBoardRows[i - 1].totalPoints) {
            currentRank = i + 1;
        }

        rankedRows.push({...currentRow, displayRank: currentRank});
    }

    const rows = rankedRows.map((row) => (
        <Table.Tr key={row.userName}>
            <Table.Td pl={5} c="dimmed" fw={700}>
                {row.displayRank}.
            </Table.Td>
            <Table.Td
                fw={700}
                ta="center"
                style={{
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '120px'
                }}
            >
                {row.userName}
            </Table.Td>
            <Table.Td c="dimmed">{row.groupPoints}</Table.Td>
            <Table.Td c="dimmed">{row.podiumPoints}</Table.Td>
            <Table.Td fw={700} pr={5} c="blue" fz="sm">
                {row.totalPoints}
            </Table.Td>
        </Table.Tr>
    ));

    return (
        <Paper withBorder shadow="sm" radius="md" style={{width: '100%', overflowX: 'auto'}}>
            <Table
                striped
                highlightOnHover
                ta="center"
                fz="sm"
                verticalSpacing="sm"
                horizontalSpacing={3}
            >
                <Table.Thead>
                    <Table.Tr>
                        <Table.Th w={40} ta="center" pl={5} title="Platzierung">Platz</Table.Th>
                        <Table.Th ta="center" title="Spielername">Spieler</Table.Th>
                        <Table.Th w={50} ta="center" title="Punkte aus der Gruppenphase">Gruppe</Table.Th>
                        <Table.Th w={50} ta="center" title="Punkte aus den Final-Tipps">Podium</Table.Th>
                        <Table.Th w={50} ta="center" pr={5} title="Gesamtpunkte">Gesamt</Table.Th>
                    </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                    {rows}
                </Table.Tbody>
            </Table>
        </Paper>
    );
}