import { Component, OnInit, OnDestroy } from '@angular/core';
import { UserService, FreeTimes } from '../../shared/model/user.service';
import { User } from '../../shared/model/user';
import { SessionService } from '../../shared/model/session.service';
import { Session } from '../../shared/model/session';

@Component({
	selector: 'app-my-schedule',
	templateUrl: './my-schedule.component.html',
	styleUrls: ['./my-schedule.component.scss']
})
export class MyScheduleComponent implements OnInit, OnDestroy {

	user: User;

	tutorSessions: Session[] = [];
	tuteeSessions: Session[] = [];
	mySessions = [];
	sessionsByFreeTime: Session[][];
	get suggestions(): Session[] {
		if (this.sessionsByFreeTime) {
			if (this.sessionsByFreeTime.length > 0) {
				return this.sessionsByFreeTime.reduce((prev, curr) => prev.concat(curr));
			}
			return [];
		}
		return [];
	};

	mySessions$: any;
	freeTimes$: any;
	suggestions$: any;

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

	disableLink() {
		return false;
	}
	// clock display of the user's day, marking freetimes, and when user clicks on a freetime it shows the recommended sessions
}
