import { Component, TemplateRef  } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Subscription } from "rxjs";
import { Observable } from 'rxjs/Observable';
import { TimerObservable } from "rxjs/observable/TimerObservable";

import { SocketService } from '../services/socket.service';
import { Message, User } from '../../../server/model/game-classes';
import { ToasterService, Toast } from 'angular2-toaster';
import { BsModalService } from 'ngx-bootstrap/modal';
import { BsModalRef } from 'ngx-bootstrap/modal/bs-modal-ref.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  providers: [SocketService]
})
export class DashboardComponent {
  form: FormGroup;
  modalRef: BsModalRef;
  messageSubscription: Subscription;
  receieverSubscription: Subscription;

  constructor(
    private fb: FormBuilder,
    private socketService: SocketService,
    private toasterService: ToasterService,
    private modalService: BsModalService) {

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

  public popToast() {
    var toast: Toast = {
      type: 'info',
      title: 'Here is a Toast Title',
      body: 'Here is a Toast Body'
    };

    this.toasterService.pop(toast);
  }

  public openModal(template: TemplateRef<any>) {
    this.modalRef = this.modalService.show(template);
  }

  ngOnDestroy() {
    this.messageSubscription.unsubscribe();
    this.receieverSubscription.unsubscribe();
    this.socketService.disconnect();
  }
}