import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SessionService } from '../shared/model/session.service';
import { Session } from '../shared/model/session';
import { User } from '../shared/model/user';
import { UserService, userStatus } from '../shared/model/user.service';
import { WhiteboardComponent } from '../whiteboard/whiteboard.component';

@Component({
	selector: 'app-session',
	templateUrl: './session.component.html',
	styleUrls: ['./session.component.scss']
})
export class SessionComponent implements OnInit, OnDestroy {

	sessionId: string;
	sessionExist: boolean;
	sessionInfo: Session;
	onlineUsers: User[] = [];

	constructor(private route:  ActivatedRoute, private sessionService: SessionService, private userService: UserService) { }

	ngOnInit() {
		this.route.params.subscribe(val => {
			this.sessionId = val['id'];
			this.sessionService.findSession(this.sessionId).take(1).subscribe(val => {
				this.sessionExist = true;
				this.sessionInfo = val;
				this.sessionService.joinSession(this.sessionId).subscribe(val => {}, console.error,
				() => {
					this.sessionService.getOnlineUsers(this.sessionId).subscribe(val => {
						let allUsers = this.sessionInfo.tutees.concat(this.sessionInfo.tutor);
						// The online state is just [uid]:boolean i wanted to preserve the boolean that represented the online state so i didn't convert the uid into a user object
						let onlineUsers = [];
						val.forEach(userOnlineState => {
							if (userOnlineState.$value) {
								onlineUsers.push(allUsers.find(user => user.$key === userOnlineState.$key));
							}
						});
						this.onlineUsers = onlineUsers;
					}, console.error);
				});
			},
			err => {
				console.error(err);
				this.sessionExist = false;
			});
		}, console.error);
	}

	ngOnDestroy() {
		this.sessionService.leaveSession(this.sessionInfo.$key);
	}
}
