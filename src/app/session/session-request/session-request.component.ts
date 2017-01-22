import { Component, OnInit, Renderer, AfterViewInit } from '@angular/core';
import { SessionService } from '../../shared/model/session.service';
import { ActivatedRoute, Router } from '@angular/router';
import { SessionPopup } from '../session-popup';

@Component({
	selector: 'app-session-request',
	templateUrl: './session-request.component.html',
	styleUrls: ['./session-request.component.scss']
})
export class SessionRequestComponent extends SessionPopup implements OnInit, AfterViewInit {

	sessionId: string;

	pendingUsers: any[];

	constructor(private sessionService: SessionService, private route: ActivatedRoute, private router: Router, protected renderer: Renderer) {
		super(renderer);
	}

	ngOnInit() {
		this.sessionId = this.route.snapshot.params['id'];
		if (this.sessionId) {
			this.sessionService.getPendingTutees(this.sessionId)
			.subscribe(tutees => {
				this.pendingUsers = tutees;
			}, console.log);
		} else {
			console.log('cannot find session id in the route');
		}
	}

	addTutee(id: string) {
		this.sessionService.addTutees(this.sessionId, id).subscribe(val => {
			console.log('enrolled pending tutee');
		}, console.log);
	}

	denyTutee(id: string) {
		this.sessionService.denyPending(this.sessionId, id).subscribe(val => {
			console.log('denied pending tutee');
		}, console.log);
	}

}
