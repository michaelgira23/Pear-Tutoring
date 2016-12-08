import { Injectable, Inject } from '@angular/core';
import { FirebaseRef } from 'angularfire2';
import { Observable, Subject } from 'rxjs/Rx';

@Injectable()
export class UserService {

	sdkDb: any;

	constructor(@Inject(FirebaseRef) fb) {
		this.sdkDb = fb.database().ref();
	}

	saveUser(user: any, uid: string): Observable<any> {
		let userToSave = Object.assign({}, user);
		delete userToSave.uid;
		let dataToSave = {};
		dataToSave[`users/${uid}`] = userToSave;
		return this.firebaseUpdate(dataToSave);
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
