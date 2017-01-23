import { Injectable, Inject } from '@angular/core';
import { AngularFireDatabase, FirebaseRef } from 'angularfire2';
import { AuthService } from '../security/auth.service';
import { Observable, Subject } from 'rxjs/Rx';
import { User } from './user';
import { objToArr, getEditDistance } from '../common/utils';
import * as moment from 'moment';
import * as firebase from 'firebase';

export const UserStatus = {
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

	user$: Observable<User>;

	constructor(@Inject(FirebaseRef) fb, private db: AngularFireDatabase, private authService: AuthService) {
		this.sdkDb = fb.database().ref();
		this.sdkStorage = fb.storage().ref();

		this.user$ = this.authService.auth$
			.switchMap(authInfo => {
				if (authInfo) {
					return this.findUser(authInfo.auth.uid);
				}
				return Observable.of(<undefined|null>authInfo);
			});
	}

	register(regOpt: RegisterOptions): Observable<any> {
		return this.authService.register(regOpt.email, regOpt.password)
			.flatMap(val => {
				const newUid = val.uid;
				let userToSave = Object.assign({}, regOpt, {registerTime: firebase.database.ServerValue.TIMESTAMP});
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

	searchUsersByName(str: string): Observable<User[]> {
		return this.db.list(`users`)
		.map(User.fromJsonList)
		.map(users => {
			return users.filter(user => {
				// getEditDistance(user.firstName, str) < str.length / 2 || getEditDistance(user.lastName, str) < str.length / 2
				return getEditDistance(user.name, str) < str.length / 2;
			});
		});
	}

	uploadPfp(pfp: File): Observable<any> {
		if (!this.uid) {return Observable.throw('rip no login info'); }
		return this.promiseToObservable(this.sdkStorage.child(`userPfps/${this.uid}/`).put(pfp))
			.flatMap((snap: any) => {
				return this.promiseToObservable(
					this.db.object(`users/${this.uid}`).update({ pfp: snap.metadata.downloadURLs[0] })
				);
			});
	}

	changeStatus(status: number): void {
		if (this.status !== status) {
			if (status === UserStatus.ONLINE || status === UserStatus.OFFLINE || status === UserStatus.IN_SESSION) {
				status = this.uid ? status : UserStatus.OFFLINE;
				this.sdkDb.child(`users/${this.uid}/status`).onDisconnect().cancel();
				this.sdkDb.child(`users/${this.uid}/status`).onDisconnect().set(UserStatus.OFFLINE);
				this.db.object(`users/${this.uid}`).update({status}).then(val => this.status = status);
			}
		}
	}

	getFreeTimes(): Observable<FreeTimes> {
		return this.authService.auth$.flatMap(state => {
			if (state) {
				return this.db.object(`freeTimesByUsers/${this.uid}/`)
					.map(freeTimes => {
						let temp = Object.assign({}, freeTimes);
						delete temp.$key;
						delete temp.$exists;
						delete temp.$value;
						for (let day in temp) {
							if (temp[day]) {
								temp[day] = [];
								objToArr(freeTimes[day]).forEach(val => {
									temp[day].push({
										from: moment(val.substr(0, 13), 'x'),
										to: moment(val.substr(13, 13), 'x')
									});
								});
							}
						}
						return temp;
					});
			}
			return Observable.of(undefined);
		});
	}

	addFreeTime(day: string, time: {from: number, to: number}): Observable<any> {
		let concatTime = '' + time.from + time.to;
		let pushData = {};
		pushData[concatTime] = true;
		return this.promiseToObservable(this.db.object(`freeTimesByUsers/${this.uid}/${day}`).update(pushData));
	}

	removeFreeTime(day: string, time: FreeTime): Observable<any> {
		let concatTime = '' + time.from.valueOf() + time.to.valueOf();
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
	lastName: string;
	email: string;
	password: string;
	goodAt: string[];
	needsHelp: string[];
}

export interface FreeTimes {
	[dayInWeek: string]: FreeTime[];
};

export interface FreeTime {from: moment.Moment; to: moment.Moment; };
