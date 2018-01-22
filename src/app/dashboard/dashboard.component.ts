import { Component, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Subscription } from "rxjs";
import { Observable } from 'rxjs/Observable';
import { TimerObservable } from "rxjs/observable/TimerObservable";

import { SocketService } from '../services/socket.service';
import { Message, GameCommand, ClientPackage, UserType, User, GameData, CardType, Card } from '../../../server/model/game-classes';
import { ToasterService, Toast } from 'angular2-toaster';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { ToasterConfig } from 'angular2-toaster/src/toaster-config';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  providers: [SocketService]
})
export class DashboardComponent {
  @ViewChild('userModal') userModal: ModalDirective; // ngx-bootstrap modal
  UserType = UserType; // To use Enum for Angular markup
  CardType = CardType; // To use Enum for Angular markup

  form: FormGroup;

  private receiveAuthenticatedSubscription: Subscription;
  private receiveGameStatusSubscription: Subscription;
  private receiveSendHintSubscription: Subscription;
  private receiveGameDebugSubscription: Subscription;

  user: User = null;
  gameData: GameData = null;

  sendGameDebugSubscription: Subscription;

  modalConfig = {
    animated: true,
    backdrop: 'static',
    ignoreBackdropClick: true,
  };

  constructor(
    private fb: FormBuilder,
    private socketService: SocketService,
    private toasterService: ToasterService) {

    this.form = fb.group({
      text: ['', Validators.required],
      name: ['', Validators.required]
    });
  }

  ngOnInit() {
    // Initialise Inbound Events
    this.receiveAuthenticatedSubscription = this.socketService
      .receiveAuthenticated()
      .subscribe(clientPackage => {
        console.log('RECEIVE GameCommand.AUTHENTICATED', clientPackage);
        this.user = clientPackage.user;
        this.gameData = clientPackage.gameData;

        if (this.user) {
          this.hideUserModal();
        } else {
          this.showUserModal();
        }
      });
    this.receiveGameStatusSubscription = this.socketService
      .receiveGameStatus()
      .subscribe(clientPackage => {
        console.log('RECEIVE GameCommand.GAME_STATUS', clientPackage);
        this.gameData = clientPackage.gameData;
      });
    this.receiveSendHintSubscription = this.socketService
      .receiveSendHint()
      .subscribe(hint => {
        console.log('RECEIVE GameCommand.SEND_HINT', hint);
        this.popHint(hint);
      });
    this.receiveGameDebugSubscription = this.socketService
      .receiveGameDebug()
      .subscribe(message => {
        console.log('RECEIVE GameCommand.GAME_DEBUG');
        this.popGameDebug(message);
      });

    let timer = TimerObservable.create(0, 10000);
    this.sendGameDebugSubscription = timer.subscribe(t => {
      let message: Message = new Message(Date.now(), 'Message generated');
      this.socketService.sendGameDebug(message);
    });

    // Initialise first Outbound Event
    this.socketService.sendAuthenticate();
  }

  public callLogin(userType: UserType) {
    this.socketService.sendLogin(userType);
  }

  public callLogout() {
    this.socketService.sendLogout();
  }

  public callNewGame() {
    this.socketService.sendNewGame();
  }

  public callGenerateWords() {
    this.socketService.sendGenerateWords();
  }

  public callGenerateWord(id: number) {
    this.socketService.sendGenerateWord(id);
  }

  public callGenerateMap() {
    this.socketService.sendGenerateMap();
  }

  public callStartGame() {
    this.socketService.sendStartGame();
  }

  public callSendHint() {
    this.socketService.sendSendHint('TEST HINT');
  }


  public popToast() {
    let toast: Toast = {
      type: 'success',
      title: 'Here is a Toast Title',
      body: 'Here is a Toast Body'
    };

    this.toasterService.pop(toast);
  }

  public popHint(hint: string) {
    let toast: Toast = {
      type: 'success',
      title: 'Here is a Hint',
      body: hint
    };

    this.toasterService.pop(toast);
  }

  public popGameDebug(message: Message) {
    let toast: Toast = {
      type: 'info',
      title: 'Game Debug',
      body: `${Date.now()} ${message.content} Server:${message.timestamp} \n Delta:${Date.now() - message.timestamp}ms`
    };

    console.log(`${Date.now()} ${message.content} Server:${message.timestamp} --- Delta:${Date.now() - message.timestamp}ms`);

    this.toasterService.pop(toast);
  }

  public showUserModal(): void {
    this.userModal.show();
  }

  public hideUserModal(): void {
    this.userModal.hide();
  }

  public assignCardTypeClass(card: Card): string {
    let classString: string = null;

    switch (card.cardType) {
      case CardType.RedCard:
        classString = 'bg-danger';
        break;
      case CardType.BlueCard:
        classString = 'bg-primary';
        break;
      case CardType.AssassinCard:
        classString = 'bg-dark';
        break;
      case CardType.InnocentCard:
        classString = 'bg-secondary';
        break;
      case null:
        classString = '';
        break;
    }

    return classString;
  }

  ngOnDestroy() {
    this.receiveAuthenticatedSubscription.unsubscribe();
    this.receiveGameStatusSubscription.unsubscribe();
    this.receiveSendHintSubscription.unsubscribe();
    this.receiveGameDebugSubscription.unsubscribe();
    this.sendGameDebugSubscription.unsubscribe();
    this.socketService.disconnect();
  }
}