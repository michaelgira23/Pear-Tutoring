import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { AngularFireModule } from 'angularfire2';

import { routerConfig } from './router.config';
import { firebaseConfig, authConfig } from '../environments/environment';

import { AppComponent } from './app.component';
import { NavbarComponent } from './navbar/navbar.component';
import { HomeComponent } from './home/home.component';
import { WhiteboardComponent } from './whiteboard/whiteboard.component';
import { ChatComponent } from './chat/chat.component';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';

import { AuthService } from './shared/security/auth.service';
import { SchedulingComponent } from './scheduling/scheduling.component';
import { SessionService } from './shared/model/session.service';
import { UserService } from './shared/model/user.service'

@NgModule({
	declarations: [
		AppComponent,
		NavbarComponent,
		HomeComponent,
		WhiteboardComponent,
		ChatComponent,
		LoginComponent,
		SchedulingComponent,
		RegisterComponent
	],
	imports: [
		BrowserModule,
		FormsModule,
		ReactiveFormsModule,
		HttpModule,
		RouterModule.forRoot(routerConfig),
		AngularFireModule.initializeApp(firebaseConfig, authConfig)
	],
	providers: [AuthService, SessionService, UserService],
	bootstrap: [AppComponent]
})
export class AppModule { }
