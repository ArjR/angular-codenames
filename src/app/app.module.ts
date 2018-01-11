import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';

import { AppComponent } from './app.component';
import { routes } from './app.router';
import { SharedModule } from './shared/shared.module';
import { WeatherService } from './services/weather.service';
import { environment } from '../environments/environment';
import { SocketIoModule, SocketIoConfig } from 'ng-socket-io';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

//const config: SocketIoConfig = { url: 'https://angular-codenames.herokuapp.com', options: {} };
const config: SocketIoConfig = { url: 'http://localhost:4300', options: {} };

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    SocketIoModule.forRoot(config),
    NgbModule.forRoot(),
    SharedModule,
    FormsModule,
    HttpClientModule,

    !environment.production ? StoreDevtoolsModule.instrument({ maxAge: 50 }) : [],
    RouterModule.forRoot(
      routes,
      {
        useHash: true
      }
    )
  ],
  providers: [
    WeatherService
  ],
  bootstrap: [
    AppComponent
  ]
})
export class AppModule { }
