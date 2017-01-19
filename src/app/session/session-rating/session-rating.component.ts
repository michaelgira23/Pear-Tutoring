import { Component, OnInit, ViewChild } from '@angular/core';
import { Subject } from 'rxjs/Rx';
import { ActivatedRoute, Router } from '@angular/router';
import { SessionService } from '../../shared/model/session.service';
import { Session, SessionRating } from '../../shared/model/session';
import { ModalComponent } from '../../shared/common/modal/modal.component';
import { SessionPopup } from '../session-popup';

@Component({
	selector: 'app-session-rating',
	templateUrl: './session-rating.component.html',
	styleUrls: ['./session-rating.component.scss']
})
export class SessionRatingComponent {

	sessionId: string;
	sessionInfo: Session;
	ratingModel: SessionRating = {
		rating: undefined,
		comment: ''
	};

	constructor(private route: ActivatedRoute, protected sessionService: SessionService, private router: Router) {
	}

	submitRating() {
		this.sessionId = this.route.snapshot.parent.params['id'];
		this.sessionService.changeRating(this.sessionId, this.sessionService.uid, this.ratingModel).subscribe(
			val => {console.log('rating submitted')},
			err => {console.log(err); }
		);
	}

}

@Component({
	selector: 'app-session-rating--modal',
	templateUrl: './session-rating--modal.component.html',
	styleUrls: ['./session-rating--modal.component.scss']
})
export class SessionRatingModalComponent extends SessionRatingComponent implements OnInit, SessionPopup {
	@ViewChild(ModalComponent) modal: ModalComponent;

	submitted$ = new Subject<boolean>();

	ngOnInit() {
		this.modal.show();
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
