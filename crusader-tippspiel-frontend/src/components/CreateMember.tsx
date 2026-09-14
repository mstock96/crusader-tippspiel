import {useEffect, useState} from "react";
import type {Member} from "../types/types.ts";
import {fetchWithAuth} from "../api/api.ts";
import {Button, Stack, TextInput} from '@mantine/core';
import {notifications} from '@mantine/notifications';

/**
 * Component for creating and adding a new AI member (player) to the database.
 * Provides a simple form to register a name and prevents duplicates checking against existing members.
 */
export default function CreateMember() {
    const [members, setMembers] = useState<Member[]>([]);
    const [name, setName] = useState('');

    /**
     * Fetches the list of existing members from the backend when the component mounts.
     * This list is used to check for duplicate names before adding a new member.
     */
    useEffect(() => {
        fetchWithAuth('/members')
            .then(res => res.json())
            .then(data => setMembers(data))
            .catch(err => console.error("Keine Antwort vom Backend:", err));
    }, []);

    /**
     * Handles the form submission to register a newly created member.
     * Prompts for confirmation, checks the local state for duplicates, updates the UI optimistically,
     * and synchronizes the created member with the backend.
     * @param e The form submission event.
     */
    const handleAddMember = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const isConfirmed = window.confirm("Möchtest du diese KI wirklich hinzufügen?");

        if (!isConfirmed) {
            return;
        }

        const exists = members.some(m => m.name.toLowerCase() === name.toLowerCase());
        if (exists) {
            notifications.show({message: "Diesen Spieler gibt es bereits!", color: "red"});
            return;
        }

        const tmpMember: Member = {
            id: -Date.now(),
            name: name
        };
        console.log(tmpMember.name);

        setMembers(prevMembers => [...prevMembers, tmpMember]);

        setName('');
        console.log(name);
        console.log(JSON.stringify(tmpMember.name));
        fetchWithAuth('/members', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: tmpMember.name
        })
            .then(res => res.json())
            .then(newDBEntry => {
                setMembers(prevMembers => prevMembers.map(m => m.id === tmpMember.id ? newDBEntry : m)
                );
            })
            .catch(err => {
                console.error("Keine Antwort vom Backend:", err);
                setMembers(prevMembers => prevMembers.filter(m => m.id !== tmpMember.id));
                notifications.show({message: "Speichern fehlgeschlagen. Spieler wurde wieder entfernt.", color: "red"});
            });
    };

    const isFormValid = name.trim() !== '';

    return (
        <form onSubmit={handleAddMember}>
            <Stack>
                <TextInput
                    label="Name der neuen KI:"
                    value={name}
                    onChange={(e) => setName(e.currentTarget.value)}
                    required
                    styles={{
                        label: {marginBottom: '5px', fontWeight: 'bold'}
                    }}
                />

                <Button
                    type="submit"
                    disabled={!isFormValid}
                >
                    KI hinzufügen
                </Button>
            </Stack>
        </form>
    );
}