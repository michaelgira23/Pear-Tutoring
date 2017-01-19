import { Component, OnInit, Input} from '@angular/core';
import { Router } from '@angular/router';
import { Session } from '../shared/model/session';
import { SessionService } from '../shared/model/session.service';
import { UUID } from 'angular2-uuid';
import { Observable } from 'rxjs/Rx';
import * as moment from 'moment';

@Component({
	selector: 'app-session-card',
	templateUrl: './session-card.component.html',
	styleUrls: ['./session-card.component.scss']
})
export class SessionCardComponent implements OnInit {

	menuId: string = UUID.UUID();

	@Input()
	session: Session;
	get startTime(): string {
		return this.session.start.format('ddd, M/D/Y h:mm:ss');
	};
	get endTime(): string {
		return this.session.end.format('h:mm:ss');
	}
	get subject(): string {
		return this.session.subject.toLowerCase();
	}

	sideOpen: boolean;

	get joinable() {
		return this.session.tutees.some(user => this.sessionService.uid === user.$key) || this.session.tutor.$key === this.sessionService.uid;
	}

	get pending() {
		return this.session.pending.some(uid => this.sessionService.uid === uid);
	}

	startingIn: Observable<string>;

	get past(): boolean {
		return moment().isSameOrAfter(this.session.end);
	}

	constructor(private router: Router, private sessionService: SessionService) {
	}

	ngOnInit() {
		this.startingIn = Observable.interval(5000).map(val => {
			return this.session.start.fromNow();
		});
	}

	joinSession() {
		this.router.navigate(['session', this.session.$key]);
	}

	updateSession() {
		this.router.navigate(['session', this.session.$key, 'update' ]);
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
		this.router.navigate(['session', this.session.$key, {outlets: {'popup': ['requests']}}]);
	}
}
