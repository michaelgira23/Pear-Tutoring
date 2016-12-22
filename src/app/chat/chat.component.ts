import { Component, OnInit, OnChanges, OnDestroy, SimpleChanges, Input, ViewChild } from '@angular/core';

import { ChatService, Message, Status } from '../shared/model/chat.service';
import { UserService } from '../shared/model/user.service';

@Component({
	selector: 'app-chat',
	templateUrl: './chat.component.html',
	styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnInit, OnChanges, OnDestroy {

	@Input() key: string = 'anonymous';

	messageSubscription: any;
	statusSubscription: any;

	allMessages: Message[];
	allStatuses: Status[];
	allEntries: (Message|Status)[] = [];

	constructor(private chatService: ChatService, private userService: UserService) { }

	ngOnInit() {
		this.chatService.sendStatus('join', this.key).subscribe(
			data => {},
			err => {
				console.log(`Sending 'join' status error: ${err}`);
			}
		);
	}

	ngOnChanges(changes: SimpleChanges) {
		if (changes['key'] && changes['key'].currentValue !== changes['key'].previousValue) {
			if (this.messageSubscription) {
				this.messageSubscription.unsubscribe();
				this.messageSubscription = null;
			}
			if (this.statusSubscription) {
				this.statusSubscription.unsubscribe();
				this.statusSubscription = null;
			}

			this.messageSubscription = this.chatService.getAllMessages(this.key).subscribe(
				data => {
					this.allMessages = data;
					this.mergeEntries();
				},
				err => {
					console.log(`Getting chat messages error: ${err}`);
				}
			);

			this.statusSubscription = this.chatService.getAllStatuses(this.key).subscribe(
				data => {
					this.allStatuses = data;
					this.mergeEntries();
				},
				err => {
					console.log(`Getting chat statuses error: ${err}`);
				}
			);
		}
	}

	ngOnDestroy() {
		this.chatService.sendStatus('leave', this.key).subscribe(
			data => {},
			err => {
				console.log(`Sending 'leave' status error: ${err}`);
			}
		);
	}

	send(message: string) {
		this.chatService.sendMessage(message, this.key).subscribe(
			data => {},
			err => {
				console.log(`Sending message error: ${err}`);
			}
		);
	}

	mergeEntries() {
		console.log('this.allMessages and this.allStatuses', this.allMessages, this.allStatuses);
		this.allEntries = this.allEntries.concat(this.allMessages, this.allStatuses);
		console.log('this.allEntries before sort', this.allEntries);
		this.allEntries.sort((a, b) => {
			return a.time - b.time;
		});
		console.log('this.allEntries after sort', this.allEntries);
	}

	isMessage(x: any): x is Message {
		return 'text' in x;
	}

	isStatus(x: any): x is Status {
		return 'type' in x;
	}

	statusVerb(status: Status) {
		if (status.type == 'join') {
			return 'joined';
		} else if (status.type == 'leave') {
			return 'left';
		}
	}
}
