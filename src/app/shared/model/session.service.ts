import { Injectable, Inject } from '@angular/core';
import { Observable, Subject } from 'rxjs/Rx';
import { AngularFireDatabase, FirebaseRef} from 'angularfire2';
import { Session } from './session';
import { AuthService } from '../security/auth.service';

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

	findAllSessions(): Observable<Session[]> {
		return this.db.list('sessions').map(Session.fromJsonArray);
	}

	createSession(session: any): Observable<any> {
		if (!this.uid) return Observable.throw('Rip no login info');
		const sessionToSave = Object.assign({}, session);
		const newSessionKey = this.sdkDb.child('sessions').push().key;
		const uidsToSave = {};
		session.tutees.forEach(uid => uidsToSave[uid] = false);

		let dataToSave = {};

		dataToSave['sessions/' + newSessionKey] = sessionToSave;
		dataToSave['usersInSession/' + newSessionKey] = uidsToSave;

		return this.firebaseUpdate(dataToSave);
	}

	deleteSession(sessionId: string): Observable<any> {
		// calling update null on a location in the database will cause it to be deleted. 
		let dataToDelete = {};

		dataToDelete['sessions/' + sessionId] = null;
		return this.firebaseUpdate(dataToDelete);
	}

	joinSession(sessionId: String): Observable<any> {
		if (!this.uid) return Observable.throw('Rip no login info');

		this.sdkDb.child(`usersInSession/${sessionId}/${this.uid}`).onDisconnect().set(false);

		let dataToSave = {};
		dataToSave[`usersInSession/${sessionId}/${this.uid}`] = true;
		return this.firebaseUpdate(dataToSave);
	}
}