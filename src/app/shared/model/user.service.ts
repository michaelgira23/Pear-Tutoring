import { Injectable, Inject } from '@angular/core';
import { AngularFireDatabase, FirebaseRef } from 'angularfire2';
import { AuthService } from '../security/auth.service';
import { Observable, Subject } from 'rxjs/Rx';
import { User } from './user';
import { arrToObj, objToArr } from './session.service';

export const userStatus = {
	IN_SESSION: 2,
	ONLINE: 1,
	OFFLINE: 0
};

@Injectable()
export class UserService {

	sdkDb: any;
	sdkStorage: any;
	uid: string;
	status: number;

	constructor(@Inject(FirebaseRef) fb, private db: AngularFireDatabase, private auth: AuthService) {
		this.sdkDb = fb.database().ref();
		this.sdkStorage = fb.storage().ref();
		auth.auth$.subscribe(val => {
			if (val) {
				this.uid = val.uid;
				console.log('get uid: ' +  this.uid);
				this.changeStatus(userStatus.ONLINE);
				this.sdkDb.child(`users/${this.uid}/status`).onDisconnect().set(userStatus.OFFLINE);
			} else {
				this.changeStatus(userStatus.OFFLINE);
			}
		});
	}

	register(regOpt: RegisterOptions): Observable<any> {
		return this.auth.register(regOpt.email, regOpt.password)
			.flatMap(val => {
				const newUid = val.uid;
				let userToSave = Object.assign({}, regOpt);
				delete userToSave.password;
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
		return this.db.list('users')
		.map(User.fromJsonList);
	}

	findUser(uid: string): Observable<User> {
		return this.db.object(`users/${uid}`)
		.map(User.fromJson);
	}

	uploadPfp(pfp: File): Observable<any> {
		if (!this.uid) { return Observable.throw('Rip no login info'); }
		return Observable.from(this.sdkStorage.child(`userPfps/${this.uid}/`).put(pfp))
			.flatMap((snap: any) => {
				let userToSave = Object.assign({}, {pfp: snap.metadata.downloadURLs[0]});
				let dataToSave = {};
				dataToSave[`users/${this.uid}`] = userToSave;
				return this.firebaseUpdate(dataToSave);
			});
	}

	changeStatus(status: number): void {
		if (this.status !== status) {
			if (status === userStatus.ONLINE || status === userStatus.OFFLINE || status === userStatus.IN_SESSION) {
				status = this.uid ? status : userStatus.OFFLINE;
				console.log(status);
				this.db.object(`users/${this.uid}`).update({status}).then(val => this.status = status);
			}
		}
	}

	getFreeTimes(): Observable<FreeTimes> {
		return this.db.list(`freeTimesByUsers/${this.uid}/`)
			.map(freeTimes => {
				let temp = {};
				for (let day in freeTimes) {
					if (temp[day]) {
						temp[day] = {
							from: freeTimes[day].$key.substr(0, 13),
							to: freeTimes[day].$key.substr(13, 13)
						};
					}
				}
				return temp;
			});
	}

	addFreeTime(day: string, time: FreeTime): Observable<any> {
		let concatTime = '' + time.from + time.to;
		let pushData = {};
		pushData[concatTime] = true;
		return this.promiseToObservable(this.db.object(`freeTimesByUsers/${this.uid}/${day}`).update(pushData));
	}

	removeFreeTime(day: string, time: FreeTime): Observable<any> {
		let concatTime = '' + time.from + time.to;
		return this.promiseToObservable(this.db.list(`freeTimesByUsers/${this.uid}/${day}`).remove(concatTime));
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
}

export interface RegisterOptions {
	firstName: string;
	middleName: string;
	lastName: string;
	email: string;
	password: string;
	name?: string;
}

export interface FreeTimes {
	[dayInWeek: string]: FreeTime[];
};

export interface FreeTime {from: number; to: number; };
