import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable'
import { Socket } from 'ng-socket-io';
import { Message, GameCommand } from '../../../server/model/game-classes';

@Injectable()
export class SocketService {

    constructor(
        private socket: Socket) {
        socket.connect();
    }

    getGameDebug() {
        return this.socket
            .fromEvent<Message>(GameCommand.GAME_DEBUG)
            .map(data => data);
    }

    sendGameDebug(msg: Message) {
        this.socket
            .emit(GameCommand.GAME_DEBUG, msg);
    }

    disconnect() {
        this.socket.disconnect();
    }
}