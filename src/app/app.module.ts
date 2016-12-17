import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { AngularFireModule } from 'angularfire2';
import { ColorPickerModule } from 'angular2-color-picker';

import { routerConfig } from './router.config';
import { firebaseConfig, authConfig } from '../environments/environment';

import { AppComponent } from './app.component';
import { NavbarComponent } from './navbar/navbar.component';
import { HomeComponent } from './home/home.component';
import { WhiteboardComponent } from './whiteboard/whiteboard.component';
import { CreateWhiteboardComponent } from './create-whiteboard/create-whiteboard.component';
import { ViewWhiteboardComponent } from './view-whiteboard/view-whiteboard.component';
import { ChatComponent } from './chat/chat.component';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';

import { AuthService } from './shared/security/auth.service';
import { ChatService } from './shared/model/chat.service';
import { UserService } from './shared/model/user.service';
import { WhiteboardService } from './shared/model/whiteboard.service';

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
		RegisterComponent
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
	providers: [AuthService, ChatService, UserService, WhiteboardService],
	bootstrap: [AppComponent]
})
export class AppModule { }
