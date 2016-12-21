import { Injectable } from '@angular/core';
import { AngularFire, FirebaseAuthState, FirebaseListObservable } from 'angularfire2';
import { Observable } from 'rxjs/Rx';

import { AuthService } from '../security/auth.service';

@Injectable()
export class ChatService {

	authInfo: FirebaseAuthState;

	constructor(private af: AngularFire, private authService: AuthService) {
		this.authService.auth$.subscribe(
			data => {
				this.authInfo = data;
			},
			err => {
				console.log('auth error chat service', err);
			}
		);
	}

	getAllMessages(chatKey: string): FirebaseListObservable<any> {
		return this.af.database.list('chatMessages', {
			query: {
				orderByChild: 'chat',
				equalTo: chatKey
			}
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

	sendMessage(message: Message): Observable<any> {
		const chatMessages = this.af.database.list('chatMessages');
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
