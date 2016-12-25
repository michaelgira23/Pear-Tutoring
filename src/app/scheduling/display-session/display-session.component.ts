import { Component, OnInit, Input } from '@angular/core';
import { Router } from '@angular/router';
import { Session } from '../../shared/model/session';
import * as moment from 'moment';
import { UserService } from '../../shared/model/user.service';
import { SessionService } from '../../shared/model/session.service';

@Component({
	selector: 'app-display-session',
	templateUrl: './display-session.component.html',
	styleUrls: ['./display-session.component.scss']
})
export class DisplaySessionComponent implements OnInit {

	@Input()
	session: Session;
	get startTime(): string {
		return moment(this.session.start, 'X').format('M/D/Y');
	};
	get endTime(): string {
		return moment(this.session.end, 'X').format('M/D/Y');
	}
	get subject(): string {
		return this.session.subject.toLowerCase();
	}

	constructor(private router: Router, private user: UserService, private sessionService: SessionService) { }

	ngOnInit() {
	}

	joinSession() {
		this.router.navigate(['session', this.session.$key]);
	}

	updateSession() {
		this.router.navigate(['scheduling', 'update', this.session.$key])
	}

	deleteSession() {
		this.sessionService.deleteSession(this.session.$key).subscribe(
			val => console.log('deleted'),
			err => console.log(err)
		);
	}
}
