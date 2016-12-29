import { Injectable, Inject } from '@angular/core';
import { Observable, Subject } from 'rxjs/Rx';
import { AngularFireDatabase, FirebaseRef } from 'angularfire2';
import { Session } from './session';
import { UserService, userStatus, FreeTime } from './user.service';
import { ChatService } from './chat.service';
import { AuthService } from '../security/auth.service';
import { WhiteboardService, WhiteboardOptions } from './whiteboard.service';
import { Moment } from 'moment';
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
		this.auth.auth$.subscribe(val => {
			if (val) { this.uid = val.uid; };
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
			return Observable.combineLatest(objToArr(val.tutees).map(tutee => {
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
		let sessionsWithUser: any[];
		// First fill in the tutor field of each session
		return sessionQuery.flatMap((val: any[]) => {
			sessionsWithUser = val;
			return Observable.combineLatest(
				val.map((session) => this.userService.findUser(session.tutor))
			);
		})
		.map((val: any[]) => {
			sessionsWithUser.map((session, index) => session.tutor = val[index]);
			return sessionsWithUser;
		})
		// Then fill in the tutees array of each session, note sessions are stored temporarily in the sessionsWithUser variable
		.flatMap((val: any[]) => {
			sessionsWithUser = val;
			return Observable.combineLatest(
				val.map((session) => Observable.combineLatest(
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
			return Observable.combineLatest(wbKeys.map(wbKey => {
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
			return Observable.combineLatest(
				val.map((session) => this.db.list('whiteboardsBySessions/' + session.$key))
			);
		})
		// this step returns an array of array of whiteboard keys for each session in the list
		.flatMap(val => {
			return Observable.combineLatest(val.map(wbKeys => {
				return Observable.combineLatest(wbKeys.map(key => {
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
	findMySessions(): {tutorSessions: Observable<Session[]>, tuteeSessions: Observable<Session[]>} {
		if (!this.uid) { return {tutorSessions: Observable.throw('Rip no login info'), tuteeSessions: Observable.throw('Rip no login info')}; };
		return {
			tutorSessions: this.combineArrWithUser(this.combineArrWithWb(this.db.list(`/users/${this.uid}/tutorSessions`)
																			.flatMap(ids => Observable.combineLatest(ids.map(id => this.db.object('sessions/' + id.$key))))))
				.map(Session.fromJsonArray),
			tuteeSessions: this.combineArrWithUser(this.combineArrWithWb(this.db.list(`/users/${this.uid}/tuteeSessions`)
																			.flatMap(ids => Observable.combineLatest(ids.map(id => this.db.object('sessions/' + id.$key))))))
				.map(Session.fromJsonArray)
		};
	}

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
			.flatMap(tags$arr => Observable.combineLatest(tags$arr))
			.map(sessionsByTag => {sessionsByTag = sessionsByTag.reduce((a, b) => a.concat(b));
				return sessionsByTag.map(session => this.findSession(session.$key)); })
			.flatMap(session$arr => Observable.combineLatest(session$arr))
			.map(Session.fromJsonArray);
	}

	findSessionsBySubject(subject: string) {
		return this.combineArrWithUser(
			this.combineArrWithWb(
				this.db.list('sessionsBySubject/' + subject)
					// List of session ids --> list of session objects without user inserted
					.flatMap(ids => Observable.combineLatest(ids.map(id => this.db.object('sessions/' + id.$key))))
			)
		).map(Session.fromJsonArray);
	}

	// Find sessions that fits the free times of the user.
	findSessionsByFreeTime(day: number, timesInDay: FreeTime[]): Observable<Session[]> {
		let start = 0;
		let sessionsList: Session[] = [];
		let query: Observable<any> = this.db.list('sessions', {
			query: {
				startAt: start,
				limitToFirst: 10
			}
		}).flatMap(sessions => {
			sessions.forEach(session => {
				timesInDay.forEach(time => {
					if (time.from.unix() < session.start && time.to.unix() > session.end) {
						sessionsList.push(session);
					}
				});
			});
			if (sessionsList.length >= 5 || !sessions) {
				return Observable.of(sessionsList);
			}
			start += 10;
			return query;
		});
		return query.map(Session.fromJsonArray);
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
		}

		// Transform the arrays in the object to firebase-friendly objects
		sessionToSave.start = session.start.unix();
		sessionToSave.end = session.end.unix();
		sessionToSave.tutees = arrToObj(sessionToSave.tutees);
		sessionToSave.tags = arrToObj(sessionToSave.tags);
		sessionToSave['dayInWeek'] = session.end.format('d');
		dataToSave['sessions/' + sessionId] = sessionToSave;

		return this.firebaseUpdate(dataToSave);
	}

	// Use the update function to create a session, and create a starting whiteboard and chat
	createSession(session: SessionOptions, wbOpt?: WhiteboardOptions): Observable<any> {
		let wbId;
		let chatId;
		return this.whiteboardService.createWhiteboard(wbOpt)
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

		// this.sdkDb.child(`/usersInSession/${sessionId}/${this.uid}`).onDisconnect().set(false);

		let dataToSave = {};
		dataToSave[`/usersInSession/${sessionId}/${this.uid}`] = true;
		this.userService.changeStatus(userStatus.IN_SESSION);
		return this.firebaseUpdate(dataToSave);
	}

	// remove the user from the pool of online users for the session, and change his status to "online"
	leaveSession(sessionId: string): Observable<any> {
		let dataToSave = {};
		dataToSave[`/usersInSession/${sessionId}/${this.uid}`] = false;
		this.userService.changeStatus(userStatus.ONLINE);
		return this.firebaseUpdate(dataToSave);
	}

	// get only the uids of users from the pool of online users for a session
	getOnlineUsers(sessionId): Observable<any[]> {
		return this.db.list('usersInSession/' + sessionId);
	}

	addWb(sessionId: string): Observable<any> {
		return this.whiteboardService.createWhiteboard().flatMap(wb => {
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

	addTutee(sessionId: string, tuteeId: string) {
		let dataToSave = {};
		dataToSave[`sessions/${sessionId}/tutees/${tuteeId}`] = true;
		dataToSave[`users/${tuteeId}/tuteeSessions/${sessionId}`] = true;
		return this.firebaseUpdate(dataToSave);
	}
}

export interface SessionOptions {
	start: Moment;
	end: Moment;
	tutor: string;
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
