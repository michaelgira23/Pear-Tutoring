import { Route } from '@angular/router';

import { ChatComponent } from './chat/chat.component';
import { HomeComponent } from './home/home.component';
import { WhiteboardComponent } from './whiteboard/whiteboard.component';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';

export const routerConfig: Route[] = [
	{
		path: '',
		redirectTo: 'home',
		pathMatch: 'full'
	},
	{
		path: 'home',
		component: HomeComponent
	},
	{
		path: 'whiteboard',
		component: WhiteboardComponent
	},
	{
		path: 'login',
		component: LoginComponent
	},
	{
		path: 'register',
		component: RegisterComponent
	},
	{
		path: 'chat',
		component: ChatComponent
	}
];
