import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { trigger, state, transition, group, animate, style } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';
import { Card, User, UserType, CardType } from '../../../../server/model/game-classes';

@Component({
  selector: 'card-button',
  styleUrls: ['./card-button.component.css'],
  templateUrl: './card-button.component.html'
})

export class CardButtonComponent implements OnInit {

  @Input()
  card: Card = null;

  @Input()
  user: User = null;

  @Output()
  onClick: EventEmitter<any> = new EventEmitter();

  constructor() { }

  ngOnInit(): void { }

  callClick() {
    this.onClick.emit(true);
  }

  // Component html use [disabled]="disabled"
  public isDisabled() {
    return this.card.isPlayed;
  }

  public buttonCssClass() {
    let playedRedCardCss = 'btn-danger';
    let playedBlueCardCss = 'btn-primary';
    let playedAssassinCardCss = 'btn-dark';
    let playedInnocentCardCss = 'btn-secondary';

    let unplayedRedCardCss = 'btn-outline-danger';
    let unplayedBlueCardCss = 'btn-outline-primary';
    let unplayedAssassinCardCss = 'btn-outline-dark';
    let unplayedInnocentCardCss = 'btn-outline-secondary';

    let unknownCardCss = 'btn-outline-dark';
    let isUserLeader = false;

    // Determine whether user is leader
    if (this.user.userType == UserType.RedLeader || this.user.userType == UserType.BlueLeader) {
      isUserLeader = true;
    }

    if (this.card.isPlayed) {
      if (this.card.cardType == CardType.RedCard) {
        return playedRedCardCss;
      } else if (this.card.cardType == CardType.BlueCard) {
        return playedBlueCardCss;
      } else if (this.card.cardType == CardType.AssassinCard) {
        return playedAssassinCardCss;
      } else if (this.card.cardType == CardType.InnocentCard) {
        return playedInnocentCardCss;
      }
    } else {
      if (this.card.cardType == CardType.RedCard && isUserLeader) {
        return unplayedRedCardCss;
      } else if (this.card.cardType == CardType.BlueCard && isUserLeader) {
        return unplayedBlueCardCss;
      } else if (this.card.cardType == CardType.AssassinCard && isUserLeader) {
        return unplayedAssassinCardCss;
      } else if (this.card.cardType == CardType.InnocentCard && isUserLeader) {
        return unplayedInnocentCardCss;
      } else {
        return unknownCardCss;
      }
    }
  }
}