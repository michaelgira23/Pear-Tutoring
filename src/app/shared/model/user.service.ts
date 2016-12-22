import { Injectable, Inject } from '@angular/core';
import { AngularFireDatabase, FirebaseRef, FirebaseAuthState } from 'angularfire2';
import { AuthService } from '../security/auth.service';
import { Observable, Subject } from 'rxjs/Rx';
import { User } from './user';

@Injectable()
export class UserService {

	sdkDb: any;
	sdkStorage: any;
	uid: string;

	constructor(@Inject(FirebaseRef) fb, private db: AngularFireDatabase, private auth: AuthService) {
		this.sdkDb = fb.database().ref();
		this.sdkStorage = fb.storage().ref();
		auth.auth$.subscribe(val => this.uid = val ? val.uid : undefined);
	}

	login(email: string, password: string): Observable<FirebaseAuthState> {
		return this.auth.login(email, password);
	}

	register(regOpt: RegisterOptions): Observable<any> {
		return this.auth.register(regOpt.email, regOpt.password)
			.flatMap(val => {
				const newUid = val.uid;
				let userToSave = Object.assign({}, regOpt);
				delete userToSave.password;
				userToSave.name = regOpt.firstName + ' ' + regOpt.middleName + ' ' + regOpt.lastName;
				return this.saveUser(userToSave, newUid);
			});
	}

	saveUser(user: any, uid: string): Observable<any> {
		let userToSave = Object.assign({}, user);
		let dataToSave = {};
		dataToSave[`users/${uid}`] = userToSave;
		return this.firebaseUpdate(dataToSave);
	}

	findAllUsers(): Observable<User[]> {
		return this.db.list('users').do(console.log)
		.map(User.fromJsonList);
	}

	findUser(uid: string): Observable<User> {
		return this.db.object(`users/${uid}`)
		.map(User.fromJson);
	}

	uploadPfp(pfp: File): Observable<any> {
		if (!this.uid) return Observable.throw('Rip no login info');
		return Observable.from(this.sdkStorage.child(`userPfps/${this.uid}/`).put(pfp))
			.flatMap((snap: any) => {
				let userToSave = Object.assign({}, {pfp: snap.metadata.downloadURLs[0]});
				let dataToSave = {};
				dataToSave[`users/${this.uid}`] = userToSave;
				return this.firebaseUpdate(dataToSave);
			});
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

export interface RegisterOptions {
	firstName: string;
	middleName: string;
	lastName: string;
	email: string;
	password: string;
	name?: string;
}