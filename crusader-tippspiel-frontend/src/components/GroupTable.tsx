import type {GroupStandingDto, Member} from "../types/types.ts";
import {Paper, Table} from '@mantine/core';

/**
 * Props for the GroupTable component.
 * @param standings The list of current standings entries for the group to be displayed.
 */
interface GroupTableProps {
    standings: GroupStandingDto[];
}

/**
 * Component for rendering the standings and rankings of a specific group in a tabular layout.
 * Displays calculated data such as ranks, match wins/ties/losses, kill stats, and overall group points.
 */
export default function GroupTable({standings}: GroupTableProps) {

    if (!standings || standings.length === 0) {
        return null;
    }

    const rows = standings.map((row, index) => (
        <Table.Tr key={row.team.id}>
            <Table.Td fw={700} c="dimmed">{index + 1}</Table.Td>
            <Table.Td fw={700} ta="left">
                {row.team.members.map((m: Member) => m.name).join(' & ')}
            </Table.Td>
            <Table.Td>{row.wins}</Table.Td>
            <Table.Td>{row.ties}</Table.Td>
            <Table.Td>{row.losses}</Table.Td>
            <Table.Td>{row.kills}</Table.Td>
            <Table.Td fw={700} fz="md">{row.points}</Table.Td>
        </Table.Tr>
    ));

    return (
        <Paper withBorder shadow="sm" radius="md" mb="xl" style={{overflowX: 'auto'}}>
            <Table striped highlightOnHover verticalSpacing="sm" ta="center" miw={390}>
                <Table.Thead>
                    <Table.Tr>
                        <Table.Th ta="center" w={40}>#</Table.Th>
                        <Table.Th ta="left" w={100}>Team</Table.Th>
                        <Table.Th ta="center" w={40} title="Siege">S</Table.Th>
                        <Table.Th ta="center" w={40} title="Unentschieden">U</Table.Th>
                        <Table.Th ta="center" w={40} title="Niederlagen">N</Table.Th>
                        <Table.Th ta="center" w={60}>Kills</Table.Th>
                        <Table.Th ta="center" w={70}>Punkte</Table.Th>
                    </Table.Tr>
                </Table.Thead>
                <Table.Tbody>{rows}</Table.Tbody>
            </Table>
        </Paper>
    );
}