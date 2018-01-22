import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable'
import { Socket } from 'ng-socket-io';
import { Message, GameCommand, ClientPackage, UserType } from '../../../server/model/game-classes';

@Injectable()
export class SocketService {

    constructor(
        private socket: Socket) {
        socket.connect();
    }

    sendAuthenticate() {
        console.log('SEND GameCommand.AUTHENTICATE');
        this.socket
            .emit(GameCommand.AUTHENTICATE);
    }

    receiveAuthenticated() {
        return this.socket
            .fromEvent<ClientPackage>(GameCommand.AUTHENTICATED)
            .map(data => data);
    }

    sendLogin(userType: UserType) {
        console.log('SEND GameCommand.LOGIN', UserType[userType]);
        this.socket
            .emit(GameCommand.LOGIN, userType);
    }

    receiveGameStatus() {
        return this.socket
            .fromEvent<ClientPackage>(GameCommand.GAME_STATUS)
            .map(data => data);
    }

    sendLogout() {
        console.log('SEND GameCommand.LOGOUT');
        this.socket
            .emit(GameCommand.LOGOUT);
    }

    sendNewGame() {
        console.log('SEND GameCommand.NEW_GAME');
        this.socket
            .emit(GameCommand.NEW_GAME);
    }

    sendGenerateWords() {
        console.log('SEND GameCommand.GENERATE_WORDS');
        this.socket
            .emit(GameCommand.GENERATE_WORDS);
    }

    sendGenerateWord(id: number) {
        console.log('SEND GameCommand.GENERATE_WORD', id);
        this.socket
            .emit(GameCommand.GENERATE_WORD, id);
    }

    sendGenerateMap() {
        console.log('SEND GameCommand.GENERATE_MAP');
        this.socket
            .emit(GameCommand.GENERATE_MAP);
    }

    sendStartGame() {
        console.log('SEND GameCommand.START_GAME');
        this.socket
            .emit(GameCommand.START_GAME);
    }

    sendSendHint(hint: string) {
        console.log('SEND GameCommand.SEND_HINT', hint);
        this.socket
            .emit(GameCommand.SEND_HINT, hint);
    }

    receiveSendHint() {
        return this.socket
            .fromEvent<string>(GameCommand.SEND_HINT)
            .map(hint => hint);
    }

    sendGuessCard(id: number) {
        console.log('SEND GameCommand.GUESS_CARD', id);
        this.socket
            .emit(GameCommand.GUESS_CARD, id);
    }

    sendPickCard(id: number) {
        console.log('SEND GameCommand.PICK_CARD', id);
        this.socket
            .emit(GameCommand.PICK_CARD, id);
    }

    sendNextRound() {
        console.log('RECEIVE GameCommand.NEXT_ROUND');
        this.socket
            .emit(GameCommand.NEXT_ROUND);
    }

    sendGameDebug(msg: Message) {
        this.socket
            .emit(GameCommand.GAME_DEBUG, msg);
    }

    receiveGameDebug() {
        return this.socket
            .fromEvent<Message>(GameCommand.GAME_DEBUG)
            .map(msg => msg);
    }

    disconnect() {
        this.socket.disconnect();
    }
}