import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable'
import { Socket } from 'ng-socket-io';

@Injectable()
export class ChatService {

    constructor(
        private socket: Socket) {
            socket.connect();
         }

    getMessage() {
        return this.socket
            .fromEvent<any>("message")
            .map(data => data);
    }

    sendMessage(msg: string) {
        this.socket
            .emit("message", msg);
    }

    disconnect(){
        this.socket.disconnect();
    }
}