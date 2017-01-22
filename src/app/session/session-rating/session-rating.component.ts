import { Component, OnInit, Renderer } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SessionService } from '../../shared/model/session.service';
import { Session } from '../../shared/model/session';
import { SessionPopup } from '../session-popup';

@Component({
	selector: 'app-session-rating',
	templateUrl: './session-rating.component.html',
	styleUrls: ['./session-rating.component.scss']
})
export class SessionRatingComponent extends SessionPopup implements OnInit {

	sessionId: string;
	sessionInfo: Session;
	ratingModel: any = {
		rating: undefined,
		comment: ''
	};

	constructor(protected sessionService: SessionService, private route: ActivatedRoute, protected renderer: Renderer) {
		super(renderer);
	}

	ngOnInit() {
		this.sessionId = this.route.snapshot.params['id'];
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
