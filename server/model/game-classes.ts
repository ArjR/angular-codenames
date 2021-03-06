export enum Team {
    Red,
    Blue
}

export enum UserType {
    RedLeader,
    BlueLeader,
    RedUser,
    BlueUser,
    Spectator
}

export enum CardType {
    RedCard,
    BlueCard,
    AssassinCard,
    InnocentCard
}

export class GameCommand {
    static AUTHENTICATE: string = 'Authenticate'; // Rejoined connection / timeout will validate           [Client-Server]  <--
    static LOGIN: string = 'Login'; // New connection will pick a UserType given from GameData             [Client-Server]  <--
    static AUTHENTICATED: string = 'Authenticated'; // Server will allocate the User if UserType available [Server-Client]  -->
    static LOGOUT: string = 'Logout'; // Authenticated user will log out freeing a potential UserType      [Client-Server]  <--
    static GAME_STATUS: string = 'GameStatus'; // Sends the GameData to all connections                    [Server-Clients] -->> (Upon any new connections and server)
    static NEW_GAME: string = 'NewGame'; // Will start a new game and spymasters                           [Client-Server]  <--
    static GENERATE_WORDS: string = 'GenerateWords'; // Spymasters can re-generate all words               [Client-Server]  <--
    static GENERATE_WORD: string = 'GenerateWord'; // Spymasters can re-generate a single word             [Client-Server]  <--
    static GENERATE_MAP: string = 'GenerateMap'; // Spymasters can re-generate the map (and starting team) [Client-Server]  <--
    static START_GAME: string = 'StartGame'; // Spymasters can start the game to RedUsers and BlueUsers    [Client-Server]  <--
    static SEND_HINT: string = 'SendHint'; // Team Spymaster can send hint to Team Users                   [Client-Server]  <--
    static GUESS_CARD: string = 'GuessCard'; // Team Users can inform others of a card                     [Client-Server]  <--
    static PICK_CARD: string = 'PickCard'; // Team Spymaster can pick the card, and update game            [Client-Server]  <--
    static NEXT_ROUND: string = 'NextRound'; // Team Spymaster can choose to goto next round               [Client-Server]  <--
    static GAME_DEBUG: string = 'GameDebug'; // Additional errors                                          [Clients-Server] <<-->>
}

export class Hint {
    word: string = null;
    number: number = 0;
}

export class Card {
    id: number = 0;
    word: string = null;
    cardType: CardType = null;
    isPlayed: boolean = false;
}

export class User {
    socketId: string = null;
    userName: string = null;
    userType: UserType = null;
}

export class GameInitialise {
    totalCardCount: number = 25; // Total number of words
    firstTeamCardCount: number = 9;
    secondTeamCardCount: number = 8;
    assassinCardCount: number = 1;
    innocentCardCount: number = 7;

    users: User[] = [];
}

export class GameData {
    id: string = null; // Random guid
    cards: Card[] = [];

    isRedLeaderAvailable: boolean = false;
    isBlueLeaderAvailable: boolean = false;

    currentCommand: GameCommand = null;
    currentRound: number = 0; // 0 - New Game, 1 - First Round
    currentTeam: Team = null;
}

export class Message {
    constructor(
        public timestamp: number,
        public content: string
    ) { }
}