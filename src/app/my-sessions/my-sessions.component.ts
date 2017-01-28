import { Component, OnInit, OnDestroy } from '@angular/core';
import { UserService } from '../shared/model/user.service';
import { User } from '../shared/model/user';
import { SessionService } from '../shared/model/session.service';
import { Session } from '../shared/model/session';

@Component({
	selector: 'app-my-sessions',
	templateUrl: './my-sessions.component.html',
	styleUrls: ['./my-sessions.component.scss']
})
export class MySessionsComponent implements OnInit, OnDestroy {

	user: User;

	tutorSessions: Session[] = [];
	tuteeSessions: Session[] = [];
	mySessions = [];
	sessionsByFreeTime: Session[][];
	get suggestions(): Session[] {
		return [].concat.apply([], this.sessionsByFreeTime);
	};

	mySessions$: any;
	freeTimes$: any;
	suggestions$: any;

	page: number = 0;

	constructor(private userService: UserService, private sessionService: SessionService) { }

	ngOnInit() {
		this.freeTimes$ = this.userService.getFreeTimes().subscribe(freeTimes => {
			this.suggestions$ = this.sessionService.findSessionsByFreeTime(freeTimes).subscribe(val => {
				this.sessionsByFreeTime = val;
			}, console.log);
		}, console.log);
		this.mySessions$ = this.sessionService.findMySessions().subscribe(
			val => {
				this.tutorSessions = val[0];
				this.tuteeSessions = val[1];
				this.mySessions = val[0].concat(val[1]);
			},
			err => console.log(err)
		);
	}

	ngOnDestroy() {
		this.mySessions$.unsubscribe();
		this.freeTimes$.unsubscribe();
	}

	onClickTab() {
		this.page = 0;
		return false;
	}
	// clock display of the user's day, marking freetimes, and when user clicks on a freetime it shows the recommended sessions
}
