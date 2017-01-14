import { Component, OnInit, ViewChild } from '@angular/core';
import { SessionService } from '../../shared/model/session.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ModalComponent } from '../../shared/common/modal/modal.component';

@Component({
	selector: 'app-session-request',
	templateUrl: './session-request.component.html',
	styleUrls: ['./session-request.component.scss']
})
export class SessionRequestComponent implements OnInit {

	@ViewChild(ModalComponent) modal: ModalComponent;

	sessionId: string;

	pendingUsers: any[];

	constructor(private sessions: SessionService, private route: ActivatedRoute, private router: Router) { }

	ngOnInit() {
		this.modal.show();
		this.sessionId = this.route.parent.snapshot.params['id'];
		if (this.sessionId) {
			this.sessions.getPendingTutees(this.sessionId)
			.subscribe(tutees => {
				this.pendingUsers = tutees;
			}, console.log);
		} else {
			console.log('cannot find session id in the route');
		}
	}

	addTutee(id: string) {
		this.sessions.addTutees(this.sessionId, id).subscribe(val => {
			console.log('enrolled pending tutee');
		}, console.log);
	}

	closeModal(e: Event) {
		e.stopPropagation();
		this.modal.hide();
		this.router.navigate(['../'], {relativeTo: this.route});
	}

}
