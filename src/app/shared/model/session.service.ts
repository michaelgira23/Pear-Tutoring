import { Injectable, Inject } from '@angular/core';
import { Observable, Subject } from 'rxjs/Rx';
import { AngularFireDatabase, FirebaseRef } from 'angularfire2';
import { Session } from './session';
import { UserService, UserStatus, FreeTimes } from './user.service';
import { ChatService } from './chat.service';
import { AuthService } from '../security/auth.service';
import { WhiteboardService, defaultWhiteboardOptions } from './whiteboard.service';
import * as moment from 'moment';
import { objToArr, arrToObj } from '../common/utils';

export const AllowedSubjects = ['Math', 'English', 'Art'];

@Injectable()
export class SessionService {
	sdkDb: any;
	uid: string;

	constructor(private db: AngularFireDatabase, @Inject(FirebaseRef) fb,
				private userService: UserService,
				private whiteboardService: WhiteboardService,
				private auth: AuthService,
				private chatService: ChatService) {
		this.sdkDb = fb.database().ref();
		auth.auth$.subscribe(val => {
			this.uid = val ? val.uid : null;
		});
	}

	private promiseToObservable(promise): Observable<any> {

		const subject = new Subject<any>();

		promise
			.then(res => {
					subject.next(res);
					subject.complete();
				},
				err => {
					subject.error(err);
					subject.complete();
				});

		return subject.asObservable();
	}

	firebaseUpdate(dataToSave): Observable<any> {
		return this.promiseToObservable(this.sdkDb.update(dataToSave));
	}

	checkAndCombine(arr: Observable<any>[]): Observable<any> {
		if (arr.length > 0) {
			return Observable.combineLatest(arr);
		}
		return Observable.of([]);
	}

	// Take a firebase query for a single session and insert a user object into the tutor and tutee fields.
	// Wrap this function around a firebase query to a session i can get the session object with the users
	combineWithUser(sessionQuery: Observable<any>): Observable<Session> {
		let sessionWithUser;
		// First query the tutor
		return sessionQuery.flatMap(val => {
			sessionWithUser = val;
			if (typeof val.tutor !== 'string') {
				return this.userService.findUser(val.tutor.$key);
			}
			return this.userService.findUser(val.tutor);
		}).map(val => {
			sessionWithUser.tutor = val;
			return sessionWithUser;
		})
		// Then query the tutees, note the session is stored temporarily in sessionsWithUser, and used later to combine with the users info.
		.flatMap(val => {
			sessionWithUser = val;
			return this.checkAndCombine(objToArr(val.tutees).map(tutee => {
				if (typeof tutee !== 'string') {
					return this.userService.findUser(tutee.$key);
				}
				return this.userService.findUser(tutee);
			}));
		}).map(val => {
			sessionWithUser.tutees = val;
			return sessionWithUser;
		});
	}

	// Take a firebase query for an array of sessions and insert a user object into the tutor and tutee fields.
	combineArrWithUser(sessionQuery: Observable<any[]>): Observable<Session[]> {
		let sessionsWithUser: any[] = [];
		// First fill in the tutor field of each session
		return sessionQuery.flatMap((val: any[]) => {
			sessionsWithUser = val;
			return this.checkAndCombine(
				val.map((session) => {
					if (typeof session.tutor !== 'string') {
						return this.userService.findUser(session.tutor.$key);
					}
					return this.userService.findUser(session.tutor);
				})
			);
		})
		.map((val: any[]) => {
			sessionsWithUser.map((session, index) => session.tutor = val[index]);
			return sessionsWithUser;
		})
		// Then fill in the tutees array of each session, note sessions are stored temporarily in the sessionsWithUser variable
		// an empty tutees array in the session will cause a silent error
		.flatMap((val: any[]) => {
			sessionsWithUser = val;
			return this.checkAndCombine(
				val.map((session) => this.checkAndCombine(
					objToArr(session.tutees).map(tutee => {
						if (typeof tutee !== 'string') {
							return this.userService.findUser(tutee.$key);
						}
						return this.userService.findUser(tutee);
					})
				))
			);
		}).map((val: any[][]) => {
			sessionsWithUser.forEach((session, sessionIndex) => {
				sessionsWithUser[sessionIndex].tutees = objToArr(session.tutees).map((tutee, tuteeIndex) => val[sessionIndex][tuteeIndex]);
			});
			return sessionsWithUser;
		});
	}

	combineWithWb(sessionQuery: Observable<any>): Observable<Session[]> {
		let sessionWithWb;
		return sessionQuery.flatMap(val => {
			sessionWithWb = val;
			return this.db.list('whiteboardsBySessions/' + val.$key);
		})
		// returns a list of whiteboard key that belongs to the session
		.flatMap(wbKeys => {
			return this.checkAndCombine(wbKeys.map(wbKey => {
				return this.db.object('whiteboards/' + wbKey.$key);
			}));
		})
		// returns a list of actual whiteboard objects
		.map(val => {
			sessionWithWb.whiteboards = val;
			return sessionWithWb;
		});
	}

	combineArrWithWb(sessionQuery: Observable<any[]>): Observable<Session[]> {
		let sessionsWithWb: any[];
		// Fill in the whiteboard field of each session with the whiteboard info
		return sessionQuery.flatMap((val: any[]) => {
			sessionsWithWb = val;
			return this.checkAndCombine(
				val.map((session) => this.db.list('whiteboardsBySessions/' + session.$key))
			);
		})
		// this step returns an array of array of whiteboard keys for each session in the list
		.flatMap(val => {
			return this.checkAndCombine(val.map(wbKeys => {
				return this.checkAndCombine(wbKeys.map(key => {
					return this.db.object('whiteboards/' + key.$key);
				}));
			}));
		})
		// this step returns the previous two dimentional array but with a whiteboard object replacing each key
		.map((val: any[][]) => {
			sessionsWithWb.forEach((session, sessionIndex) => {
				sessionsWithWb[sessionIndex].whiteboards = val[sessionIndex];
			});
			return sessionsWithWb;
		});
	}

	// find a single session and combine it with user data
	findSession(id: string, query?: {}): Observable<any> {
		return this.combineWithUser(
			this.combineWithWb(
				this.db.object('sessions/' + id)
				.flatMap(val => val.$exists() ? Observable.of(val) : Observable.throw(`Session ${val.$key} does not exist`))
			)
		).map(Session.fromJson);
	}

	// Find the session ids where the user is a tutor or a tutee. Note the info in stored in the user object.
	findMySessions(): Observable<Session[][]> {
		return this.checkAndCombine([
			this.auth.auth$.flatMap(state => {
				if (!state) {
					return [];
				}
				return this.combineArrWithUser(this.combineArrWithWb(this.db.list(`/users/${state.uid}/tutorSessions`)
																				.flatMap(ids => this.checkAndCombine(ids.map(id => this.db.object('sessions/' + id.$key))))));
			}).map(Session.fromJsonArray),
			this.auth.auth$.flatMap(state => {
				if (!state) {
					return [];
				}
				return this.combineArrWithUser(this.combineArrWithWb(this.db.list(`/users/${state.uid}/tuteeSessions`)
																				.flatMap(ids => this.checkAndCombine(ids.map(id => this.db.object('sessions/' + id.$key))))));
			}).map(Session.fromJsonArray)
		]);
	};


	// Find all of the sessions where the listed field is true.
	findPublicSessions(): Observable<Session[]> {
		return this.combineArrWithUser(
			this.combineArrWithWb(
				this.db.list('sessions', {
					query: {
						orderByChild: 'listed',
						equalTo: true
					}
				})
			)
		).map(Session.fromJsonArray);
	}

	// Find session by tags, sessions are already stored in sessionsByTags node in firebase
	findSessionsByTags(tags: string[]): Observable<Session[]> {
		return Observable.of(tags.map(tag => this.db.list('sessionsByTags/' + tag)))
			.flatMap(tags$arr => this.checkAndCombine(tags$arr))
			.map(sessionsByTag => {sessionsByTag = sessionsByTag.reduce((a, b) => a.concat(b));
				return sessionsByTag.map(session => this.findSession(session.$key)); })
			.flatMap(session$arr => this.checkAndCombine(session$arr))
			.map(Session.fromJsonArray);
	}

	findSessionsByProperty(prop: string, searchStr: string): Observable<Session[]> {
		console.log(prop);
		if (Session.prototype[prop] === undefined) {
			return Observable.throw('property is not defined in session');
		}
		let fbNode = 'sessionsBy' + prop[0].toUpperCase + prop.slice(1, prop.length) + '/';
		return this.combineArrWithUser(
			this.combineArrWithWb(
				this.db.list(fbNode + searchStr)
					// List of session ids --> list of session objects without user inserted
					.flatMap(ids => this.checkAndCombine(ids.map(id => this.db.object('sessions/' + id.$key))))
			)
		).map(Session.fromJsonArray);
	}

	// Find sessions that fits the free times of the user. 
	findSessionsByFreeTime(timesInDay: FreeTimes): Observable<Session[][]> {
		let sessionsList: Session[] = [];
		let queryList: Observable<any>[] = [];
		let secFromMdn = function(m: moment.Moment): number {
			return m.startOf('day').diff(m);
		};
		for (let day in timesInDay) {
			if (timesInDay[day] !== undefined) {
				// this gets the day in week from the free times, and try to find a match in the same day in week next week
				let dayInNextWeek = moment().add(1, 'week').day(day);
				queryList.push(this.db.list('sessions/', {
					query: {
						orderByChild: 'ywd',
						equalTo: dayInNextWeek.format('YYYY-WW-E')
					}
				}).map(sessions => {
					sessions.forEach(session => {
						timesInDay[day].forEach(time => {
							if (secFromMdn(moment(session.start, 'X')) <= secFromMdn(time.from) && secFromMdn(moment(session.end, 'X')) >= secFromMdn(time.to)) {
								sessionsList.push(session);
							}
						});
					});
					return sessions;
				}));
			}
		}
		return this.checkAndCombine(queryList).flatMap(sessionListByDay => {
			return Observable.combineLatest(sessionListByDay.map(sessionList => {
				return this.combineArrWithUser(this.combineArrWithWb(Observable.of(sessionList))).map(Session.fromJsonArray);
			}));
		});
	}

	// Update the information of a session
	updateSession(sessionId: string, session: SessionOptions): Observable<any> {
		if (!this.uid) { return Observable.throw('Rip no login info'); };

		let sessionToSave: any = Object.assign({}, session);
		delete sessionToSave.whiteboard;

		let uidsToSave = {};
		session.tutees.forEach(uid => {
			if (uid !== this.uid) {
				uidsToSave[uid] = false;
			}
		});

		let dataToSave = {};
		dataToSave['usersInSession/' + sessionId] = uidsToSave;
		dataToSave[`users/${this.uid}/tutorSessions/${sessionId}`] = true;
		session.tutees.forEach(uid => dataToSave[`users/${uid}/tuteeSessions/${sessionId}`] = true);
		dataToSave[`whiteboardsBySessions/${sessionId}/${session.whiteboard}`] = true;
		// below are only for the public sessions, because we want the private sessions to be unsearchable in the catalogs
		if (session.listed) {
			session.tags.forEach(tag => dataToSave[`sessionsByTags/${tag}/${sessionId}`] = true);
			if (AllowedSubjects.find((val) => session.subject === val)) {
				dataToSave[`sessionsBySubject/${session.subject}/${sessionId}`] = true;
			}
			if (session.grade > 0 && session.grade <= 12) {
				dataToSave[`sessionsByGrade/${session.grade}/${sessionId}`] = true;
			}
			dataToSave[`sessionByClassStr/${session.classStr}/${sessionId}}`] = true;
		}
		// Transform the arrays in the object to firebase-friendly objects
		sessionToSave.start = session.start.unix();
		sessionToSave.end = session.end.unix();
		sessionToSave.tutees = arrToObj(sessionToSave.tutees);
		sessionToSave.tags = arrToObj(sessionToSave.tags);
		// store the date of the session in year - week in year - day in week
		sessionToSave['ywd'] = session.end.format('YYYY-WW-E');
		dataToSave['sessions/' + sessionId] = sessionToSave;

		return this.firebaseUpdate(dataToSave);
	}

	// Use the update function to create a session, and create a starting whiteboard and chat
	createSession(session: SessionOptions): Observable<any> {
		let wbId;
		let chatId;
		return this.whiteboardService.createWhiteboard(defaultWhiteboardOptions)
		.flatMap(wb => {
			wbId = wb.key;
			return this.chatService.createChat();
		})
		.flatMap(chat => {
			chatId = chat.key;
			const newSessionKey = this.sdkDb.child('sessions').push().key;
			session.whiteboard = wbId;
			session.chat = chatId;
			session.canceled = false;
			return this.updateSession(newSessionKey, session);
		});
	}

	// WIP:  create an anonymous session, for quick access and sharing of the whiteboard.
	createAnonSession(): Observable<any> {
		return Observable.from(undefined);
	}

	// Delete a session.
	deleteSession(sessionId: string): Observable<any> {
		// calling update null on a location in the database will cause it to be deleted.
		if (!this.uid) { return Observable.throw('Rip no login info'); };
		return this.db.object('sessions/' + sessionId).flatMap(session => {
			let dataToSave = {};
			dataToSave['sessions/' + sessionId] = null;
			dataToSave['usersInSession/' + sessionId] = null;
			dataToSave[`users/${this.uid}/tutorSessions/${sessionId}`] = null;
			objToArr(session.tutees).forEach(uid => dataToSave[`users/${uid}/tuteeSessions/${sessionId}`] = null);
			objToArr(session.tags).forEach(tag => dataToSave[`sessionsByTags/${tag}/${sessionId}`] = null);
			dataToSave[`sessionsBySubject/${session.subject}/${sessionId}`] = null;

			return this.firebaseUpdate(dataToSave);
		});
	}

	// Adds the user to the pool of online users in a session, and change the user's status to "inSession"
	joinSession(sessionId: String): Observable<any> {
		if (!this.uid) { return Observable.throw('Rip no login info'); }

		// in case the user closes the tab
		this.sdkDb.child(`/usersInSession/${sessionId}/${this.uid}`).onDisconnect().set(false);

		let dataToSave = {};
		dataToSave[`/usersInSession/${sessionId}/${this.uid}`] = true;
		this.userService.changeStatus(UserStatus.IN_SESSION);
		return this.firebaseUpdate(dataToSave);
	}

	// remove the user from the pool of online users for the session, and change his status to "online"
	leaveSession(sessionId: string): Observable<any> {
		let dataToSave = {};
		dataToSave[`/usersInSession/${sessionId}/${this.uid}`] = false;
		this.userService.changeStatus(UserStatus.ONLINE);
		return this.firebaseUpdate(dataToSave);
	}

	// get only the uids of users from the pool of online users for a session
	getOnlineUsers(sessionId): Observable<any[]> {
		return this.db.list('usersInSession/' + sessionId);
	}

	addWb(sessionId: string): Observable<any> {
		return this.whiteboardService.createWhiteboard(defaultWhiteboardOptions).flatMap(wb => {
			let pushVal = {};
			pushVal[wb.key] = true;
			return this.promiseToObservable(this.db.list('whiteboardsBySessions/').update(sessionId, pushVal));
		});
	}

	deleteWb(sessionId: string, wbKey: string): Observable<any> {
		return this.promiseToObservable(this.db.list('whiteboardsBySessions/' + sessionId).remove(wbKey))
			.flatMap(val => {
				return this.promiseToObservable(this.db.list('whiteboards').remove(wbKey));
			});
	}

	addTutees(sessionId: string, tuteeIds: string[]) {
		let dataToSave = {};
		for (let i = 0; i < tuteeIds.length; i++) {
			dataToSave[`sessions/${sessionId}/tutees/${tuteeIds[i]}`] = true;
			dataToSave[`users/${tuteeIds[i]}/tuteeSessions/${sessionId}`] = true;
			dataToSave[`usersInSession/${sessionId}/${tuteeIds[i]}`] = false;
		}
		return this.firebaseUpdate(dataToSave);
	}

	removeTutees(sessionId: string, tuteeIds: string[]) {
		let dataToSave = {};
		for (let i = 0; i < tuteeIds.length; i++) {
			dataToSave[`sessions/${sessionId}/tutees/${tuteeIds[i]}`] = null;
			dataToSave[`users/${tuteeIds[i]}/tuteeSessions/${sessionId}`] = null;
			dataToSave[`usersInSession/${sessionId}/${tuteeIds[i]}`] = null;
		}
		return this.firebaseUpdate(dataToSave);
	}
}

export interface SessionOptions {
	start: moment.Moment;
	end: moment.Moment;
	tutor: string;
	grade: number;
	classStr: string;
	subject: string;
	max: number;
	listed: boolean;
	title: string;
	desc: string;
	tutees: string[];
	tags: string[];
	// this is the initial whiteboard that gets created when a session is created
	whiteboard?: string;
	chat?: string;
	canceled: boolean;
}
