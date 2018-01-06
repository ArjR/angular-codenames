import { createServer, Server } from 'http';
import * as express from 'express';
import * as socketIo from 'socket.io';

import { Message, User } from './model';
import { chatServerPort } from "./config";

export class ChatServer {
    private app: express.Application;
    private server: Server;
    private io: SocketIO.Server;
    private port: string | number;
    private numClients: number = 0;
    private users: User[] = [];

    constructor() {
        this.createApp();
        this.config();
        this.createServer();
        this.sockets();
        this.listen();
    }

    private createApp(): void {
        this.app = express();
    }

    private createServer(): void {
        this.server = createServer(this.app);
    }

    private config(): void {
        this.port = process.env.PORT || chatServerPort;
    }

    private sockets(): void {
        this.io = socketIo(this.server);
    }

    private listen(): void {
        this.server.listen(this.port, () => {
            console.log('Running server on port %s', this.port);
        });

        this.io.on('connect', (socket: SocketIO.Socket) => {

            // New client connection and client count
            this.numClients++;
            this.io.emit('stats', { numClients: this.numClients });

            console.log('New Connection: %s on port %s.', this.getClientName(socket), this.port);
            console.log('Total Clients: %s', this.numClients);

            socket.on('message', (m: Message) => {
                console.log('[server](message): %s', JSON.stringify(m));
                this.io.emit('message', m);
            });

            socket.on('disconnect', () => {
                console.log('Client disconnected');
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

    public getApp(): express.Application {
        return this.app;
    }
}