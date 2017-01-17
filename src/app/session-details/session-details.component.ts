import { Component, OnInit } from '@angular/core';
import { ActivatedRouteSnapshot } from '@angular/router';
import { SessionService } from '../shared/model/session.service';
import { Session } from '../shared/model/session';

@Component({
	selector: 'app-session-details',
	templateUrl: './session-details.component.html',
	styleUrls: ['./session-details.component.scss']
})
export class SessionDetailsComponent implements OnInit {

	sessionId: string;
	sessionInfo: Session;

	constructor(private route: ActivatedRouteSnapshot, private sessionService: SessionService) { }

	ngOnInit() {
		this.sessionId = this.route.params['id'];
		this.sessionService.findSession(this.sessionId).subscribe();
	}

}
