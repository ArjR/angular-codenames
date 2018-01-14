import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Subscription } from "rxjs";
import { Observable } from 'rxjs/Observable';
import { TimerObservable } from "rxjs/observable/TimerObservable";

import { SocketService } from '../services/socket.service';
import { Message, User } from '../../../server/model/game-classes';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  providers: [SocketService]
})
export class DashboardComponent {  
  form: FormGroup;
  modalCloseResult: string;
  messageSubscription: Subscription;
  receieverSubscription: Subscription;

  constructor(
    private fb: FormBuilder,
    private socketService: SocketService,
    private modalService: NgbModal) {

    this.form = fb.group({
      text: ['', Validators.required],
      name: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.receieverSubscription = this.socketService
      .getGameDebug()
      .subscribe(msg => {
        console.log(`${Date.now()} ${msg.content} Server:${msg.timestamp} --- Delta:${Date.now() - msg.timestamp}ms`);
      });

    let timer = TimerObservable.create(0, 2000);
    this.messageSubscription = timer.subscribe(t => {
      let message: Message = new Message(Date.now(), 'Message generated');
      this.socketService.sendGameDebug(message);
    });
  }

  public open(content) {
    this.modalService.open(content).result.then((result) => {
      this.modalCloseResult = `Closed with: ${result}`;
    }, (reason) => {
      this.modalCloseResult = `Dismissed ${this.getDismissReason(reason)}`;
    });
  }

  private getDismissReason(reason: any): string {
    if (reason === ModalDismissReasons.ESC) {
      return 'by pressing ESC';
    } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
      return 'by clicking on a backdrop';
    } else {
      return  `with: ${reason}`;
    }
  }

  ngOnDestroy() {
    this.messageSubscription.unsubscribe();
    this.receieverSubscription.unsubscribe();
    this.socketService.disconnect();
  }
}