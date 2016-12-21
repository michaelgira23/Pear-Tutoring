import { Component, OnInit, OnChanges, SimpleChanges, Input, ViewChild } from '@angular/core';

import { ChatService, Message } from '../shared/model/chat.service';
import { UserService } from '../shared/model/user.service';

@Component({
	selector: 'app-chat',
	templateUrl: './chat.component.html',
	styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnInit, OnChanges {

	@Input() key: string = 'anonymous';

	chatSubscription: any;

	allMessages: Message[];

	constructor(private chatService: ChatService, private userService: UserService) { }

	ngOnInit() {
	}

	ngOnChanges(changes: SimpleChanges) {
		if (changes['key'] && changes['key'].currentValue !== changes['key'].previousValue) {
			if (this.chatSubscription) {
				this.chatSubscription.unsubscribe();
				this.chatSubscription = null;
			}

			this.chatSubscription = this.chatService.getAllMessages(this.key).subscribe(
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
	}

	onKeyPress(event: KeyboardEvent) {
		if (event.key == 'Enter') {
			let message = <HTMLInputElement>event.target;
			this.send(message);
		}
	}

	send(message: HTMLInputElement) {
		if (message.value) {
			this.chatService.sendMessage(message.value, this.key).subscribe(
				data => {
					message.value = null;
				},
				err => {
					console.log(`Sending message error: ${err}`);
				}
			);
		}
	}
}
