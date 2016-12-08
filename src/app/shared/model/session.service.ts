import { Injectable, Inject } from '@angular/core';
import { Observable, Subject } from 'rxjs/Rx';
import { AngularFireDatabase, FirebaseRef } from 'angularfire2';
import { Session } from './session';

@Injectable()
export class SessionService {
	sdkDb: any;

	constructor(private db: AngularFireDatabase, @Inject(FirebaseRef) fb) {
		this.sdkDb = fb.database().ref();
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
		const sessionToSave = Object.assign({}, session);
		const newSessionKey = this.sdkDb.child('sessions').push().key;

		let dataToSave = {};

		dataToSave["sessions/" + newSessionKey] = sessionToSave;

		return this.firebaseUpdate(dataToSave);
	}

	deleteSession(sessionId: string): Observable<any> {
		// calling update null on a location in the database will cause it to be deleted. 
		let dataToDelete = {};

		dataToDelete["sessions/" + sessionId] = null;
		return this.firebaseUpdate(dataToDelete);
	}
}