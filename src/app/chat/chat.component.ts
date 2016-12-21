import { Component, OnInit, Input } from '@angular/core';

import { ChatService, Message } from '../shared/model/chat.service';
import { UserService } from '../shared/model/user.service';

@Component({
	selector: 'app-chat',
	templateUrl: './chat.component.html',
	styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnInit {

	@Input() key: string = 'anonymous';

	allMessages: Message[];

	constructor(private chatService: ChatService, private userService: UserService) { }

	ngOnInit() {
		this.chatService.getAllMessages(this.key).subscribe(
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
	}

	sendMessage(message: string) {
		this.chatService.sendMessage({
			chat: this.key ? this.key : null,
			text: message
		});
	}
}
