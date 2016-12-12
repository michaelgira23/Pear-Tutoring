import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SessionService } from '../shared/model/session.service';
import { Session } from '../shared/model/session';
import { User } from '../shared/model/user';

@Component({
	selector: 'app-session',
	templateUrl: './session.component.html',
	styleUrls: ['./session.component.scss']
})
export class SessionComponent implements OnInit {

	sessionInfo: Session;
	onlineUsers: User[];

	constructor(private route:  ActivatedRoute, private sessionService: SessionService) { }

	ngOnInit() {
		this.route.params.subscribe(val => {
			let sessionId = val['id'];
			this.sessionService.joinSession(sessionId).subscribe(val => {
				this.sessionService.findSession(sessionId).subscribe(val => {
					this.sessionInfo = val;
				}, console.error);
				this.sessionService.getOnlineUsers(sessionId).subscribe(val => {
					this.onlineUsers = val;
				}, console.error);
			}, console.error);
		});
	}

}
