import { Component, OnInit } from '@angular/core';
import { SessionService } from '../shared/model/session.service';
import { Session } from '../shared/model/session';
import { UserService } from '../shared/model/user.service';
import { User } from '../shared/model/user';

import * as moment from 'moment';

@Component({
	selector: 'app-scheduling',
	templateUrl: './scheduling.component.html',
	styleUrls: ['./scheduling.component.scss']
})
export class SchedulingComponent implements OnInit {

	allSessions: Session[];
	allUsers: User[];

	constructor(private sessionService: SessionService, private userService: UserService) { }

	ngOnInit() {
		// this.sessionService.createSession({
		// 	start: moment.now(),
		// 	end: moment().hours(2).format('x'),
		// 	tutor: '',
		// 	tutees: [],
		// 	max: 3,
		// 	listed: true
		// }).subscribe(
		// 	val => console.log("Mock Session created"),
		// 	err => console.log(err)
		// );
		this.sessionService.findAllSessions()
		.subscribe(
			val => this.allSessions = val,
			err => console.log(err)
		);

		this.userService.findAllUsers().subscribe(
			val => this.allUsers = val,
			err => console.log('Getting users error', err)
		)
	}

	deleteSession(sessionId: string) {
		this.sessionService.deleteSession(sessionId).subscribe(
			val => console.log('deleted'),
			err => console.log(err)
		)
	}
}
