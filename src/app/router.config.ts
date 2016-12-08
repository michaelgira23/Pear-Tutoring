import { Route } from '@angular/router';

import { HomeComponent } from './home/home.component';
import { WhiteboardComponent } from './whiteboard/whiteboard.component';
import { LoginComponent } from './login/login.component';
import { SchedulingComponent } from './scheduling/scheduling.component'
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
		path: 'scheduling',
		component: SchedulingComponent,
	},
	{
		path: 'register',
		component: RegisterComponent
	}
];
