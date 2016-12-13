import { Injectable, Inject } from '@angular/core';
import { Observable, Subject } from 'rxjs/Rx';
import { AngularFireDatabase, FirebaseRef} from 'angularfire2';
import { Session } from './session';
import { User } from './user';
import { AuthService } from '../security/auth.service';
import * as moment from 'moment';

@Injectable()
export class SessionService {
	sdkDb: any;
	uid: string;

	constructor(private db: AngularFireDatabase, @Inject(FirebaseRef) fb, private authService: AuthService) {
		this.sdkDb = fb.database().ref();
		this.authService.auth$.subscribe(val => {
			if (val) this.uid = val.uid;
			console.log('get uid: ' +  this.uid);
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

	findSession(id: string): Observable<Session> {
		return this.db.object('/sessions/' + id)
		.flatMap(val => val.$exists() ? Observable.from([val]) : Observable.throw('Session dont exist'));
	}

	findMySessions(): {tutorSessions: Observable<Session[]>, tuteeSessions: Observable<Session[]>} {
		if (!this.uid) return {tutorSessions: Observable.throw('Rip no login info'), tuteeSessions: Observable.throw('Rip no login info')};
		return {
			tutorSessions: this.db.list(`/users/${this.uid}/tutorSessions`)
				.map(sessions => sessions.map(session => this.db.object(`/sessions/${session.$key}`)))
				.flatMap(sessions$arr => Observable.combineLatest(sessions$arr)).do(console.log)
				.map(Session.fromJsonArray),
			tuteeSessions: this.db.list(`/users/${this.uid}/tuteeSessions`)
				.map(sessions => sessions.map(session => this.db.object(`/sessions/${session.$key}`)))
				.flatMap(sessions$arr => Observable.combineLatest(sessions$arr)).do(console.log)
				.map(Session.fromJsonArray)
		}
	}

	findPublicSessions(): Observable<Session[]> {
		return this.db.list('sessions', {
			query: {
				orderByChild: 'listed',
				equalTo: true
			}
		});
	}

	findSessionsByTag(): Observable<Session[]> {
		return Observable.from([]);
	}

	createSession(session: SessionOptions, whiteboardOptions?: WhiteboardOptions): Observable<any> {
		if (!this.uid) return Observable.throw('Rip no login info');
		let sessionToSave = Object.assign({}, session);
		const newSessionKey = this.sdkDb.child('sessions').push().key;
		const uidsToSave = {};
		session.tutees.forEach(uid => uidsToSave[uid] = false);
		sessionToSave.tutor = this.uid;

		let dataToSave = {};
		dataToSave['sessions/' + newSessionKey] = sessionToSave;
		dataToSave['usersInSession/' + newSessionKey] = uidsToSave;
		dataToSave[`users/${this.uid}/tutorSessions/${newSessionKey}`] = true;
		session.tutees.forEach(uid => dataToSave[`users/${uid}/tuteeSessions/${newSessionKey}`] = true);

		// let wbOptDefault = {
		// 	created: moment().format('X'),
		// 	createdBy: this.uid,
		//  background: '#FFF'
		// }
		// createWhiteboard$ = this.whiteboardService.createWhiteboard(whiteboardOptions ? whiteboardOptions : wbOptDefault);
		// remember to merge this with the update observable

		return this.firebaseUpdate(dataToSave);
	}

	createAnonSession(): Observable<any> {
		return Observable.from(undefined);
	}

	deleteSession(sessionId: string): Observable<any> {
		// calling update null on a location in the database will cause it to be deleted. 
		let dataToDelete = {};

		dataToDelete['sessions/' + sessionId] = null;
		return this.firebaseUpdate(dataToDelete);
	}

	joinSession(sessionId: String): Observable<any> {
		if (!this.uid) return Observable.throw('Rip no login info');

		this.sdkDb.child(`/usersInSession/${sessionId}/${this.uid}`).onDisconnect().set(false);

		let dataToSave = {};
		dataToSave[`/usersInSession/${sessionId}/${this.uid}`] = true;
		return this.firebaseUpdate(dataToSave);
	}

	getOnlineUsers(sessionId): Observable<User[]> {
		return this.db.list('usersInSession/' + sessionId)
		.map(uids => uids.map(uid => this.db.object('users/' + uid.$key)))
		.flatMap(uid$arr => Observable.combineLatest(uid$arr))
		.map(User.fromJsonList);
	}
}

export interface SessionOptions {
	start: string,
	end: string,
	tutor: string,
	max: number,
	listed: boolean,
	title: string,
	desc: string,
	tutees: string[],
	tags: string[]
}

export interface WhiteboardOptions {
	background?: string;
}