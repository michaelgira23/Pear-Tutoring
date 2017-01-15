import { Route } from '@angular/router';

import { CreateChatComponent } from './create-chat/create-chat.component';
import { ViewChatComponent } from './view-chat/view-chat.component';
import { HomeComponent } from './home/home.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { CreateWhiteboardComponent } from './create-whiteboard/create-whiteboard.component';
import { ViewWhiteboardComponent } from './view-whiteboard/view-whiteboard.component';
import { LoginComponent } from './login/login.component';
import { SchedulingComponent } from './scheduling/scheduling.component';
import { CreateSessionComponent } from './scheduling/create-session/create-session.component';
import { RegisterComponent } from './register/register.component';
import { SessionComponent } from './session/session.component';
import { SessionDetailsComponent } from './session-details/session-details.component';
import { SettingsComponent } from './settings/settings.component';
import { UpdateSessionComponent } from './scheduling/update-session/update-session.component';
import { MySessionsComponent } from './my-sessions/my-sessions.component';
import { SessionPermissionsComponent } from './session/session-permissions/session-permissions.component';
import { SessionRequestComponent } from './session/session-request/session-request.component';

import { SessionGuardService } from './shared/model/session-guard.service';

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
		path: 'dashboard',
		component: DashboardComponent
	},
	{
		path: 'my-sessions',
		component: MySessionsComponent
	},
	{
		path: 'search',
		component: SchedulingComponent
	},
	{
		path: 'settings',
		component: SettingsComponent
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
		path: 'session',
		canActivateChild: [SessionGuardService],
		children: [
			{
				path: 'create',
				component: CreateSessionComponent
			},
			{
				path: ':id',
				children: [
					{
						path: '',
						component: SessionComponent
					},
					{
						path: 'details',
						component: SessionDetailsComponent
					},
					{
						path: 'update',
						component: UpdateSessionComponent
					},
					{
						path: 'permissions',
						component: SessionPermissionsComponent,
						outlet: 'permissions-popup'
					},
					{
						path: 'requests',
						component: SessionRequestComponent,
						outlet: 'requests-popup'
					}
				]
			}
		],
	},
	// 404 Page
	{
		path: '**',
		redirectTo: 'home'
	}
];
