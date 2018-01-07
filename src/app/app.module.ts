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
import { metaReducers, reducers } from './store';
import { SharedModule } from './shared/shared.module';
import { WeatherService } from './weather/weather.service';
import { WeatherEffects } from './store/weather/weather.effects';
import { FeedEffects } from './store/feed/feed.effects';
import { ProfileEffects } from './store/profile/profile.effects';
import { environment } from '../environments/environment';
import { SocketIoModule, SocketIoConfig } from 'ng-socket-io';

import { serverPort } from '../../server/config';

const config: SocketIoConfig = { url: location.origin == 'https://angular-codenames.herokuapp.com' ? location.origin : 'http://localhost:4300', options: {} };


//const config: SocketIoConfig = { url: 'http://localhost:4300', options: {} };
//const config: SocketIoConfig = { url: 'http://localhost:' + (process.env.PORT || serverPort), options: {} };
//const config: SocketIoConfig = { url: location.origin, options: {} };

//const hostname = 'http://' + window.location.hostname + ':' + serverPort;
//const config: SocketIoConfig = { url: hostname.toString(), options: {} };

console.log('Example of config:');
console.log(config);
console.log(location.origin);
console.log(window.location.hostname);
console.log(location.origin.replace(/^http/, 'ws'));

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    SocketIoModule.forRoot(config),
    SharedModule,
    FormsModule,
    HttpClientModule,
    StoreModule.forRoot(reducers, { metaReducers }),
    EffectsModule.forRoot([
      ProfileEffects,
      FeedEffects,
      WeatherEffects
    ]),
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
