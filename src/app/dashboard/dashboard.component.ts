import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Subscription } from "rxjs";
import { Observable } from 'rxjs/Observable';
import { TimerObservable } from "rxjs/observable/TimerObservable";


import { ChatService } from '../services/chat.service';
import { Message, User } from '../../../server/model';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  providers: [ChatService]
})
export class DashboardComponent {
  form: FormGroup;
  messageSubscription: Subscription;
  receieverSubscription: Subscription;

  constructor(
    public fb: FormBuilder,
    public chatService: ChatService) {

    this.form = fb.group({
      text: ['', Validators.required],
      name: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.receieverSubscription = this.chatService
      .getMessage()
      .subscribe(msg => {
        console.log(`${Date.now()} ${msg.content} Server:${msg.timestamp} --- Delta:${Date.now() - msg.timestamp}ms`);
      });

    let timer = TimerObservable.create(1000, 1000);
    this.messageSubscription = timer.subscribe(t => {
      let message: Message = new Message(Date.now(), 'Message generated');
      this.chatService.sendMessage(message);
    });
  }

  ngOnDestroy() {
    this.messageSubscription.unsubscribe();
    this.receieverSubscription.unsubscribe();
    this.chatService.disconnect();
  }
}