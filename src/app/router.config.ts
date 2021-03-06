import { Route } from '@angular/router';

import { CreateChatComponent } from './create-chat/create-chat.component';
import { ViewChatComponent } from './view-chat/view-chat.component';
import { HomeComponent } from './home/home.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { CreateWhiteboardComponent } from './create-whiteboard/create-whiteboard.component';
import { ViewWhiteboardComponent } from './view-whiteboard/view-whiteboard.component';
import { LoginComponent } from './login/login.component';
import { SchedulingComponent } from './scheduling/scheduling.component';
import { CreateSessionComponent } from './create-session/create-session.component';
import { RegisterComponent } from './register/register.component';
import { SessionComponent } from './session/session.component';
import { SessionDetailsComponent } from './session-details/session-details.component';
import { SettingsComponent } from './settings/settings.component';
import { MySessionsComponent } from './my-sessions/my-sessions.component';
import { SessionPermissionsComponent } from './session/session-permissions/session-permissions.component';
import { SessionRequestComponent } from './session/session-request/session-request.component';
import { UserDetailsComponent } from './user-details/user-details.component';
import { DebugComponent } from './debug/debug.component';

import { SessionGuardService } from './shared/model/session-guard.service';
import { SessionDeactivateGuardService } from './shared/model/session-deactivate-guard.service';

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
		path: 'debug',
		component: DebugComponent
	},
	{
		path: 'whiteboard',
		children: [
			{
				path: '',
				redirectTo: 'create',
				pathMatch: 'full'
			},
			{
				path: 'create',
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
				redirectTo: 'create',
				pathMatch: 'full'
			},
			{
				path: 'create',
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
		children: [
			{
				path: '',
				redirectTo: 'create',
				pathMatch: 'full'
			},
			{
				path: 'create',
				component: CreateSessionComponent
			},
			{
				path: ':id',
				children: [
					{
						path: '',
						canDeactivate: [SessionDeactivateGuardService],
						component: SessionComponent,
						canActivate: [SessionGuardService]
					},
					{
						path: 'details',
						component: SessionDetailsComponent,
					},
					{
						path: 'update',
						component: CreateSessionComponent,
						canActivate: [SessionGuardService]
					},
					{
						path: 'permissions',
						component: SessionPermissionsComponent,
						canActivate: [SessionGuardService]
					},
					{
						path: 'requests',
						component: SessionRequestComponent,
						canActivate: [SessionGuardService]
					}
				]
			}
		],
	},
	{
		path: 'user/:uid',
		component: UserDetailsComponent
	},
	// 404 Page
	{
		path: '**',
		redirectTo: 'home'
	}
];
