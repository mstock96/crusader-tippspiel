import type {Game, Group, KnockoutRound, Tournament} from "../types/types.ts";

/**
 * Iterates through a copied tournament state to extract a specific match object reference based on the current active UI tab location.
 * @param clonedTournament The duplicate state object being manipulated.
 * @param tabId String identifier specifying whether the game resides inside a specific group or knockout stage.
 * @param gameId Target game identifier to seek out.
 */
export const findGameInClone = (clonedTournament: Tournament, tabId: string, gameId: number) => {
    if (tabId.startsWith('GROUP_')) {
        const groupIdStr = tabId.replace('GROUP_', '').split('_')[0];
        const groupId = parseInt(groupIdStr);
        return clonedTournament.groups?.find(g => g.id === groupId)?.games.find(ga => ga.id === gameId);
    }
    if (tabId.startsWith('KO_')) {
        const koRoundId = parseInt(tabId.replace('KO_', ''));
        return clonedTournament.knockoutRounds?.find(kr => kr.id === koRoundId)?.games.find(ga => ga.id === gameId);
    }
    return undefined;
}

/**
 * Assesses whether all initial phase group matches have successfully resolved an outcome score.
 * @param tournament Master context to query group matches from.
 * @returns true if every initialized match within every generated group evaluates to played.
 */
export const areAllGroupsFinished = (tournament: Tournament | null): boolean => {
    if (!tournament || !tournament.groups || tournament.groups.length === 0) return false;
    return tournament.groups.every((group: Group) =>
        group.games.every((game: Game) => game.played)
    );
}

/**
 * Checks whether an intermediate subset tournament tier (Knockout Round) has fully resolved its internal matchups.
 * @param tournament Master context parsing the knockout hierarchy.
 * @param koRoundId Database ID indicating the tier subset to monitor.
 * @returns true if every scheduled permutation inside the specified stage evaluates to played.
 */
export const isCurrentKoRoundFinished = (tournament: Tournament | null, koRoundId: number): boolean => {
    if (!tournament || !tournament.knockoutRounds) return false;
    const round = tournament.knockoutRounds.find((kr: KnockoutRound) => kr.id === koRoundId);
    if (!round || !round.games || round.games.length === 0) return false;
    return round.games.every((game: Game) => game.played);
};

/**
 * Interprets contextual state locks denying user intervention on passed segments depending on progress boundaries.
 * Enforces rule sequences like barring retroactive group changes if knockouts are already generated.
 * @param tournament Associated primary context mapping timeline triggers.
 * @param activeTabId Viewport string matching the specific tier requiring assessment.
 * @returns true if the requested scope is sealed and inputs should disable.
 */
export const isPhaseLocked = (tournament: Tournament | null, activeTabId: string | null): boolean => {
    if (!tournament) return false;
    if (tournament.finished) return true;

    if (activeTabId?.startsWith('GROUP_') && tournament.knockoutRounds && tournament.knockoutRounds.length > 0) {
        return true;
    }

    if (activeTabId?.startsWith('KO_')) {
        const currentRoundId = parseInt(activeTabId.replace('KO_', ''));
        const roundIndex = tournament.knockoutRounds?.findIndex(kr => kr.id === currentRoundId);

        if (roundIndex !== undefined && roundIndex !== -1 && tournament.knockoutRounds && roundIndex < tournament.knockoutRounds.length - 1) {
            return true;
        }
    }
    return false;
};

/**
 * Determines mathematically if the generated bracket structure has terminated onto its final tier (Finals/Third Place).
 * @param t Contextual representation of the tournament layout parameters.
 * @returns true if future bracket partitioning requests should conclude.
 */
export const checkIfLastRound = (t: Tournament | null): boolean => {
    if (!t || !t.knockoutRounds || t.knockoutRounds.length === 0) return false;
    if (t.knockoutRounds.length === 1 && t.knockoutRounds[0].games.length === 1) return true;

    if (t.knockoutRounds.length > 1) {
        const rounds = t.knockoutRounds;
        const lastRoundGames = rounds[rounds.length - 1].games.length;
        const secondToLastGames = rounds[rounds.length - 2].games.length;
        return (lastRoundGames === 1 || lastRoundGames === secondToLastGames);
    }
    return false;
}

/**
 * Sorts and isolates only the match objects contextually active against the requested frontend tab id.
 * Handles the logic router segmenting subset matches across groups or playoff splits.
 * @param tournament Original tournament aggregate container.
 * @param activeTabId Identification map matching what structural section to filter out.
 */
export const getActiveGames = (tournament: Tournament | null, activeTabId: string | null): Game[] => {
    if (!tournament || !activeTabId) return [];

    if (activeTabId.startsWith('GROUP_')) {
        const groupIdStr = activeTabId.replace('GROUP_', '').split('_')[0];
        const groupId = parseInt(groupIdStr);
        const activeGroup = tournament.groups?.find((g: Group) => g.id === groupId);
        return activeGroup && activeGroup.games ? activeGroup.games : [];
    } else if (activeTabId.startsWith('KO_')) {
        const koRoundId = parseInt(activeTabId.replace('KO_', ''));
        const activeKoRound = tournament.knockoutRounds?.find((kr: KnockoutRound) => kr.id === koRoundId);
        return activeKoRound && activeKoRound.games ? activeKoRound.games : [];
    }
    return [];
}