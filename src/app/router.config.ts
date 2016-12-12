import { Route } from '@angular/router';

import { HomeComponent } from './home/home.component';
import { WhiteboardComponent } from './whiteboard/whiteboard.component';
import { LoginComponent } from './login/login.component';
import { SchedulingComponent } from './scheduling/scheduling.component';
import { CreateSessionComponent } from './scheduling/create-session/create-session.component';
import { RegisterComponent } from './register/register.component';
import { SessionComponent } from './session/session.component';

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
		path: 'scheduling',
		children: [
			{
				path: '',
				component: SchedulingComponent
			},
			{
				path: 'create',
				component: CreateSessionComponent
			}
		]
	},
	{
		path: 'register',
		component: RegisterComponent
	},
	{
		path: 'session/:id',
		component: SessionComponent
	}
];
