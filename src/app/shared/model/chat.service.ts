import { Injectable } from '@angular/core';
import { AngularFire, FirebaseAuthState } from 'angularfire2';
import { Observable } from 'rxjs/Rx';

import { AuthService } from '../security/auth.service';
import { UserService } from '../model/user.service';

@Injectable()
export class ChatService {

	authInfo: FirebaseAuthState;

	constructor(private af: AngularFire, private authService: AuthService, private userService: UserService) {
		this.authService.auth$.subscribe(
			data => {
				this.authInfo = data;
			},
			err => {
				console.log('auth error chat service', err);
			}
		);
	}

	getAllMessages(chatKey: string): Observable<Message[]> {
		let msgArrTemp: Message[];
		return this.af.database.list('chatMessages', {
			query: {
				orderByChild: 'chat',
				equalTo: chatKey
			}
		}).flatMap(msgArr => {
			msgArrTemp = msgArr;
			return Observable.combineLatest(msgArr.map(msg => (this.userService.findUser(msg.from))));
		}).map(userArr => {
			return msgArrTemp.map((msg, msgIndex) => {
				msg.from = userArr[msgIndex];
				return msg;
			});
		});
	}

	createChat(chat: any): Observable<any> {
		const chats = this.af.database.list('chat');
		const chatObj: Chat = {
			created: Date.now(),
			createdBy: this.authInfo ? this.authInfo.uid : null
		};

		return Observable.from([chats.push(chatObj)]);
	}

	sendMessage(options: MessageOptions): Observable<any> {
		const chatMessages = this.af.database.list('chatMessages');
		const message: Message = Object.assign({
			from: this.authInfo ? this.authInfo.uid : null,
			time: Date.now()
		}, options);
		return Observable.from([chatMessages.push(message)]);
	}

}

export interface Chat {
	created: number;
	createdBy: string;
}

export interface Message {
	chat: string;
	text: string;
	from: string;
	time: number;
}

export interface MessageOptions {
	chat: string;
	text: string;
}
