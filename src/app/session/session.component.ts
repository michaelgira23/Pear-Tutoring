import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SessionService } from '../shared/model/session.service';
import { Session } from '../shared/model/session';
import { User } from '../shared/model/user';
import { WhiteboardComponent } from '../whiteboard/whiteboard.component';

@Component({
	selector: 'app-session',
	templateUrl: './session.component.html',
	styleUrls: ['./session.component.scss']
})
export class SessionComponent implements OnInit {

	sessionExist: boolean;
	sessionInfo: Session;
	onlineUsers: User[];

	constructor(private route:  ActivatedRoute, private sessionService: SessionService) { }

	ngOnInit() {
		this.route.params.subscribe(val => {
			let sessionId = val['id'];
			this.sessionService.findSession(sessionId).subscribe(val => {
					this.sessionExist = true;
					this.sessionInfo = val;
					this.sessionService.joinSession(sessionId).subscribe(val => {
					}, console.error);
					this.sessionService.getOnlineUsers(sessionId).subscribe(val => {
						this.onlineUsers = val;
					}, console.error);
			},
			err => {
				console.error(err);
				this.sessionExist = false;
			});
		});
	}

}
