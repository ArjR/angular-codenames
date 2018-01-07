import * as http from "http";
import * as express from 'express';
import * as socketIo from 'socket.io';

import { Message, User } from './model';
import { serverPort } from "./config";

export class ChatServer {
    private server: http.Server;
    private io: SocketIO.Server;
    private port: string | number;
    private numClients: number = 0;
    private users: User[] = [];

    constructor(server: http.Server) {
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
            console.log('Running server on port %s', this.port);
        });

        this.io.on('connect', (socket: SocketIO.Socket) => {

            // New client connection and client count
            this.numClients++;
            this.logAndEmitMessage(new Message(new Date(), `[Connected]: ${this.getClientName(socket)} on port ${this.port}`));
            this.logAndEmitMessage(new Message(new Date(), `[Stats] Total Clients: ${this.numClients}`));

            socket.on('message', (m: Message) => {

                let messageTimestamp = new Date(m.timestamp);
                let serverTimestamp = new Date();
                let delta = serverTimestamp.getTime() - messageTimestamp.getTime();
                let newMessage = `[Message] ${this.getClientName(socket)}: "${m.content}" Delta is ${delta}`
                console.log(newMessage);
                m.content = newMessage;
                this.io.emit('message', m);
            });

            socket.on('disconnect', () => {
                this.numClients--;
                this.logAndEmitMessage(new Message(new Date(), `[Disconnected]: ${this.getClientName(socket)}`));
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

    private logAndEmitMessage(message: Message) {
        console.log(message.content);
        this.io.emit('message', message);
    }
}