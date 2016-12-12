import { Route } from '@angular/router';

import { ChatComponent } from './chat/chat.component';
import { HomeComponent } from './home/home.component';
import { CreateWhiteboardComponent } from './create-whiteboard/create-whiteboard.component';
import { ViewWhiteboardComponent } from './view-whiteboard/view-whiteboard.component';
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
		children: [
			{
				path: '',
				redirectTo: 'new',
				pathMatch: 'full'
			},
			{
				path: 'new',
				component: CreateWhiteboardComponent
			},
			{
				path: ':key',
				component: ViewWhiteboardComponent
			}
		]
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
