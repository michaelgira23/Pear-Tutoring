import { Component, OnInit, OnDestroy, Input} from '@angular/core';
import { Router } from '@angular/router';
import { FirebaseAuthState } from 'angularfire2';

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
				primary: 'Enroll',
				secondary: 'Details'
			},
			inSession: {
				primary: 'Join Session',
				secondary: 'Details'
			},
			pending: {
				disabled: 'Enrollment is pending...'
			}
		},
		pending: {
			inSession: {
				tutor: {
					primary: 'Accept',
					secondary: 'Deny'
				},
				tutee: {
					disabled: 'Enrollment accepted!'
				}
			},
			pending: {
				disabled: 'Enrollment is pending...'
			}
		}
	};

	subjectToLabel = {
		english: 'file-text2',
		history: 'history',
		math: 'calculator',
		science: 'lab',
		'world-language': '',
		default: 'rocket'
	};

	@Input()
	type: CardType;

	@Input()
	session: Session;

	// User input only used for `pending` type
	@Input()
	user: User;

	authSubscription: any;
	authInfo: FirebaseAuthState;

	get sessionDate(): string {
		return this.session.start.format('M/D/Y');
	}
	get startTime(): string {
		return this.session.start.format('h:mm');
	}
	get endTime(): string {
		return this.session.end.format('h:mm');
	}

	get subject(): string {
		return this.session.subject.toLowerCase();
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
		return this.session.tutor.$key === this.authInfo.uid;
	}

	get isTutee() {
		return this.session.tutees.some(user => user.$key === this.authInfo.uid);
	}

	get isPending() {
		return this.session.pending.includes(this.authInfo.uid);
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

	constructor(private router: Router, private authService: AuthService, private sessionService: SessionService) {
	}

	ngOnInit() {
		this.authSubscription = this.authService.auth$.subscribe(authInfo => this.authInfo = authInfo);
	}

	ngOnDestroy() {
		this.authSubscription.unsubscribe();
	}

	getButtonText(button: string) {
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

	joinSession() {
		this.router.navigate(['session', this.session.$key]);
	}

	updateSession() {
		this.router.navigate(['scheduling', 'update', this.session.$key]);
	}

	deleteSession() {
		this.sessionService.deleteSession(this.session.$key).subscribe(
			val => console.log('deleted'),
			err => console.log(err)
		);
	}

	enrollSession() {
		this.sessionService.addTutees(this.session.$key, this.sessionService.uid).subscribe(val => {
			console.log('added Tutees');
		}, console.log);
	}

	checkPending() {
		this.router.navigate(['session', this.session.$key, {outlets: {'permissions-popup': null}}]);
		this.router.navigate(['session', this.session.$key, {outlets: {'requests-popup': ['requests']}}]);
	}
}
