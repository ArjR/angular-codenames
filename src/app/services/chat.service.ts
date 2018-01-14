import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable'
import { Socket } from 'ng-socket-io';
import { Message } from '../../../server/model';

@Injectable()
export class ChatService {

    constructor(
        private socket: Socket) {
        socket.connect();
    }

    getMessage() {
        return this.socket
            .fromEvent<Message>("message")
            .map(data => data);
    }

    sendMessage(msg: Message) {
        this.socket
            .emit("message", msg);
    }

    disconnect() {
        this.socket.disconnect();
    }
}