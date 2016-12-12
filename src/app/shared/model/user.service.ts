import { Injectable, Inject } from '@angular/core';
import { AngularFireDatabase, FirebaseRef } from 'angularfire2';
import { Observable, Subject } from 'rxjs/Rx';
import { User } from './user';

@Injectable()
export class UserService {

	sdkDb: any;

	constructor(@Inject(FirebaseRef) fb, private db: AngularFireDatabase) {
		this.sdkDb = fb.database().ref();
	}

	saveUser(user: any, uid: string): Observable<any> {
		let userToSave = Object.assign({}, user, {uid});
		delete userToSave.uid;
		let dataToSave = {};
		dataToSave[`users/${uid}`] = userToSave;
		return this.firebaseUpdate(dataToSave);
	}

	findAllUsers(): Observable<User[]> {
		return this.db.list('users').do(console.log)
		.map(User.fromJsonList);
	}

	findUser(uid: string): Observable<User> {
		return this.db.object(`users/${uid}`).do(console.log)
		.map(User.fromJson);
	}

	private firebaseUpdate(dataToSave) {
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
}
