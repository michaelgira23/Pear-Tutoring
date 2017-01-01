import { Component, OnInit } from '@angular/core';
import { NotificationsService } from './shared/model/notifications.service';
import { UserService, UserStatus } from './shared/model/user.service';
import { AuthService } from './shared/security/auth.service';

declare const componentHandler;

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

	constructor (private notificationsService: NotificationsService, private userService: UserService, private auth: AuthService) { }

	ngOnInit() {
		this.notificationsService.init();
		this.auth.auth$.subscribe(val => {
			if (val) {
				this.userService.uid = val.uid;
				this.userService.changeStatus(UserStatus.ONLINE);
			} else {
				if (this.userService.uid) {
					this.userService.changeStatus(UserStatus.OFFLINE);
				}
				this.userService.uid = null;
			}
		});
	}

}
