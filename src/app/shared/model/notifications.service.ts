import { Injectable } from '@angular/core';

declare const Notification: any;

@Injectable()
export class NotificationsService {

	support: boolean = 'Notification' in window;

	constructor() { }

	// `init()` stays separate from the `constructor()` since we don't want this to run every single time
	// that we create a new instance of this class.
	init() {
		// There's no `.then()` clause here, since the Notifications API puts the permissions granted into a global `Notification.permission`.
		Notification.requestPermission().catch(err => {
			console.log(`Error getting notifications permission: ${err}`);
		});
	}

	send(title: string, body?: string) {
		if (this.support && Notification.permission === 'granted') {
			let n = new Notification(title, {body});

			// Automatically closes the notification after 4 seconds
			setTimeout(n.close.bind(n), 4000);
		}
	}
}
