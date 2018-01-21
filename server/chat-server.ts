import * as http from 'http';
import * as express from 'express';
import * as socketIo from 'socket.io';
import * as _ from 'lodash';

import { User, Message, GameCommand, GameSetup, GameData, ClientPackage, UserType, CardType, Team, Card, GuidGenerator } from './model/game-classes';
import { serverPort } from './config';
import { RandomWordService } from './services/random-word.service';
import { isContext } from 'vm';

export class ChatServer {
    private server: http.Server;
    private io: SocketIO.Server;
    private port: string | number;
    private numClients: number = 0;
    private randomWordService: RandomWordService = new RandomWordService();
    private gameSetup: GameSetup;
    private gameData: GameData;

    constructor(
        server: http.Server
    ) {
        this.config();
        this.createServer(server);
        this.sockets();

        this.createGame();
        this.listen();
    }

    private config(): void {
        this.port = process.env.PORT || serverPort;
    }

    private createServer(server: http.Server): void {
        this.server = server;
    }

    private sockets(): void {
        this.io = socketIo(this.server);
    }

    private createGame(): void {
        this.gameSetup = new GameSetup();
        this.gameData = new GameData();
    }

    private listen(): void {
        this.server.listen(this.port, () => {
            console.log('Running server on port %s\n', this.port);
        });

        this.io.on('connect', (socket: SocketIO.Socket) => {

            // New client connection and client count
            this.clientConnected(socket);

            socket.on(GameCommand.AUTHENTICATE, () => {
                let currentUser = this.getCurrentUser(socket);

                if (currentUser) {
                    socket.emit(GameCommand.AUTHENTICATED, new ClientPackage(this.gameData, currentUser)); // Send to Client
                } else {
                    socket.emit(GameCommand.AUTHENTICATED, new ClientPackage(this.gameData)); // Send to Client
                }
            });

            socket.on(GameCommand.LOGIN, (userType: UserType) => {
                let newUser: User = this.loginAndCreateNewUser(userType, socket);

                if (newUser) {
                    socket.emit(GameCommand.AUTHENTICATED, new ClientPackage(this.gameData, newUser)); // Send to Client
                    socket.broadcast.emit(GameCommand.GAME_STATUS, new ClientPackage(this.gameData)); // Send to ALL - EXCEPT Client
                } else {
                    socket.emit(GameCommand.AUTHENTICATED, new ClientPackage(this.gameData)); // Send to Client
                }
            });

            socket.on(GameCommand.LOGOUT, () => {
                let sendToAll = this.removeCurrentUser(socket);

                socket.emit(GameCommand.AUTHENTICATED, new ClientPackage(this.gameData)); // Send to Client

                if (sendToAll) {
                    this.io.emit(GameCommand.GAME_STATUS, new ClientPackage(this.gameData)) // Send to ALL
                };
            });

            socket.on(GameCommand.NEW_GAME, () => {
                if (this.isCurrentUserLeader(socket)) {
                    this.gameData.id = new GuidGenerator().newGuid();
                    this.gameData.currentCommand = GameCommand.NEW_GAME;
                    this.gameData.currentRound = 0;
                    this.gameData.currentTeam = null;

                    this.createCards();
                    this.generateNewWords();

                    this.io.emit(GameCommand.GAME_STATUS, new ClientPackage(this.gameData)) // Send to ALL
                    this.logGameData();
                }
            });

            socket.on(GameCommand.GENERATE_WORDS, () => {
                if (this.isCurrentUserLeader(socket) && this.gameData.currentRound == 0) {
                    this.gameData.currentCommand = GameCommand.GENERATE_WORDS;
                    this.generateNewWords();

                    this.io.emit(GameCommand.GAME_STATUS, new ClientPackage(this.gameData)) // Send to ALL
                }
            });

            socket.on(GameCommand.GENERATE_WORD, (id: number) => {
                if (this.isCurrentUserLeader(socket) && this.gameData.currentRound == 0) {
                    this.gameData.currentCommand = GameCommand.GENERATE_WORD;
                    this.generateNewWord(id);

                    this.io.emit(GameCommand.GAME_STATUS, new ClientPackage(this.gameData)) // Send to ALL
                }
            });

            socket.on(GameCommand.GENERATE_MAP, () => {
                if (this.isCurrentUserLeader(socket) && this.gameData.currentRound == 0) {
                    this.gameData.currentCommand = GameCommand.GENERATE_MAP;
                    this.generateNewMap();

                    this.io.emit(GameCommand.GAME_STATUS, new ClientPackage(this.gameData)) // Send to ALL
                    this.logGameData();
                }
            });

            socket.on(GameCommand.START_GAME, () => {
                if (this.isCurrentUserLeader(socket) && this.gameData.currentRound == 0) {
                    this.gameData.currentCommand = GameCommand.START_GAME;
                    this.gameData.currentRound = 1; // Start game!

                    this.io.emit(GameCommand.GAME_STATUS, new ClientPackage(this.gameData)) // Send to ALL
                    this.logGameData();
                }
            });

            socket.on(GameCommand.SEND_HINT, (hint: string) => {
                if (this.isCurrentUserTeamLeader(socket) && this.gameData.currentRound !== 0) {
                    this.gameData.currentCommand = GameCommand.SEND_HINT;

                    this.io.emit(GameCommand.SEND_HINT, hint) // Send to ALL (Maybe we want 'Send to ALL - EXCEPT Client'?)
                }
            });

            socket.on(GameCommand.GUESS_CARD, (id: number) => {
                if (this.isCurrentUserTeam(socket) && this.gameData.currentRound !== 0) {
                    this.gameData.currentCommand = GameCommand.GUESS_CARD;

                    this.io.emit(GameCommand.GUESS_CARD, id) // Send to ALL (Maybe we want 'Send to ALL - EXCEPT Client'?)
                }
            });

            socket.on(GameCommand.PICK_CARD, (id: number) => {
                if (this.isCurrentUserTeamLeader(socket) && this.gameData.currentRound !== 0) {
                    this.gameData.currentCommand = GameCommand.PICK_CARD;

                    let card = _.find(this.gameData.cards, card => card.id == id);

                    // Check card can be played
                    if (card.isPlayed) {
                        return;
                    }

                    // Play card
                    card.isPlayed = true;

                    // Determine whether card matches current team
                    if ((card.cardType == CardType.RedCard && this.gameData.currentTeam == Team.Red) ||
                        (card.cardType == CardType.BlueCard && this.gameData.currentTeam == Team.Blue)) {
                        // Correct Team Card has been chosen
                        let redCardTotalCount = this.gameData.cards.filter(x => x.cardType == CardType.RedCard).length;
                        let blueCardTotalCount = this.gameData.cards.filter(x => x.cardType == CardType.BlueCard).length;
                        let redCardCount = this.gameData.cards.filter(x => x.cardType == CardType.RedCard && x.isPlayed == true).length;
                        let blueCardCount = this.gameData.cards.filter(x => x.cardType == CardType.BlueCard && x.isPlayed == true).length;

                        if (redCardCount >= redCardTotalCount) {
                            this.gameData.isGameEnded = true;
                            this.gameData.winningTeam = Team.Red;
                        } else if (blueCardCount >= blueCardTotalCount) {
                            this.gameData.isGameEnded = true;
                            this.gameData.winningTeam = Team.Blue;
                        }
                    } else if (card.cardType == CardType.AssassinCard) {
                        // Assassin Card has been chosen
                        this.gameData.isGameEnded = true;
                        this.gameData.winningTeam = this.gameData.currentTeam == Team.Red ? Team.Blue : Team.Red;
                    } else {
                        // Innocent Card has been chosen OR Incorrect Team Card has been chosen
                        this.gameData.currentRound++;
                        this.gameData.currentTeam = this.gameData.currentTeam == Team.Red ? Team.Blue : Team.Red;
                    }

                    this.io.emit(GameCommand.GAME_STATUS, new ClientPackage(this.gameData)) // Send to ALL
                    this.logGameData();
                }
            });

            this.gameData.id = new GuidGenerator().newGuid();
            this.gameData.currentCommand = GameCommand.NEW_GAME;
            this.gameData.currentRound = 0;
            this.gameData.currentTeam = null;
            this.createCards();
            this.generateNewWords();
            this.logGameData();
            this.generateNewWord(5);
            this.generateNewWord(5);
            this.generateNewWord(5);

            this.generateNewMap();
            this.logGameData();
            this.generateNewMap();
            this.logGameData();

            this.gameData.currentRound = 1;
            this.logGameData();

            socket.on(GameCommand.NEXT_ROUND, () => {
                if (this.isCurrentUserTeamLeader(socket) && this.gameData.currentRound !== 0) {
                    this.gameData.currentCommand = GameCommand.NEXT_ROUND;
                    this.gameData.currentRound++;
                    this.gameData.currentTeam = this.gameData.currentTeam == Team.Red ? Team.Blue : Team.Red;

                    this.io.emit(GameCommand.GAME_STATUS, new ClientPackage(this.gameData)) // Send to ALL
                    this.logGameData();
                }
            });

            socket.on(GameCommand.GAME_DEBUG, (message: Message) => {
                let newMessage = `[Message] ${this.getClientName(socket)}: "${message.content}"`
                console.log(newMessage);
                message.content = newMessage;
                this.io.emit(GameCommand.GAME_DEBUG, message);
            });

            socket.on('disconnect', () => {
                this.clientDisconnected(socket);
                let sendToAll = this.removeCurrentUser(socket);

                if (sendToAll) this.io.emit(GameCommand.GAME_STATUS, new ClientPackage(this.gameData));
            });
        });
    }

    private loginAndCreateNewUser(userType: UserType, socket: SocketIO.Socket): User {
        let newUser: User = null;

        if (userType == UserType.RedLeader && this.gameData.isRedLeaderAvailable) {
            this.gameData.isRedLeaderAvailable = false; // Lock

            newUser = new User(socket.id, UserType.RedLeader.toString(), UserType.RedLeader);
            this.gameSetup.users.push(newUser);
        }

        if (userType == UserType.BlueLeader && this.gameData.isBlueLeaderAvailable) {
            this.gameData.isBlueLeaderAvailable = false; // Lock

            newUser = new User(socket.id, UserType.BlueLeader.toString(), UserType.BlueLeader);
            this.gameSetup.users.push(newUser);
        }

        if (userType == UserType.RedUser) {
            newUser = new User(socket.id, UserType.RedUser.toString(), UserType.RedUser);
            this.gameSetup.users.push(newUser);
        }

        if (userType == UserType.BlueUser) {
            newUser = new User(socket.id, UserType.BlueUser.toString(), UserType.BlueUser);
            this.gameSetup.users.push(newUser);
        }

        return newUser;
    }

    private createCards(): void {
        this.gameData.cards = [];

        let i = 0;
        while (this.gameData.cards.length < this.gameSetup.totalCardCount) {
            let card = new Card();
            card.id = i;

            this.gameData.cards.push(card);
            i++;
        }
    }

    private generateNewWords(): void {
        let randomWords: string[] = [];

        while (randomWords.length < this.gameData.cards.length) {
            let newWord = this.randomWordService.getRandomOfficialWord();
            if (!_.find(randomWords, word => word == newWord)) {
                randomWords.push(newWord);
            }
        }

        let i = 0;
        this.gameData.cards.forEach(card => {
            card.word = randomWords[i];
            i++;
        });

        console.log(`🎲  GenerateNewWords [${randomWords}]`);
    }

    private generateNewWord(id: number): void {
        let randomWords: string[] = [];
        let keepSearching = true;
        let oldCard: Card = null;

        this.gameData.cards.forEach(card => {
            if (card.id == id) oldCard = card;

            randomWords.push(card.word);
        });

        let oldWord: string = oldCard.word;

        while (keepSearching) {
            let newWord = this.randomWordService.getRandomOfficialWord();
            if (!_.find(randomWords, word => word == newWord)) {
                if (oldCard.word != newWord) {
                    oldCard.word = newWord;
                    keepSearching = false;
                }
            }
        }

        console.log(`🎲  GenerateNewWord [${oldWord}] with [${oldCard.word}]`);
    }

    private generateNewMap(): void {
        // Wipe current CardTypes
        this.gameData.cards.forEach(card => {
            card.cardType = null;
        });

        // Pick which team starts
        this.gameData.currentTeam = _.sample(this.gameSetup.allTeams);

        let redCardCount = this.gameData.currentTeam == Team.Red ? this.gameSetup.firstTeamCardCount : this.gameSetup.secondTeamCardCount;
        let blueCardCount = this.gameData.currentTeam == Team.Blue ? this.gameSetup.firstTeamCardCount : this.gameSetup.secondTeamCardCount;

        this.gameData.cards.forEach(card => {
            card.cardType = _.sample(this.gameSetup.allCardTypes);
            let isMaxCard = false;

            while (this.gameData.cards.filter(x => x.cardType == CardType.RedCard).length > redCardCount ||
                this.gameData.cards.filter(x => x.cardType == CardType.BlueCard).length > blueCardCount ||
                this.gameData.cards.filter(x => x.cardType == CardType.AssassinCard).length > this.gameSetup.assassinCardCount ||
                this.gameData.cards.filter(x => x.cardType == CardType.InnocentCard).length > this.gameSetup.innocentCardCount) {
                console.log(`❌  Rerolling ${card.word} ${CardType[card.cardType]}`);
                card.cardType = _.sample(this.gameSetup.allCardTypes)

                console.log(`🔘  Rerolled  ${card.word} ${CardType[card.cardType]}`);
            }

            console.log(`✅  Assigned  ${card.word} ${CardType[card.cardType]}`);
        });

        this.gameSetup.allCardTypes.forEach(cardType => {
            console.log(`${CardType[cardType]} Count: ${this.gameData.cards.filter(x => x.cardType == cardType).length}`);
        })
    }

    private getCurrentUser(socket: SocketIO.Socket): User {
        return _.find(this.gameSetup.users, user => user.socketId == socket.id);
    }

    private isCurrentUserLeader(socket: SocketIO.Socket): boolean {
        let currentUser: User = this.getCurrentUser(socket);
        if (!currentUser) return false;

        if (currentUser.userType == UserType.RedLeader || currentUser.userType == UserType.BlueLeader) {
            return true;
        } else {
            return false;
        }
    }

    private isCurrentUserTeamLeader(socket: SocketIO.Socket): boolean {
        let currentUser: User = this.getCurrentUser(socket);
        if (!currentUser) return false;

        if ((currentUser.userType == UserType.RedLeader && this.gameData.currentTeam == Team.Red) ||
            (currentUser.userType == UserType.BlueLeader && this.gameData.currentTeam == Team.Blue)) {
            return true;
        } else {
            return false;
        }
    }

    private isCurrentUserTeam(socket: SocketIO.Socket): boolean {
        let currentUser: User = this.getCurrentUser(socket);
        if (!currentUser) return false;

        if ((currentUser.userType == UserType.RedUser && this.gameData.currentTeam == Team.Red) ||
            (currentUser.userType == UserType.BlueUser && this.gameData.currentTeam == Team.Blue)) {
            return true;
        } else {
            return false;
        }
    }

    private removeCurrentUser(socket: SocketIO.Socket): boolean {
        let currentUser: User = this.getCurrentUser(socket);
        if (!currentUser) return false;

        let sendToAll: boolean = false;

        // Remove UserType if Leader
        if (currentUser.userType == UserType.RedLeader) {
            this.gameData.isRedLeaderAvailable = true;
            sendToAll = true;
        }

        if (currentUser.userType == UserType.BlueLeader) {
            this.gameData.isBlueLeaderAvailable = true;
            sendToAll = true;
        }

        this.gameSetup.users = _.remove(this.gameSetup.users, user => user.socketId == socket.id);

        return sendToAll;
    }

    private getClientName(socket: SocketIO.Socket): string {
        let currentUser: User = this.getCurrentUser(socket);

        if (currentUser) {
            return 'User ' + currentUser.userName + ' (' + currentUser.socketId + ')'
        } else {
            return 'Client (' + socket.id + ')'
        }
    }

    private clientConnected(socket: SocketIO.Socket): void {
        this.numClients++;

        // To All Clients
        this.logAndGameDebug(new Message(Date.now(), `[Connected]: ${this.getClientName(socket)}`));
        this.logAndGameDebug(new Message(Date.now(), `[Stats] Total Clients: ${this.numClients}`));

        // To Client
        let testMessage: Message = new Message(Date.now(), '--------------------LOGGED IN---------------------');
        socket.emit(GameCommand.GAME_DEBUG, testMessage);
    }

    private clientDisconnected(socket: SocketIO.Socket): void {
        this.numClients--;
        this.logAndGameDebug(new Message(Date.now(), `[Disconnected]: ${this.getClientName(socket)}`));
        this.logAndGameDebug(new Message(Date.now(), `[Stats] Total Clients: ${this.numClients}`));
    }

    private logAndGameDebug(message: Message): void {
        console.log(message.content);
        this.io.emit(GameCommand.GAME_DEBUG, message);
    }

    private logGameData() {
        console.log(` \x1b[4m\x1b[42mGameData\x1b[0m`);
        console.log(` \x1b[32m[id]:\x1b[0m ${this.gameData.id}`);
        console.log(` \x1b[32m[Red Leader Available]:\x1b[0m ${this.gameData.isRedLeaderAvailable ? '✅' : '☐'}`);
        console.log(` \x1b[32m[Blue Leader Available]:\x1b[0m ${this.gameData.isBlueLeaderAvailable ? '✅' : '☐'}`);
        console.log(` \x1b[32m[Command]:\x1b[0m ${this.gameData.currentCommand}`);
        console.log(` \x1b[32m[Round]:\x1b[0m ${this.gameData.currentRound}`);
        console.log(` \x1b[32m[Team]:\x1b[0m ${Team[this.gameData.currentTeam]}`);

        // Currently hardcode the GameData as groups of 5 cards
        let i = 0;
        while (i < this.gameData.cards.length) {

            let consoleString: string = '';
            consoleString += ' ' + this.cardString(this.gameData.cards[i]) + ' ';
            consoleString += ' ' + this.cardString(this.gameData.cards[i + 1]) + ' ';
            consoleString += ' ' + this.cardString(this.gameData.cards[i + 2]) + ' ';
            consoleString += ' ' + this.cardString(this.gameData.cards[i + 3]) + ' ';
            consoleString += ' ' + this.cardString(this.gameData.cards[i + 4]) + ' ';

            console.log(consoleString);
            i = i + 5;
        }
    }

    private cardString(card: Card): string {

        let consoleString: string = null;

        switch (card.cardType) {
            case CardType.RedCard:
                consoleString = `\x1b[41m[${card.word}]\x1b[0m`;
                break;
            case CardType.BlueCard:
                consoleString = `\x1b[44m[${card.word}]\x1b[0m`;
                break;
            case CardType.AssassinCard:
                consoleString = `\x1b[4m[${card.word}]\x1b[0m`;
                break;
            case CardType.InnocentCard:
                consoleString = `\x1b[43m[${card.word}]\x1b[0m`;
                break;
            case null:
                consoleString = `[${card.word}]`;
                break;
        }

        return consoleString;
    }
}