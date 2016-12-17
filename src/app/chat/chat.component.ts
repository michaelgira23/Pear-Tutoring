import { AuthService } from '../shared/security/auth.service';
import { Component, OnInit, Input } from '@angular/core';
import { ChatService, Message } from '../shared/model/chat.service';
import { FirebaseAuthState } from 'angularfire2';
import { Observable } from 'rxjs';
import { UserService } from '../shared/model/user.service';

@Component({
	selector: 'app-chat',
	templateUrl: './chat.component.html',
	styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnInit {

	@Input('key') chatKey: string = 'anonymous';

	allMessages: Message[];
	authInfo: FirebaseAuthState;

	constructor(private chatService: ChatService, private authService: AuthService, private userService: UserService) { }

	ngOnInit() {
		this.chatService.getAllMessages(this.chatKey).subscribe(
			data => {
				this.allMessages = data;
				this.allMessages.sort((a, b) => {
					return a.time - b.time;
				});
			},
			err => {
				console.log(`Getting chat messages error: ${err}`);
			}
		);

		this.authService.auth$.subscribe(
			data => {
				this.authInfo = data;
			},
			err => {
				console.log(`Getting auth data error: ${err}`);
			}
		);
	}

	getName(uid: string): Observable<any> {
		return this.userService.findUser(uid).map(user => {
			console.log(user);
			return user.name ? user.name : 'an anonymous user';
		});
	}

	sendMessage(message: string) {
		this.chatService.sendMessage({
			chat: this.chatKey ? this.chatKey : null,
			text: message,
			from: this.authInfo ? this.authInfo.uid : null,
			time: new Date().getTime()
		});
	}
}
