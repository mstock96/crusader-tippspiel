import {useState} from "react";
import type {Tournament} from "../types/types.ts";
import {fetchWithAuth} from "../api/api.ts";
import {Button, NumberInput, Select, Stack, Text, TextInput} from '@mantine/core';
import {notifications} from '@mantine/notifications';

/**
 * Component for configuring and creating a new tournament.
 * Provides form inputs for tournament settings like group sizes, team limits, and KO-round participants.
 */
export default function CreateTournament() {
    const [name, setName] = useState("");
    const [numberOfGroups, setNumberOfGroups] = useState<number | string>(4);
    const [teamsPerGroup, setTeamsPerGroup] = useState<number | string>(4);
    const [aiPerTeam, setAiPerTeam] = useState<number | string>(2);
    const [totalKoParticipants, setTotalKoParticipants] = useState<string | null>("8");

    /**
     * Submits the new tournament configuration to the backend API.
     * Validates inputs, resets the form on success, and triggers a page reload to update the dashboard.
     * @param e The form submission event.
     */
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const newTournament: Omit<Tournament, 'id' | 'started' | 'finished'> = {
            name,
            numberOfGroups: Number(numberOfGroups),
            teamsPerGroup: Number(teamsPerGroup),
            aiPerTeam: Number(aiPerTeam),
            totalKoParticipants: Number(totalKoParticipants)
        };
        console.log(newTournament);
        fetchWithAuth('/tournaments/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newTournament)
        })
            .then(res => {
                if (res.ok) {

                    notifications.show({message: "Turnier erfolgreich angelegt!", color: "green"});

                    // Formular wieder leeren für das nächste Turnier
                    setName('');
                    setNumberOfGroups(4);
                    setTeamsPerGroup(4);
                    setAiPerTeam(2);
                    setTotalKoParticipants("8");
                    window.location.reload();
                } else {
                    notifications.show({message: "Fehler vom Server. Status: " + res.status, color: "red"});
                }
            })
            .catch(err => {
                console.error("Keine Antwort vom Backend:", err);
            });
    };

    const isNameValid = name.trim().length > 0;
    const numGroups = Number(numberOfGroups);
    const tPerGroup = Number(teamsPerGroup);
    const aiTeams = Number(aiPerTeam);
    const koParts = Number(totalKoParticipants);

    const areSettingsPositive = numGroups > 0 && tPerGroup > 0 && aiTeams > 0;
    const totalTeams = numGroups * tPerGroup;
    const hasEnoughTeams = totalTeams >= koParts;
    const isFormValid = isNameValid && areSettingsPositive && hasEnoughTeams;

    return (
        <form onSubmit={handleSubmit}>
            <Stack>
                <TextInput
                    label="Turniername:"
                    value={name}
                    onChange={(e) => setName(e.currentTarget.value)}
                    required
                    styles={{label: {fontWeight: 'bold'}}}
                />

                <NumberInput
                    label="Anzahl Gruppen:"
                    value={numberOfGroups}
                    onChange={setNumberOfGroups}
                    min={1}
                    styles={{label: {fontWeight: 'bold'}}}
                />

                <NumberInput
                    label="Anzahl Teams pro Gruppe:"
                    value={teamsPerGroup}
                    onChange={setTeamsPerGroup}
                    min={1}
                    styles={{label: {fontWeight: 'bold'}}}
                />

                <NumberInput
                    label="Anzahl KIs pro Team:"
                    value={aiPerTeam}
                    onChange={setAiPerTeam}
                    min={1}
                    styles={{label: {fontWeight: 'bold'}}}
                />

                <Select
                    label="Anzahl K.o.-Runden Teilnehmer:"
                    value={totalKoParticipants}
                    onChange={setTotalKoParticipants}
                    data={[
                        {value: "2", label: "2 (Nur Finale)"},
                        {value: "4", label: "4 (ab Halbfinale)"},
                        {value: "8", label: "8 (ab Viertelfinale)"},
                        {value: "16", label: "16 (ab Achtelfinale)"},
                        {value: "32", label: "32 (ab Sechzehntelfinale)"}
                    ]}
                    styles={{label: {fontWeight: 'bold'}}}
                />

                {!hasEnoughTeams && (
                    <Text c="red" mt="sm">
                        Achtung: Du hast nur {totalTeams} Teams, brauchst aber {koParts} für das K.o.-System!
                    </Text>
                )}

                <Button
                    type="submit"
                    disabled={!isFormValid}
                    color={isFormValid ? 'blue' : 'gray'}
                    mt="xs"
                >
                    Turnier speichern
                </Button>
            </Stack>
        </form>
    );
}