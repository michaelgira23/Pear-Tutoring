import { Injectable, Inject } from '@angular/core';
import { AngularFire, FirebaseRef, FirebaseAuthState } from 'angularfire2';
import * as firebase from 'firebase';
import { Observable, Subject } from 'rxjs/Rx';

import { AuthService } from '../security/auth.service';
import { UserService } from '../model/user.service';

@Injectable()
export class ChatService {

	// We use the bracket notation here to get around those tricky typings
	timestamp: any = firebase.database['ServerValue']['TIMESTAMP'];
	sdkDb: any;
	authInfo: FirebaseAuthState;
	queue: { chatKey: string, statusKey: string, status: StatusOptions }[] = [];

	constructor(private af: AngularFire, @Inject(FirebaseRef) fb, private authService: AuthService, private userService: UserService) {
		this.sdkDb = fb.database().ref();

		this.authService.auth$.subscribe(
			data => {
				this.authInfo = data;

				// Check if there are any status updates in the queue before authInfo was initialized
				if (typeof this.authInfo !== 'undefined' && this.queue.length > 0) {
					// console.log('handle queue of length', this.queue.length, this.authInfo);
					this.queue.forEach(value => {
						this.sendStatus(value.status, value.chatKey, value.statusKey)
							.subscribe(
								key => {
									// console.log('set status success', key);
								},
								err => {
									console.log('set status error', err);
								}
							);
					});
					this.queue = [];
				}
			},
			err => {
				console.log('auth error chat service', err);
			}
		);
	}

	getAllMessages(chatKey: string): Observable<Message[]> {
		let msgArrTemp: Message[];
		return this.af.database.list(`chatMessages/${chatKey}`).flatMap(msgArr => {
			msgArrTemp = msgArr;
			return Observable.combineLatest(msgArr.map(msg => (this.userService.findUser(msg.from))));
		}).map(userArr => {
			return msgArrTemp.map((msg, msgIndex) => {
				msg.from = userArr[msgIndex];
				return msg;
			});
		});
	}

	getAllStatuses(chatKey: string): Observable<Status[]> {
		let statusArrTemp: Status[];
		return this.af.database.list(`statusMessages/${chatKey}`).flatMap(statusArr => {
			statusArrTemp = statusArr;
			return Observable.combineLatest(statusArr.map(status => (this.userService.findUser(status.user))));
		}).map(userArr => {
			return statusArrTemp.map((status, statusIndex) => {
				status.user = userArr[statusIndex];
				return status;
			});
		});
	}

	createChat(): Observable<any> {
		const chats = this.af.database.list('chats');
		const chatObj: Chat = {
			created: this.timestamp,
			createdBy: this.authInfo ? this.authInfo.uid : null
		};

		return this.observableToPromise(chats.push(chatObj));
	}

	sendMessage(msgText: string, chatKey: string): Observable<any> {
		const chatMessages = this.af.database.list(`chatMessages/${chatKey}`);
		const message: Message = {
			text: msgText,
			from: this.authInfo ? this.authInfo.uid : null,
			time: this.timestamp,
		};
		return this.observableToPromise(chatMessages.push(message));
	}

	sendStatus(statusType: StatusOptions, chatKey: string, key: string = this.sdkDb.push().key): Observable<any> {
		const status: Status = {
			type: statusType,
			time: firebase.database['ServerValue']['TIMESTAMP'],
			user: this.authInfo ? this.authInfo.uid : null,
		};

		if (typeof this.authInfo !== 'undefined') {
			// Insert status into database like normal
			const statusMessages = this.af.database.object(`statusMessages/${chatKey}/${key}`);
			return this.observableToPromise(statusMessages.set(status))
				.map(() => key);
		} else {
			// Add status into queue until authInfo is initialized
			this.queue.push({ status: statusType, chatKey: chatKey, statusKey: key });
			return Observable.of(key);
		}
	}

	private observableToPromise(promise): Observable<any> {

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

}


// We have to add `any` here because of the Firebase `TIMESTAMP`.
export interface Chat {
	created: number | any;
	createdBy: string | any;
}

export interface Message {
	text: string;
	from: string | any;
	time: number | any;
}

export interface Status {
	type: StatusOptions;
	time: number | any;
	user: string | any;
}

export type StatusOptions = 'join' | 'leave';
