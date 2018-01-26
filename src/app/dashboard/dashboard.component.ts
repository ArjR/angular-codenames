import { Component, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Subscription } from "rxjs";
import { Observable } from 'rxjs/Observable';
import { TimerObservable } from "rxjs/observable/TimerObservable";

import { SocketService } from '../services/socket.service';
import { Message, GameCommand, ClientPackage, UserType, User, GameData, CardType, Card, Team } from '../../../server/model/game-classes';
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
  @ViewChild('hintModal') hintModal: ModalDirective; // ngx-bootstrap modal
  @ViewChild('confirmPickModal') confirmPickModal: ModalDirective; // ngx-bootstrap modal
  UserType = UserType; // To use Enum for Angular markup
  CardType = CardType; // To use Enum for Angular markup
  Team = Team; // To use Enum for Angular markup

  private receiveAuthenticatedSubscription: Subscription;
  private receiveGameStatusSubscription: Subscription;
  private receiveSendHintSubscription: Subscription;
  private receiveGameDebugSubscription: Subscription;

  user: User = null;
  gameData: GameData = null;
  hint: string = null;
  pickedCard: Card = null;

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
      .receiveHint()
      .subscribe(hint => {
        console.log('RECEIVE GameCommand.HINT', hint);
        this.popHint(hint);
      });
    this.receiveGameDebugSubscription = this.socketService
      .receiveGameDebug()
      .subscribe(message => {
        console.log('RECEIVE GameCommand.GAME_DEBUG');
        this.popGameDebug(message);
      });

    // let timer = TimerObservable.create(0, 10000);
    // this.sendGameDebugSubscription = timer.subscribe(t => {
    //   let message: Message = new Message(Date.now(), 'Message generated');
    //   this.socketService.sendGameDebug(message);
    // });

    // Initialise first Outbound Event
    this.socketService.sendAuthenticate();
  }

  public callLogin(userType: UserType): void {
    this.socketService.sendLogin(userType);
  }

  public callLogout(): void {
    this.socketService.sendLogout();
  }

  public callNewGame(): void {
    this.socketService.sendNewGame();
  }

  public callGenerateWords(): void {
    this.socketService.sendGenerateWords();
  }

  public callGenerateWord(id: number): void {
    this.socketService.sendGenerateWord(id);
  }

  public callGenerateMap(): void {
    this.socketService.sendGenerateMap();
  }

  public callStartGame(): void {
    this.socketService.sendStartGame();
  }

  public callHint(): void {
    this.socketService.sendHint(this.hint);
    this.hideHintModal();
  }

  public callGuessCard(id: number): void {
    this.socketService.sendGuessCard(id);
  }

  public callPickCard(): void {
    this.socketService.sendPickCard(this.pickedCard.id);
    this.hideConfirmPickModal();
  }

  public callNextRound(): void {
    this.socketService.sendNextRound();
  }

  public callClick(card: Card): void {
    if (card.isPlayed) return; // Ignore picked cards

    this.pickedCard = card;

    // If round hasn't started then GenerateWord
    if (this.gameData.currentRound == 0) {
      this.callGenerateWord(card.id);
    } else {
      // Round has started
      // Pick Card
      if ((this.user.userType == UserType.RedLeader && this.gameData.currentTeam == Team.Red)
        || (this.user.userType == UserType.BlueLeader && this.gameData.currentTeam == Team.Blue)) {
        this.showConfirmPickModal();
      }
    }
  }

  public getCardRows(): Card[][] {
    let cards: Card[][] = [];
    let cardRow: Card[] = [];
    let i = 0;
    this.gameData.cards.forEach(card => {
      if (i % 5 == 0) {
        cardRow = [];
        cards.push(cardRow);
      }

      cardRow.push(card);
      i++;
    });

    return cards;
  }

  public popToast(): void {
    let toast: Toast = {
      type: 'success',
      title: 'Here is a Toast Title',
      body: 'Here is a Toast Body'
    };

    this.toasterService.pop(toast);
  }

  public popHint(hint: string): void {
    let toast: Toast = {
      type: 'success',
      title: 'Here is a Hint',
      body: hint
    };

    this.toasterService.pop(toast);
  }

  public popGameDebug(message: Message): void {
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

  public showHintModal(): void {
    this.hint = null;

    if ((this.user.userType == UserType.RedLeader && this.gameData.currentTeam == Team.Red)
      || (this.user.userType == UserType.BlueLeader && this.gameData.currentTeam == Team.Blue)) {
      this.hintModal.show();
    }
  }

  public hideHintModal(): void {
    this.hintModal.hide();
  }

  public showConfirmPickModal(): void {

    if ((this.user.userType == UserType.RedLeader && this.gameData.currentTeam == Team.Red)
      || (this.user.userType == UserType.BlueLeader && this.gameData.currentTeam == Team.Blue)) {
      this.confirmPickModal.show();
    }
  }

  public hideConfirmPickModal(): void {
    this.confirmPickModal.hide();
  }

  ngOnDestroy() {
    if (this.receiveAuthenticatedSubscription) this.receiveAuthenticatedSubscription.unsubscribe();
    if (this.receiveGameStatusSubscription) this.receiveGameStatusSubscription.unsubscribe();
    if (this.receiveSendHintSubscription) this.receiveSendHintSubscription.unsubscribe();
    if (this.receiveGameDebugSubscription) this.receiveGameDebugSubscription.unsubscribe();
    if (this.sendGameDebugSubscription) this.sendGameDebugSubscription.unsubscribe();
    this.socketService.disconnect();
  }
}