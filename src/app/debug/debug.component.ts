import { Component, OnInit } from '@angular/core';

import { Session } from '../shared/model/session';
import { SessionService } from '../shared/model/session.service';

import { User } from '../shared/model/user';
import { UserService } from '../shared/model/user.service';

@Component({
	selector: 'app-debug',
	templateUrl: './debug.component.html',
	styleUrls: ['./debug.component.scss']
})
export class DebugComponent implements OnInit {

	sessionsSubscription: any;
	sessions: Session[] = [];
	deleteSessionId: string;

	usersSubscription: any;
	users: User[] = [];

	constructor(private sessionService: SessionService, private userService: UserService) { }

	ngOnInit() {
		this.sessionsSubscription = this.sessionService.findPublicSessions()
			.subscribe(
				val => {
					this.sessions = val
						// Sort by starting timestamp
						.sort((a, b) => a.start.unix() - b.start.unix());
				},
				err => console.log(err)
			);

		this.usersSubscription = this.userService.findAllUsers()
			.subscribe(
				val => {
					this.users = val;
				},
				err => console.log(err)
			);
	}

	deleteSession() {
		this.sessionService.deleteSession(this.deleteSessionId)
			.subscribe(
				data => {
					// console.log(`delete successful! ${data}`);
				},
				err => {
					console.log(`error deleting session ${err}`);
				}
			);
	}

}
