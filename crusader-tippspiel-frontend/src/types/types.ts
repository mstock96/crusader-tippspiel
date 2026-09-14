/** Defines the core aggregate structure wrapping a full tournament workflow mapping groups, rounds, and outcomes. */
export interface Tournament {
    id?: number;
    name: string;
    finished: boolean;
    started: boolean;
    numberOfGroups: number;
    teamsPerGroup: number;
    aiPerTeam: number;
    totalKoParticipants: number;
    groups?: Group[];
    knockoutRounds?: KnockoutRound[];
    winner?: Team;
    second?: Team;
    third?: Team;
}

/** Logical structure wrapping subset standings and initializing seed matches prior to playoff integrations. */
export interface Group {
    id: number;
    name: string;
    teams: Team[];
    games: Game[];
}

/** Discrete sequential tier spanning tournament phase progressions containing constrained matchup pairings. */
export interface KnockoutRound {
    id: number;
    name: string;
    games: Game[];
}

/** Granular match encapsulation pairing two entities together parsing scores alongside progression tracking identifiers. */
export interface Game {
    id: number;
    team1: Team;
    team2: Team;
    team1Kills: number;
    team2Kills: number;
    played: boolean;
    knockout: boolean;
}

/** Relational entity grouping specific members under singular competitive alignments analyzing aggregate success rates. */
export interface Team {
    id: number;
    wins: number;
    losses: number;
    ties: number;
    kills: number;
    members: Member[];
}

/** Base dictionary identifying singular AI instances universally allocated across disparate tournament iterations. */
export interface Member {
    id: number;
    name: string;
}

/** Projected layout mapping contextual live positional evaluation representing standing values inside active groups. */
export interface GroupStandingDto {
    team: Team;
    points: number;
    wins: number;
    losses: number;
    ties: number;
    kills: number;
}

/** Simplified projection mapping aggregate points bound directly to a user for competitive leaderboard sorting. */
export interface LeaderboardRowDto {
    userName: string;
    groupPoints: number;
    podiumPoints: number;
    totalPoints: number;
}

/** Structured tree committing user forecasting linking relational positions inside distinct subsets against bracket resolutions. */
export interface Prediction {
    id?: number;
    groupPoints: number;
    podiumPoints: number;
    totalPoints: number;
    winner: Team;
    second: Team;
    third: Team | null;
    groupTips: GroupTip[];
}

/** Singular relational entry forecasting final ranking sequence belonging explicitly to a singular tracked group entity. */
export interface GroupTip {
    id?: number;
    team: Team;
    predictedPosition: number;
}

/** Reduced contextual snapshot querying explicit ranking data stripping massive relational weights off predictions. */
export interface PredictionShortFormDto {
    username: string;
    groupPoints: number;
    podiumPoints: number;
    totalPoints: number;
    winner: string;
    second: string;
    third: string;
    groupTips: GroupTipShortFormDto[];
}

/** Minified group position reference passing strings dynamically to frontends abstracting deep entity tracking. */
export interface GroupTipShortFormDto {
    teamName: string;
    predictedPosition: number;
}

/** Overhead dictionary evaluating broad configuration markers parsing basic routing accessibility. */
export interface TournamentInfoDto {
    id: number;
    name: string;
    finished: boolean;
    started: boolean;
    numberOfGroups: number;
    teamsPerGroup: number;
    aiPerTeam: number;
    totalKoParticipants: number;
}