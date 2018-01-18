import * as http from 'http';
import * as express from 'express';
import * as socketIo from 'socket.io';
import * as _ from 'lodash';

import { User, Message, GameCommand, GameSetup, GameData, ClientPackage, UserType, GuidGenerator, Card } from './model/game-classes';
import { serverPort } from './config';
import { RandomWordService } from './services/random-word.service';

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
                    socket.emit(GameCommand.AUTHENTICATED, new ClientPackage(this.gameData, currentUser));
                } else {
                    socket.emit(GameCommand.AUTHENTICATED, new ClientPackage(this.gameData));
                }
            });

            socket.on(GameCommand.LOGIN, (userType: UserType) => {
                let newUser: User = this.loginAndCreateNewUser(userType, socket);

                if (newUser) {
                    socket.emit(GameCommand.AUTHENTICATED, new ClientPackage(this.gameData, newUser));
                    this.io.emit(GameCommand.GAME_STATUS, new ClientPackage(this.gameData)); // Probably dont need to resend to specific client
                } else {
                    socket.emit(GameCommand.AUTHENTICATED, new ClientPackage(this.gameData));
                }
            });

            socket.on(GameCommand.LOGOUT, () => {
                let sendToAll = this.removeCurrentUser(socket);

                socket.emit(GameCommand.AUTHENTICATED, new ClientPackage(this.gameData));

                if (sendToAll) {
                    this.io.emit(GameCommand.GAME_STATUS, new ClientPackage(this.gameData))
                };
            });

            socket.on(GameCommand.NEW_GAME, () => {
                if (this.isCurrentUserLeader(socket)) {
                    this.gameData.id = new GuidGenerator().newGuid();
                    this.gameData.currentRound = 0;
                    this.gameData.currentTeam = null;

                    this.createCards();
                    this.generateNewWords();

                    this.io.emit(GameCommand.GAME_STATUS, new ClientPackage(this.gameData))
                    console.log(this.gameData);
                }
            });

            socket.on(GameCommand.GENERATE_WORDS, () => {
                if (this.isCurrentUserLeader(socket) && this.gameData.currentRound == 0) {
                    this.generateNewWords();

                    this.io.emit(GameCommand.GAME_STATUS, new ClientPackage(this.gameData))
                    console.log(this.gameData);
                }
            });


            // `CLIENT SEND` *GenerateWord (id: number)*
            // #Check command is Leader UserType and GameData(Round == 0)
            // Server will adjust GameData:
            //                 cards: random specific card id
            // `SERVER SEND ALL` *GameStatus (GameData)*


            this.createCards();
            this.generateNewWords();
            console.log(this.gameData.cards[5]);
            this.generateNewWord(5);
            console.log(this.gameData.cards[5]);
            this.generateNewWord(5);
            console.log(this.gameData.cards[5]);
            this.generateNewWord(5);
            console.log(this.gameData.cards[5]);
            this.generateNewWord(5);
            console.log(this.gameData.cards[5]);
            this.generateNewWord(5);
            console.log(this.gameData.cards[5]);

            socket.on(GameCommand.GENERATE_WORD, (id: number) => {
                if (this.isCurrentUserLeader(socket) && this.gameData.currentRound == 0) {
                    this.generateNewWord(id);

                    this.io.emit(GameCommand.GAME_STATUS, new ClientPackage(this.gameData))
                    console.log(this.gameData);
                }
            });

            socket.on(GameCommand.GENERATE_MAP, () => {
                // Placeholder
            });

            socket.on(GameCommand.START_GAME, () => {
                // Placeholder
            });

            socket.on(GameCommand.SEND_HINT, () => {
                // Placeholder
            });

            socket.on(GameCommand.GUESS_CARD, () => {
                // Placeholder
            });

            socket.on(GameCommand.PICK_CARD, () => {
                // Placeholder
            });

            socket.on(GameCommand.NEXT_ROUND, () => {
                // Placeholder
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
    }

    private generateNewWord(id: number): void {
        let randomWords: string[] = [];
        let keepSearching = true;
        let oldCard: Card = null;

        this.gameData.cards.forEach(card => {
            if (card.id == id) oldCard = card;

            randomWords.push(card.word);
        });

        while (keepSearching) {
            let newWord = this.randomWordService.getRandomOfficialWord();
            if (!_.find(randomWords, word => word == newWord)) {
                if (oldCard.word != newWord) {
                    oldCard.word = newWord;
                    keepSearching = false;
                }
            }
        }        
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
    }

    private logAndGameDebug(message: Message): void {
        console.log(message.content);
        this.io.emit(GameCommand.GAME_DEBUG, message);
    }
}