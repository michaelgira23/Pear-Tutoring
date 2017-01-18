import { Component, OnInit, ViewChild } from '@angular/core';
import { Subject } from 'rxjs/Rx';
import { ActivatedRoute, Router } from '@angular/router';
import { SessionService } from '../../shared/model/session.service';
import { Session, SessionRating } from '../../shared/model/session';
import { ModalComponent } from '../../shared/common/modal/modal.component';

@Component({
	selector: 'app-session-rating',
	templateUrl: './session-rating.component.html',
	styleUrls: ['./session-rating.component.scss']
})
export class SessionRatingComponent implements OnInit {

	sessionId: string;
	sessionInfo: Session;
	ratingModel: SessionRating = {
		rating: undefined,
		comment: ''
	};

	@ViewChild(ModalComponent) modal: ModalComponent;

	submitted$ = new Subject<boolean>();

	constructor(private route: ActivatedRoute, private sessionService: SessionService, private router: Router) { }

	ngOnInit() {
		this.modal.show();
		this.sessionId = this.route.snapshot.params['id'];
		this.sessionService.findSession(this.sessionId).subscribe((session: Session) => {
			this.sessionInfo = session;
			if (session.rating) {
				this.ratingModel = session.rating[this.sessionService.uid];
			}
		});
	}

	closeModal(submitted: boolean, e?: Event) {
		if (e) {e.stopPropagation(); };
		this.modal.hide();
		this.submitted$.next(submitted);
	}

	submitRating() {
		this.sessionService.changeRating(this.sessionId, this.sessionService.uid, this.ratingModel).subscribe(
			val => {
				this.closeModal(true);
			},
			err => {console.log(err); }
		);
	}

}
