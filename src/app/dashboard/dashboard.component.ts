import { Component, OnInit } from '@angular/core';
import * as moment from 'moment';

import { Session } from '../shared/model/session';
import { SessionService } from '../shared/model/session.service';
import { User } from '../shared/model/user';
import { UserService } from '../shared/model/user.service';

@Component({
	selector: 'app-dashboard',
	templateUrl: './dashboard.component.html',
	styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

	currentUser: User;

	upcomingSessions: Session[];
	availableSessions: Session[];
	pendingEnrollments: {
		session: Session,
		user: User
	}[];

	constructor(private sessionService: SessionService, private userService: UserService) { }

	ngOnInit() {

		this.userService.user$.subscribe(user => this.currentUser = user);

		// Get upcoming sessions the user is in
		this.sessionService.findMySessions()
			// Also fire observable when user changes
			.withLatestFrom(this.userService.user$, (session, user) => session)
			.subscribe(
				userSessions => {
					// Combine tutor and tutee sessions
					this.upcomingSessions = userSessions[0].concat(userSessions[1])
						// Filter out any sessions that have aleady happened
						.filter(session => moment().unix() < session.end.unix())
						// Sort by starting timestamp
						.sort((a, b) => a.start.unix() - b.start.unix());
				},
				err => {
					console.log('get my sessions error', err);
				}
			);

		// Get all sessions. Order by start date and only take the first 5
		this.sessionService.findPublicSessions()
			// Also fire observable when user changes
			.withLatestFrom(this.userService.user$, (session, user) => session)
			.subscribe(
				sessions => {
					console.log('avaailbe sessions', sessions.length);

					// Filter out sessions that the user is already in
					sessions = sessions.filter(session => {
						// Check if tutor
						if (session.tutor.$key === this.currentUser.$key) {
							return false;
						}

						// Check if tutee
						if (session.tutees.some(user => user.$key === this.currentUser.$key)) {
							return false;
						}

						// Check if pending
						if (session.pending.includes(this.currentUser.$key)) {
							return false;
						}

						return true;
					});

					// Order sessions by start date first
					sessions.sort((a, b) => {
						return a.start.unix() - b.start.unix();
					});

					this.availableSessions = sessions.slice(0, 6);
				}
			);

	}

}
