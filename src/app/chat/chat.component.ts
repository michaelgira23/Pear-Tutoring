import { Component, OnInit, Input } from '@angular/core';
import { ChatService, Message } from '../shared/model/chat.service';
import { User } from '../shared/model/user';

@Component({
	selector: 'app-chat',
	templateUrl: './chat.component.html',
	styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnInit {

	@Input('chatKey') chatKey: string;

	allMessages: Message[];

	constructor(private chatService: ChatService) { }

	ngOnInit() {
		this.chatService.getAllMessages(this.chatKey).subscribe(
			data => {
				this.allMessages = data;
			},
			err => {
				console.log(`Getting chat messages error: ${err}`);
			}
		);
	}

	sendMessage(message: string) {
		this.chatService.sendMessage({
			chat: this.chatKey || 'test',
			text: message,
			from: new User('test', 'hello world', 'test@example.com', false, {'test': true}, {'test': true}),
			time: new Date().getTime()
		});
	}
}
