import { Route } from '@angular/router';

import { CreateChatComponent } from './create-chat/create-chat.component';
import { ViewChatComponent } from './view-chat/view-chat.component';
import { HomeComponent } from './home/home.component';
import { CreateWhiteboardComponent } from './create-whiteboard/create-whiteboard.component';
import { ViewWhiteboardComponent } from './view-whiteboard/view-whiteboard.component';
import { LoginComponent } from './login/login.component';
import { SchedulingComponent } from './scheduling/scheduling.component';
import { CreateSessionComponent } from './scheduling/create-session/create-session.component';
import { RegisterComponent } from './register/register.component';
import { SessionComponent } from './session/session.component';
import { SettingsComponent } from './settings/settings.component';
import { UpdateSessionComponent } from './scheduling/update-session/update-session.component';
import { MyScheduleComponent } from './scheduling/my-schedule/my-schedule.component';
import { SessionPermissionsComponent } from './session/session-permissions/session-permissions.component';

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
			},
			{
				path: 'update/:id',
				component: UpdateSessionComponent
			},
			{
				path: 'my-schedule',
				component: MyScheduleComponent
			}
		]
	},
	{
		path: 'register',
		component: RegisterComponent
	},
	{
		path: 'session',
		children: [
			{
				path: ':id',
				component: SessionComponent
			},
			{
				path: ':/permissions',
				component: SessionPermissionsComponent
			}
		],
	},
	{
		path: 'settings',
		component: SettingsComponent
	},
	{
		path: '**',
		redirectTo: 'home'
	},
];
