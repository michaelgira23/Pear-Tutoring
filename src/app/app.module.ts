import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { AngularFireModule } from 'angularfire2';
import { ColorPickerModule } from 'angular2-color-picker';

import { routerConfig } from './router.config';
import { firebaseConfig, authConfig } from '../environments/environment';

// General components and services
import { AppComponent } from './app.component';
import { NavbarComponent } from './navbar/navbar.component';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { HomeComponent } from './home/home.component';
import { SettingsComponent } from './settings/settings.component';

import { AuthService } from './shared/security/auth.service';
import { UserService } from './shared/model/user.service';

// Whiteboard components and services
import { WhiteboardComponent } from './whiteboard/whiteboard.component';
import { CreateWhiteboardComponent } from './create-whiteboard/create-whiteboard.component';
import { ViewWhiteboardComponent } from './view-whiteboard/view-whiteboard.component';

import { WhiteboardService } from './shared/model/whiteboard.service';

// Chat components and services
import { CreateChatComponent } from './create-chat/create-chat.component';
import { ViewChatComponent } from './view-chat/view-chat.component';
import { ChatComponent } from './chat/chat.component';

import { ChatService } from './shared/model/chat.service';

// Scheduling/session components and services
import { SchedulingComponent } from './scheduling/scheduling.component';
import { SessionComponent } from './session/session.component';
import { CreateSessionComponent } from './scheduling/create-session/create-session.component';
import { DisplaySessionComponent } from './scheduling/display-session/display-session.component';

import { SessionService } from './shared/model/session.service';
import { NamePipe } from './shared/model/name.pipe';

@NgModule({
	declarations: [
		AppComponent,
		NavbarComponent,
		HomeComponent,
		WhiteboardComponent,
		CreateWhiteboardComponent,
		ViewWhiteboardComponent,
		ChatComponent,
		LoginComponent,
		SchedulingComponent,
		RegisterComponent,
		CreateSessionComponent,
		SessionComponent,
		DisplaySessionComponent,
		RegisterComponent,
		SettingsComponent,
		CreateChatComponent,
		ViewChatComponent,
		NamePipe
	],
	imports: [
		BrowserModule,
		FormsModule,
		ReactiveFormsModule,
		HttpModule,
		RouterModule.forRoot(routerConfig),
		AngularFireModule.initializeApp(firebaseConfig, authConfig),
		ColorPickerModule
	],
	providers: [AuthService, ChatService, SessionService, UserService, WhiteboardService],
	bootstrap: [AppComponent]
})
export class AppModule { }
