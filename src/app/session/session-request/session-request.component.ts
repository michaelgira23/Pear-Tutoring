import { Component, OnInit } from '@angular/core';
import { SessionService } from '../../shared/model/session.service';
import { Session } from '../../shared/model/session';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs/Rx';

@Component({
	selector: 'app-session-request',
	templateUrl: './session-request.component.html',
	styleUrls: ['./session-request.component.scss']
})
export class SessionRequestComponent implements OnInit {

	sessionId: string;

	pendingUsers: any[];

	constructor(private sessions: SessionService, private route: ActivatedRoute) { }

	ngOnInit() {
		this.route.params.flatMap(params => {
			if (params['id']) {
				this.sessionId = params['id'];
				return this.sessions.getPendingTutees(params['id']);
			}
			return Observable.throw('cannot find session id');
		}).subscribe(tutees => {
			this.pendingUsers = tutees;
		}, console.log);
	}

	addTutee(id: string) {
		this.sessions.addTutees(this.sessionId, id).subscribe(val => {
			console.log('enrolled pending tutee');
		}, console.log);
	}

}
