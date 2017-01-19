import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SessionService } from '../shared/model/session.service';

@Component({
	selector: 'app-session-details',
	templateUrl: './session-details.component.html',
	styleUrls: ['./session-details.component.scss']
})
export class SessionDetailsComponent implements OnInit {

	sessionId: string;
	sessionInfo: any;

	get canRate(): boolean {
		return this.sessionInfo.tutees.find(tutee => {
			return tutee.$key === this.sessionService.uid;
		}) || true;
	}

	constructor(private route: ActivatedRoute, private sessionService: SessionService) { }

	ngOnInit() {
		this.sessionId = this.route.snapshot.params['id'];
		this.sessionService.combineWithRatings(this.sessionService.findSession(this.sessionId)).subscribe(
			session => {
				this.sessionInfo = session;
				console.log(session);
			}
		);
	}

}
