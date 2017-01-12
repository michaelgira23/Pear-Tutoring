import { Component, HostListener, OnInit, OnChanges, OnDestroy, SimpleChanges, Input } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

import { ChatService, Message, Status } from '../shared/model/chat.service';
import { NamePipe } from '../shared/model/name.pipe';
import { NotificationsService } from '../shared/model/notifications.service';
import { PermissionsService } from '../shared/security/permissions.service';
import { UserService } from '../shared/model/user.service';

declare global {
	interface Array<T> {
		includes(searchElement: T): boolean;
	}

	const MathJax: any;
}

@Component({
	selector: 'app-chat',
	templateUrl: './chat.component.html',
	styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnInit, OnChanges, OnDestroy {

	@Input()
	key: string = 'anonymous';
	keyChanged: boolean;

	mathMode: boolean = false;

	messageSubscription: any;
	statusSubscription: any;
	permissionsSubscription: any;

	messageKeys: string[] = [];
	allMessages: Message[] = [];
	allStatuses: Status[] = [];
	allEntries: (Message|Status)[] = [];

	// Default values before permissions arrive
	currentPerms: Object = {
		read: true
	};

	constructor(
		private chatService: ChatService,
		private sanitizer: DomSanitizer,
		private notificationsService: NotificationsService,
		private permissionsService: PermissionsService,
		private userService: UserService
	) {	}

	ngOnInit() {
		this.chatService.sendStatus('join', this.key).subscribe(
			data => {},
			err => {
				console.log(`Sending 'join' status error: ${err}`);
			}
		);

		this.reTypeset();
	}

	ngOnChanges(changes: SimpleChanges) {
		if (changes['key'] && changes['key'].currentValue !== changes['key'].previousValue) {
			this.keyChanged = true;

			if (this.messageSubscription) {
				this.messageSubscription.unsubscribe();
				this.messageSubscription = null;
			}
			if (this.statusSubscription) {
				this.statusSubscription.unsubscribe();
				this.statusSubscription = null;
			}
			if (this.permissionsSubscription) {
				this.permissionsSubscription.unsubscribe();
				this.permissionsSubscription = null;
			}

			this.messageSubscription = this.chatService.getAllMessages(this.key).subscribe(
				data => {
					if (!this.keyChanged) {
						for (let msg of data) {
							// We have to use a type assertion here because the `Message` interface doesn't have a `$key` field.
							// However, the object returned by Firebase actually *does*.
							if (!this.messageKeys.includes((<any>msg).$key)) {
								this.notificationsService.send(
									'New message',
									this.notificationFormat(msg)
								);
							}
						}
					} else {
						this.keyChanged = false;
					}

					for (let msg of data) {
						// See line 61.
						this.messageKeys.push((<any>msg).$key);
					}

					this.allMessages = data;
					this.reTypeset();
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

			this.permissionsSubscription = this.permissionsService.getUserPermission(this.key, 'chat').subscribe(
				data => {
					this.currentPerms = data;
				},
				err => {
					console.log(`Error getting current permission state: ${err}`);
				}
			);
		}
	}

	@HostListener('window:unload')
	ngOnDestroy() {
		this.chatService.sendStatus('leave', this.key).subscribe(
			data => {},
			err => {
				console.log(`Sending 'leave' status error: ${err}`);
			}
		);
	}

	send(message: string) {
		// Escape extra backtick characters, since we don't want them to be interpreted as AsciiMath.
		let formattedMessage = message.replace(/`/g, '&#96;');

		if (this.mathMode) {
			// If we're in math input mode, surround the message in backticks so it gets interpreted as AsciiMath.
			formattedMessage = '`' + formattedMessage + '`';
		}

		this.chatService.sendMessage(formattedMessage, this.key).subscribe(
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

	reTypeset() {
		let containsBackticks = this.allMessages.some((msg, _, __) => {
			return msg.text.includes('`');
		});

		if (containsBackticks) {
			// TODO: Only re-typeset the new messages. At the moment, this re-typesets everything on the page.
			MathJax.Hub.Queue(['Typeset', MathJax.Hub]);
		}
	}

	msgFormat(msg: Message) {
		let name = new NamePipe().transform(msg.from, true);
		let text = this.sanitizer.bypassSecurityTrustHtml(msg.text);
		return `From ${name}: ${text}`;
	}

	notificationFormat(msg: Message) {
		const truncateLength = 100;

		let notificationMsg = this.msgFormat(msg);

		let result = notificationMsg.substring(0, truncateLength);

		// Don't add an ellipsis unless the message actually has to be truncated.
		if (result.length > truncateLength) {
			result += '...';
		}
		return result;
	}
}
