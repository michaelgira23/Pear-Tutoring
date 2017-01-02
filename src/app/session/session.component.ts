import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SessionService } from '../shared/model/session.service';
import { Session } from '../shared/model/session';
import { User } from '../shared/model/user';
import { UserService } from '../shared/model/user.service';
import { Whiteboard } from '../shared/model/whiteboard';

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
	findSession$;

	selectedWbIndex: number = 0;
	get selectedWb(): Whiteboard {
		return this.sessionInfo.whiteboards[this.selectedWbIndex];
	};

	constructor(private route:  ActivatedRoute, private sessionService: SessionService, private userService: UserService) { }

	ngOnInit() {
		this.route.params.subscribe(params => {
			this.sessionId = params['id'];
			this.findSession$ = this.sessionService.findSession(this.sessionId).subscribe(session => {
				this.sessionExist = true;
				this.sessionInfo = session;
				this.sessionService.joinSession(this.sessionId).subscribe(data => {}, console.error,
				() => {
					this.sessionService.getOnlineUsers(this.sessionId).subscribe(userIds => {
						let allUsers = this.sessionInfo.tutees.concat(this.sessionInfo.tutor);
						// The online state is [uid]:boolean. i wanted to preserve the boolean that 
						// represented the online state so i didn't convert the uid into a user object
						let onlineUsers = [];
						userIds.forEach(userOnlineState => {
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
		this.findSession$.unsubscribe();
		this.sessionService.leaveSession(this.sessionInfo.$key);
	}

	addWb() {
		this.sessionService.addWb(this.sessionId).subscribe(val => {
			this.selectedWbIndex = this.sessionInfo.whiteboards.length - 1;
			console.log('added Whiteboard');
		}, console.log);
	}

	deleteWb() {
		if (this.selectedWb || this.sessionInfo.whiteboards.length > 0) {
			this.sessionService.deleteWb(this.sessionId, this.selectedWb.$key).subscribe(val => {
				this.selectedWbIndex -= 1;
				console.log(this.selectedWb);
				console.log('deleted whiteboard');
			}, console.log);
		}
	}
}
