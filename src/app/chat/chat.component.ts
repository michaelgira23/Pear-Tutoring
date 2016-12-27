import { Component, HostListener, OnInit, OnChanges, OnDestroy, SimpleChanges, Input } from '@angular/core';

import { ChatService, Message, Status } from '../shared/model/chat.service';
import { NamePipe } from '../shared/model/name.pipe';
import { NotificationsService } from '../shared/model/notifications.service';
import { UserService } from '../shared/model/user.service';

@Component({
	selector: 'app-chat',
	templateUrl: './chat.component.html',
	styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnInit, OnChanges, OnDestroy {

	@Input() key: string = 'anonymous';
	keyChanged: boolean;

	messageSubscription: any;
	statusSubscription: any;

	allMessages: Message[] = [];
	allStatuses: Status[] = [];
	allEntries: (Message|Status)[] = [];

	constructor(private chatService: ChatService, private notificationsService: NotificationsService, private userService: UserService) { }

	ngOnInit() {
		this.chatService.sendStatus('join', this.key).subscribe(
			data => {},
			err => {
				console.log(`Sending 'join' status error: ${err}`);
			}
		);
	}

	ngOnChanges(changes: SimpleChanges) {
		console.log('ngOnChanges fired');
		if (changes['key'] && changes['key'].currentValue !== changes['key'].previousValue) {
			console.log('key changed');
			this.keyChanged = true;

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
					console.log('getAllMessages observable fired');
					if (!this.keyChanged) {
						console.log('we detected a new message');
						this.keyChanged = false;
						for (let msg of data) {
							this.notificationsService.send(
								'New message',
								this.notificationFormat(msg)
							);
						}
					}
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
		} else {
			console.log('ngOnChanges fired, key hasn\'t changed');
			this.keyChanged = false;
		}
	}

	@HostListener('window:unload') ngOnDestroy() {
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
		this.allEntries = [].concat(this.allMessages, this.allStatuses);
		this.allEntries.sort((a, b) => {
			return a.time - b.time;
		});
	}

	isMessage(x: any): x is Message {
		return 'text' in x;
	}

	isStatus(x: any): x is Status {
		return 'type' in x;
	}

	statusVerb(status: Status) {
		if (status.type === 'join') {
			return 'joined';
		} else if (status.type === 'leave') {
			return 'left';
		}
	}

	notificationFormat(msg: Message) {
		const truncateLength = 100;

		let name = new NamePipe().transform(msg.from, true);
		let notificationMsg = `From ${name}: ${msg.text}`;

		let result = notificationMsg.substring(0, truncateLength);

		if (result.length < truncateLength - 3) {
			result += '...';
		}
		return result;
	}
}
