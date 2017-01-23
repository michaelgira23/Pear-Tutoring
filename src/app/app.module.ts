import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { AngularFireModule } from 'angularfire2';
import { ColorPickerModule } from 'angular2-color-picker';
import { CalendarModule } from 'angular-calendar';
import { DatePickerModule } from 'ng2-datepicker';

import { routerConfig } from './router.config';
import { firebaseConfig, authConfig } from '../environments/environment';

// General components and services
import { AppComponent } from './app.component';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { HomeComponent } from './home/home.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { SettingsComponent } from './settings/settings.component';
import { PfpUploadComponent } from './settings/pfp-upload/pfp-upload.component';

import { AuthService } from './shared/security/auth.service';
import { NotificationsService } from './shared/model/notifications.service';
import { PermissionsService }  from './shared/security/permissions.service';
import { UserService } from './shared/model/user.service';

import { MDLUpgradeElementDirective } from './shared/common/mdl-upgrade-element.directive';

import { SafeHtmlPipe, SafeScriptPipe, SafeStylePipe, SafeUrlPipe, SafeResourceUrlPipe } from './shared/security/safe.pipe';

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
import { SessionDetailsComponent } from './session-details/session-details.component';
import { CreateSessionComponent } from './create-session/create-session.component';
import { SessionCardComponent } from './session-card/session-card.component';
import { SessionCalendarComponent } from './scheduling/session-calendar/session-calendar.component';
import { UserChipComponent } from './scheduling/user-chip/user-chip.component';
import { TimePickerComponent } from './settings/time-picker/time-picker.component';
import { MySessionsComponent } from './my-sessions/my-sessions.component';
import { UserAutoCompleteComponent } from './scheduling/user-auto-complete/user-auto-complete.component';
import { SidebarComponent } from './shared/common/sidebar/sidebar.component';
import { WhiteboardSelectComponent } from './session/whiteboard-select/whiteboard-select.component';
import { SessionsWithFilterComponent } from './scheduling/sessions-with-filter/sessions-with-filter.component';
import { SessionPermissionsComponent } from './session/session-permissions/session-permissions.component';
import { SessionRequestComponent } from './session/session-request/session-request.component';
import { ModalComponent } from './shared/common/modal/modal.component';

import { SidebarControlDirective } from './shared/common/sidebar/sidebar-control.directive';
import { SidebarContentDirective } from './shared/common/sidebar/sidebar-content.directive';

import { SessionService } from './shared/model/session.service';
import { SessionGuardService } from './shared/model/session-guard.service';
import { SessionDeactivateGuardService } from './shared/model/session-deactivate-guard.service';

import { NamePipe } from './shared/model/name.pipe';
import { SessionRatingComponent } from './session/session-rating/session-rating.component';
import { UserDetailsComponent } from './user-details/user-details.component';
import { RatingDisplayComponent } from './rating-display/rating-display.component';
import { TextListControlComponent } from './register/text-list-control/text-list-control.component';

@NgModule({
	declarations: [
		AppComponent,
		HomeComponent,
		DashboardComponent,
		WhiteboardComponent,
		CreateWhiteboardComponent,
		ViewWhiteboardComponent,
		ChatComponent,
		LoginComponent,
		SchedulingComponent,
		RegisterComponent,
		CreateSessionComponent,
		SessionComponent,
		SessionDetailsComponent,
		SessionCardComponent,
		RegisterComponent,
		SettingsComponent,
		SessionCalendarComponent,
		UserChipComponent,
		CreateChatComponent,
		ViewChatComponent,
		TimePickerComponent,
		MySessionsComponent,
		PfpUploadComponent,
		UserAutoCompleteComponent,
		MDLUpgradeElementDirective,
		NamePipe,
		SafeHtmlPipe,
		SafeScriptPipe,
		SafeStylePipe,
		SafeUrlPipe,
		SafeResourceUrlPipe,
		SidebarComponent,
		SidebarControlDirective,
		SidebarContentDirective,
		WhiteboardSelectComponent,
		SessionsWithFilterComponent,
		SessionPermissionsComponent,
		SessionRequestComponent,
		ModalComponent,
		SessionRatingComponent,
		UserDetailsComponent,
		RatingDisplayComponent,
		TextListControlComponent
	],
	imports: [
		BrowserModule,
		FormsModule,
		ReactiveFormsModule,
		HttpModule,
		RouterModule.forRoot(routerConfig),
		AngularFireModule.initializeApp(firebaseConfig, authConfig),
		ColorPickerModule,
		CalendarModule.forRoot(),
		DatePickerModule
	],
	providers: [
		AuthService,
		ChatService,
		SessionService,
		NotificationsService,
		PermissionsService,
		UserService,
		WhiteboardService,
		SessionGuardService,
		SessionDeactivateGuardService],
	bootstrap: [AppComponent]
})
export class AppModule { }
