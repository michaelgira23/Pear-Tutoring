import { Component, OnInit, OnDestroy } from '@angular/core';
import { Observable } from 'rxjs';
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
export class DashboardComponent implements OnInit, OnDestroy {

	currentUser: User;

	upcomingSubscription: any;
	availableSubscription: any;
	pendingSubscription: any;

	allMySessions: Session[];
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
		this.upcomingSubscription = Observable
			.combineLatest(
				this.sessionService.findMySessions(),
				this.userService.user$,
				(sessions, user) => sessions
			)
			.map(sessions => {
				// Get upcoming sessions by combining tutor and tutee sessions
				return sessions[0].concat(sessions[1])
					// Filter out any sessions that have aleady happened
					.filter(session => moment().unix() < session.end.unix())
					// Sort by starting timestamp
					.sort((a, b) => b.start.unix() - a.start.unix());
			})
			.subscribe(
				sessions => {
					this.upcomingSessions = sessions;
				},
				err => {
					console.log('get my sessions error', err);
				}
			);

		// Get all sessions. Order by start date and only take the first 5
		this.availableSubscription = Observable
			.combineLatest(
				this.sessionService.findPublicSessions(),
				this.userService.user$,
				(sessions, user) => sessions
			)
			.map(sessions => {
				return sessions
					// Filter out any sessions that have aleady happened
					.filter(session => moment().unix() < session.end.unix())
					// Filter out sessions that the user is already in
					.filter(session => {
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
					})
					// Sort by starting timestamp
					.sort((a, b) => b.start.unix() - a.start.unix())
					// Only get the first 5 sessions
					.slice(0, 6);
			})
			.subscribe(
				sessions => {
					this.availableSessions = sessions;
				},
				err => {
					console.log('get available sessions error', err);
				}
			);

		// Get pending user sessions
		this.pendingSubscription = Observable
			.combineLatest(
				this.sessionService.findAllSessions(),
				this.userService.findAllUsers(),
				(sessions, users) => { return { sessions, users }; }
			)
			.map(data => {
				// Map users to uid
				let users = {};
				data.users.forEach(user => {
					users[user.$key] = user;
				});

				let pending = [];
				data.sessions
					// Filter out any sessions that have aleady happened
					.filter(session => moment().unix() < session.end.unix())
					// Sort by starting timestamp
					.sort((a, b) => b.start.unix() - a.start.unix())
					// Only keep sessions that should be in pending column
					.forEach(session => {
						// If tutor and there's pending, add all users in pending
						if (session.tutor.$key === this.currentUser.$key) {
							session.pending.forEach(uid => {
								pending.push({
									session,
									user: users[uid]
								});
							});

						// Also if user is in pending list, we should also add
						} else if (session.pending.includes(this.currentUser.$key)) {
							pending.push({
								session,
								user: users[this.currentUser.$key]
							});
						}
					});
				return pending;
			})
			.subscribe(
				pending => {
					this.pendingEnrollments = pending;
				},
				err => {
					console.log('get pending sessions error', err);
				}
			);

	}

	ngOnDestroy() {
		this.upcomingSubscription.unsubscribe();
		this.availableSubscription.unsubscribe();
		this.pendingSubscription.unsubscribe();
	}

}
