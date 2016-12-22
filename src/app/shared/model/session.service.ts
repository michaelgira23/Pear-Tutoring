import { Injectable, Inject } from '@angular/core';
import { Observable, Subject } from 'rxjs/Rx';
import { AngularFireDatabase, FirebaseRef } from 'angularfire2';
import { Session } from './session';
import { UserService, userStatus } from './user.service';
import { ChatService } from './chat.service';
import { AuthService } from '../security/auth.service';
import { WhiteboardService, WhiteboardOptions } from './whiteboard.service';

export const allowedSubjects = ['Math', 'English', 'Art'];

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

	firebaseUpdate(dataToSave) {
		const subject = new Subject();

		this.sdkDb.update(dataToSave)
			.then(
				val => {
					subject.next(val);
					subject.complete();
				},
				err => {
					subject.error(err);
					subject.complete();
				}
			);

		return subject.asObservable();
	}

	// Take a firebase query for a single session and insert a user object into the tutor and tutee fields. 
	// Wrap this function around a firebase query to a session i can get the session object with the users
	combineWithUser(sessionQuery: Observable<any>): Observable<Session> {
		let sessionWithUser;
		// First query the tutor
		return sessionQuery.switchMap(val => {
			sessionWithUser = val;
			return this.db.object('users/' + val.tutor);
		}).map(val => {
			sessionWithUser.tutor = val;
			return sessionWithUser;
		})
		// Then query the tutees, note the session is stored temporarily in sessionsWithUser, and used later to combine with the users info. 
		.switchMap(val => {
			sessionWithUser = val;
			return Observable.combineLatest(val.tutees.map(tutee => {
				if (typeof tutee !== 'string') {
					return this.db.object('users/' + tutee.$key);
				}
				return this.db.object('users/' + tutee);
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
		return sessionQuery.switchMap((val: any[]) => {
			sessionsWithUser = val;
			return Observable.combineLatest(
				val.map((session) => this.db.object('users/' + session.tutor))
			);
		})
		.map((val: any[]) => {
			sessionsWithUser.map((session, index) => session.tutor = val[index]);
			return sessionsWithUser;
		})
		// Then fill in the tutees array of each session, note sessions are stored temporarily in the sessionsWithUser variable
		.switchMap((val: any[]) => {
			sessionsWithUser = val;
			return Observable.combineLatest(
				val.map((session) => Observable.combineLatest(
					session.tutees.map(tutee => {
						if (typeof tutee !== 'string') {
							return this.db.object('users/' + tutee.$key);
						}
						return this.db.object('users/' + tutee);
					})
				))
			);
		}).map((val: any[][]) => {
			sessionsWithUser.map((session, sessionIndex) => {
				session.tutees = session.tutees.map((tutee, tuteeIndex) => val[sessionIndex][tuteeIndex]);
				return session;
			});
			return sessionsWithUser;
		});
	}

	// find a single session and combine it with user data
	findSession(id: string, query?: {}): Observable<any> {
		return this.combineWithUser(
			this.db.object('/sessions/' + id)
			.flatMap(val => val.$exists() ? Observable.of(val) : Observable.throw(`Session ${val.$key} does not exist`))
		);
	}

	// Find the session ids where the user is a tutor or a tutee. Note the info in stored in the user object. 
	findMySessions(): {tutorSessions: Observable<Session[]>, tuteeSessions: Observable<Session[]>} {
		if (!this.uid) { return {tutorSessions: Observable.throw('Rip no login info'), tuteeSessions: Observable.throw('Rip no login info')}; };
		return {
			tutorSessions: this.db.list(`/users/${this.uid}/tutorSessions`)
				.map(sessions => sessions.map(session => this.findSession(session.$key)))
				.flatMap(sessions$arr => Observable.combineLatest(sessions$arr))
				.map(Session.fromJsonArray),
			tuteeSessions: this.db.list(`/users/${this.uid}/tuteeSessions`)
				.map(sessions => sessions.map(session => this.findSession(session.$key)))
				.flatMap(sessions$arr => Observable.combineLatest(sessions$arr))
				.map(Session.fromJsonArray)
		};
	}

	// Find all of the sessions where the listed field is true. 
	findPublicSessions(): Observable<Session[]> {
		return this.combineArrWithUser(
			this.db.list('sessions', {
				query: {
					orderByChild: 'listed',
					equalTo: true
				}
			})
		).map(Session.fromJsonArray);
	}

	// Find session by tags, sessions are already stored in sessionsByTags node in firebase
	findSessionsByTags(tags: string[]): Observable<Session[]> {
		return Observable.of(tags.map(tag => this.db.list('sessionsByTags/' + tag)))
			.flatMap(tags$arr => Observable.combineLatest(tags$arr))
			.map(sessionsByTag => {sessionsByTag = sessionsByTag.reduce((a, b) => a.concat(b));
				return sessionsByTag.map(session => this.findSession(session.$key).do(console.log)); })
			.flatMap(session$arr => Observable.combineLatest(session$arr))
			.map(Session.fromJsonArray);
	}

	// Update the information of a session
	updateSession(sessionId: string, session: SessionOptions): Observable<any> {
		if (!this.uid) { return Observable.throw('Rip no login info'); };
		let sessionToSave = Object.assign({}, session);
		let uidsToSave = {};
		session.tutees.forEach(uid => {
			if (uid !== this.uid) {
				uidsToSave[uid] = false;
			}
		});

		let dataToSave = {};
		dataToSave['sessions/' + sessionId] = sessionToSave;
		dataToSave['usersInSession/' + sessionId] = uidsToSave;
		dataToSave[`users/${this.uid}/tutorSessions/${sessionId}`] = true;
		session.tutees.forEach(uid => dataToSave[`users/${uid}/tuteeSessions/${sessionId}`] = true);
		session.tags.forEach(tag => dataToSave[`sessionsByTags/${tag}/${sessionId}`] = true);
		if (allowedSubjects.find((val) => session.subject === val)) {
			dataToSave[`sessionsBySubject/${session.subject}/${sessionId}`] = true;
		}
		return this.firebaseUpdate(dataToSave);
	}

	// Use the update function to create a session
	createSession(session: SessionOptions, wbOpt?: WhiteboardOptions): Observable<any> {
		const wbOptDefault = {
			background: '#FFF'
		};
		let wbId;
		let chatId;
		return this.whiteboardService.createWhiteboard(wbOpt.background.match('^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$') ? wbOpt : wbOptDefault)
		.switchMap(wb => {
			wbId = wb.key;
			return this.chatService.createChat();
		})
		.switchMap(chat => {
			chatId = chat.key;
			const newSessionKey = this.sdkDb.child('sessions').push().key;
			session.whiteboard = [wbId];
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
		return this.db.object('sessions' + sessionId).switchMap(session => {
			let dataToSave = {};
			dataToSave['sessions/' + sessionId] = null;
			dataToSave['usersInSession/' + sessionId] = null;
			dataToSave[`users/${this.uid}/tutorSessions/${sessionId}`] = null;
			session.tutees.forEach(uid => dataToSave[`users/${uid}/tuteeSessions/${sessionId}`] = null);
			session.tags.forEach(tag => dataToSave[`sessionsByTags/${tag}/${sessionId}`] = null);
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

	// addWb(sessionId: string) {}

	// deleteWb(sessionId: string) {}

	// addTutee(sessionId: string, tuteeId: string) {}
	// Might as well just use updateSession
}

export interface SessionOptions {
	start: string;
	end: string;
	tutor: string;
	subject: string;
	max: number;
	listed: boolean;
	title: string;
	desc: string;
	tutees: string[];
	tags: string[];
	whiteboard: string[];
	chat: string;
	canceled: boolean;
}
