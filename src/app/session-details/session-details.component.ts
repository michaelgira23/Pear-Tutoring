import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SessionService } from '../shared/model/session.service';
import { PermissionsService, Permission } from '../shared/security/permissions.service';
import { Session } from '../shared/model/session';
import { Subject, Observable } from 'rxjs/Rx';
import { SessionPopup } from '../session/session-popup';
import { SessionRatingComponent } from '../session/session-rating/session-rating.component';
import { SessionPermissionsComponent } from '../session/session-permissions/session-permissions.component';
import { SessionRequestComponent } from '../session/session-request/session-request.component';

@Component({
	selector: 'app-session-details',
	templateUrl: './session-details.component.html',
	styleUrls: ['./session-details.component.scss']
})
export class SessionDetailsComponent implements OnInit {

	sessionId: string;
	sessionInfo: Session;
	perm: Permission;

	get canRate(): boolean {
		return !!this.sessionInfo.tutees.find(tutee => {
			return tutee.$key === this.sessionService.uid;
		}) || true;
	}

	@ViewChild(SessionRatingComponent) ratingPopup: SessionRatingComponent;
	@ViewChild(SessionRequestComponent) requestsPopup: SessionRatingComponent;
	@ViewChild(SessionPermissionsComponent) permissionsPopup: SessionRatingComponent;

	get rated(): boolean {
		return this.sessionInfo.rating ? !!this.sessionInfo.rating.find(rating => {
			return rating.user === this.sessionService.uid;
		}) : false;
	};

	constructor(private route: ActivatedRoute, private sessionService: SessionService, private permissionsService: PermissionsService) { }

	ngOnInit() {
		this.sessionId = this.route.snapshot.params['id'];
		this.sessionService.findSession(this.sessionId)
		.subscribe(
			(session: Session) => {
				this.sessionInfo = session;
				console.log(session);
				this.permissionsService.getUserPermission(this.sessionId, 'session').subscribe(perm => {
					this.perm = perm;
				}, console.log);
			}
		);
	}

	openPopup(type: string): Observable<SessionPopup> {
		this[type + 'Popup'].modal.show();
		let popupRef$ = new Subject<SessionPopup>();
		setTimeout(() => {popupRef$.next(this[type + 'Popup']); }, 0);
		return popupRef$.asObservable();
	}

	closePopup(type: string): void {
		let popup = <SessionPopup> this[type + 'Popup'];
		popup.closeModal(false);
	}
}
