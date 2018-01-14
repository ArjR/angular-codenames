import * as http from 'http';
import * as express from 'express';
import * as socketIo from 'socket.io';

import { User, Message, GameCommand } from './model/game-classes';
import { serverPort } from './config';
import { RandomWordService } from './services/random-word.service';

export class ChatServer {
    private server: http.Server;
    private io: SocketIO.Server;
    private port: string | number;
    private numClients: number = 0;
    private users: User[] = [];
    private randomWordService: RandomWordService = new RandomWordService();

    constructor(
        server: http.Server
    ) {
        this.config();
        this.createServer(server);
        this.sockets();
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

    private listen(): void {
        this.server.listen(this.port, () => {
            console.log('Running server on port %s\n', this.port);
        });

        this.io.on('connect', (socket: SocketIO.Socket) => {

            // New client connection and client count
            this.clientConnected(socket);

            socket.on(GameCommand.AUTHENTICATE, () => {
                // Placeholder
            });

            socket.on(GameCommand.LOGIN, () => {
                // Placeholder
            });

            socket.on(GameCommand.LOGOUT, () => {
                // Placeholder
            });

            socket.on(GameCommand.NEW_GAME, () => {
                // Placeholder
            });

            socket.on(GameCommand.GENERATE_WORDS, () => {
                // Placeholder
            });

            socket.on(GameCommand.GENERATE_WORD, () => {
                // Placeholder
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
            });
        });
    }

    private getClientName(socket: SocketIO.Socket): string {
        var currentUser: User;
        this.users.forEach(user => {
            if (user.socketId == socket.id)
                currentUser = user;
        });

        if (currentUser) {
            return 'User ' + currentUser.userName + ' (' + currentUser.socketId + ')'
        } else {
            return 'Client (' + socket.id + ')'
        }
    }

    private clientConnected(socket: SocketIO.Socket) {
        this.numClients++;

        // To All Clients
        this.logAndGameDebug(new Message(Date.now(), `[Connected]: ${this.getClientName(socket)} on port ${this.port}`));
        this.logAndGameDebug(new Message(Date.now(), `[Stats] Total Clients: ${this.numClients}`));

        // To Client
        let testMessage: Message = new Message(Date.now(), '--------------------LOGGED IN---------------------');
        socket.emit(GameCommand.GAME_DEBUG, testMessage);
    }

    private clientDisconnected(socket: SocketIO.Socket) {
        this.numClients--;
        this.logAndGameDebug(new Message(Date.now(), `[Disconnected]: ${this.getClientName(socket)}`));
    }

    private logAndGameDebug(message: Message) {
        console.log(message.content);
        this.io.emit(GameCommand.GAME_DEBUG, message);
    }
}