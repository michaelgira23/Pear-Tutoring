import { Route } from '@angular/router';

import { CreateChatComponent } from './create-chat/create-chat.component';
import { ViewChatComponent } from './view-chat/view-chat.component';
import { HomeComponent } from './home/home.component';
import { CreateWhiteboardComponent } from './create-whiteboard/create-whiteboard.component';
import { ViewWhiteboardComponent } from './view-whiteboard/view-whiteboard.component';
import { LoginComponent } from './login/login.component';
import { SchedulingComponent } from './scheduling/scheduling.component';
import { CreateSessionComponent } from './scheduling/create-session/create-session.component';
import { SessionCalendarComponent } from './scheduling/session-calendar/session-calendar.component';
import { RegisterComponent } from './register/register.component';
import { SessionComponent } from './session/session.component';
import { SettingsComponent } from './settings/settings.component';

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
		path: 'chat',
		children: [
			{
				path: '',
				redirectTo: 'new',
				pathMatch: 'full'
			},
			{
				path: 'new',
				component: CreateChatComponent
			},
			{
				path: ':key',
				component: ViewChatComponent
			}
		]
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
	},
	{
		path: 'settings',
		component: SettingsComponent
	}
];
