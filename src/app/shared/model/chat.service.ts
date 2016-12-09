import { Injectable, Inject } from '@angular/core';
import { Observable, Subject } from 'rxjs/Rx';
import { AngularFireDatabase, FirebaseRef } from 'angularfire2';
import { User } from './user';


@Injectable()
export class ChatService {

	sdkDb: any;

	constructor(@Inject(FirebaseRef) fb, private db: AngularFireDatabase) {
		this.sdkDb = fb.database().ref();
	}

	getAllMessages(chatKey: string): Observable<any[]> {
		return this.db.list('chatMessages', {
			query: {
				orderByChild: 'chat',
				equalTo: chatKey
			}
		});
	}

	createChat(chat: any): Observable<any> {
		let chatToSave = Object.assign({}, chat);
		let newChatKey = this.sdkDb.child('chats').push().key;

		let dataToSave = {};
		dataToSave[`chats/${newChatKey}`] = chatToSave;
		return this.firebaseUpdate(dataToSave);
	}

	sendMessage(message: Message): Observable<any> {
		let msgToSave = Object.assign({}, message);
		let newMsgKey = this.sdkDb.child('chatMessages').push().key;

		let dataToSave = {};
		dataToSave[`chatMessages/${newMsgKey}`] = msgToSave;
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

export interface Message {
	chat: string,
	text: string,
	from: User,
	time: number
}