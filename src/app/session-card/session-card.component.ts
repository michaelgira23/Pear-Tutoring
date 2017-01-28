import { Component, OnInit, OnDestroy, Input} from '@angular/core';
import { Router } from '@angular/router';
import { FirebaseAuthState } from 'angularfire2';
import { UUID } from 'angular2-uuid';

import { AuthService } from '../shared/security/auth.service';
import { Session } from '../shared/model/session';
import { SessionService } from '../shared/model/session.service';
import { User } from '../shared/model/user';

type CardType = 'display' | 'pending';

@Component({
	selector: 'app-session-card',
	templateUrl: './session-card.component.html',
	styleUrls: ['./session-card.component.scss']
})
export class SessionCardComponent implements OnInit, OnDestroy {

	typeToButtonLabels = {
		display: {
			notInSession: {
				primary: {
					content: 'Enroll',
					function: this.enrollSession
				},
				secondary: {
					content: 'Details',
					function: this.sessionDetails
				}
			},
			inSession: {
				primary: {
					content: 'Join Session',
					function: this.joinSession
				},
				secondary: {
					content: 'Details',
					function: this.sessionDetails
				}
			},
			pending: {
				disabled: {
					content: 'Enrollment is pending...'
				}
			}
		},
		pending: {
			inSession: {
				tutor: {
					primary: {
						content: 'Accept',
						function: this.acceptPending
					},
					secondary: {
						content: 'Deny',
						function: this.denyPending
					}
				},
				tutee: {
					disabled: {
						content: 'Enrollment accepted!'
					}
				}
			},
			pending: {
				disabled: {
					content: 'Enrollment is pending...'
				}
			}
		}
	};

	subjectToLabel = {
		english: 'file-text2',
		history: 'history',
		math: 'calculator',
		science: 'lab',
		'world-language': 'earth',
		default: 'rocket'
	};

	@Input()
	type: CardType = 'display';

	@Input()
	session: Session;

	// User input only used for `pending` type
	@Input()
	user: User;

	authSubscription: any;
	authInfo: FirebaseAuthState;

	menuId = UUID.UUID();

	get sessionDate(): string {
		return this.session.start.format('M/D/Y');
	}
	get startTime(): string {
		return this.session.start.format('h:mm');
	}
	get endTime(): string {
		return this.session.end.format('h:mm');
	}

	get role() {
		if (this.isTutor) {
			return 'tutor';
		} else if (this.isTutee) {
			return 'tutee';
		}
		return null;
	}

	get isTutor() {
		if (!this.authInfo) {
			return false;
		}
		return this.session.tutor.$key === this.authInfo.uid;
	}

	get isTutee() {
		if (!this.authInfo) {
			return false;
		}
		return this.session.tutees.some(user => user.$key === this.authInfo.uid);
	}

	get isPending() {
		if (!this.authInfo) {
			return false;
		}
		return this.session.pending.includes(this.authInfo.uid);
	}

	get displayPendingUserPic() {
		return this.type === 'pending' && this.user && this.user.$key !== this.authInfo.uid;
	}

	get sessionStatus() {
		if (this.isPending) {
			return 'pending';
		} else if (this.inSession) {
			return 'inSession';
		}
		return 'notInSession';
	}

	get inSession() {
		return this.isTutor || this.isTutee;
	}

	constructor(private router: Router, private authService: AuthService, private sessionService: SessionService) { }

	ngOnInit() {
		this.authSubscription = this.authService.auth$.subscribe(authInfo => this.authInfo = authInfo);
	}

	ngOnDestroy() {
		this.authSubscription.unsubscribe();
	}

	getButtonObject(button: string) {
		if (this.typeToButtonLabels[this.type]
			&& this.typeToButtonLabels[this.type][this.sessionStatus]) {

			// Check if there's button text for the session status
			if (this.typeToButtonLabels[this.type][this.sessionStatus][this.role]
				&& this.typeToButtonLabels[this.type][this.sessionStatus][this.role][button]) {

				return this.typeToButtonLabels[this.type][this.sessionStatus][this.role][button];
			}

			// Fallback and see if there's any regular button text without specific roles
			if (this.typeToButtonLabels[this.type][this.sessionStatus]
				&& this.typeToButtonLabels[this.type][this.sessionStatus][button]) {

				return this.typeToButtonLabels[this.type][this.sessionStatus][button];
			}
		}

		return null;
	}

	activateBottonFunction(button: string) {
		const buttonObject = this.getButtonObject(button);
		if (!buttonObject || !buttonObject.function) {
			return function() {};
		}
		return buttonObject.function.bind(this);
	}

	/**
	 * Click handlers for buttons
	 */

	sessionDetails() {
		this.router.navigate(['session', this.session.$key, 'details']);
	}

	userDetails() {
		this.router.navigate(['user', this.user.$key, 'details']);
	}

	enrollSession() {
		this.sessionService.addTutees(this.session.$key, this.authInfo.uid)
			.subscribe(
				val => {
					// console.log('successfully enrolled in session', val);
				},
				err => {
					console.log('enroll error', err);
				}
			);
	}

	joinSession() {
		this.router.navigate(['session', this.session.$key]);
	}

	acceptPending() {
		this.sessionService.addTutees(this.session.$key, this.user.$key)
			.subscribe(
				val => {
					// console.log('successfully accepted user into session', val);
				},
				err => {
					console.log('accepting user error', err);
				}
			);
	}

	denyPending() {
		this.sessionService.denyPending(this.session.$key, this.user.$key)
			.subscribe(
				val => {
					// console.log('successfully denied user from session', val);
				},
				err => {
					console.log('denying user error', err);
				}
			);
	}

	updateSession() {
		this.router.navigate(['scheduling', 'update', this.session.$key]);
	}

	deleteSession() {
		this.sessionService.deleteSession(this.session.$key).subscribe(
			val => {
				// console.log('deleted')
			},
			err => console.log(err)
		);
	}

	checkPending() {
		this.router.navigate(['session', this.session.$key, {outlets: {'permissions-popup': null}}]);
		this.router.navigate(['session', this.session.$key, {outlets: {'requests-popup': ['requests']}}]);
	}
}
