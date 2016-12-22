import { Component, OnInit, Input } from '@angular/core';
import { Router } from '@angular/router';
import { Session } from '../../shared/model/session';
import * as moment from 'moment';
import { UserService } from '../../shared/model/user.service';

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

	constructor(private router: Router, private user: UserService) { }

	ngOnInit() {
	}

	joinSession() {
		this.router.navigate(['session', this.session.$key]);
	}

	updateSession() {
		this.router.navigate(['scheduling', 'update', this.session.$key])
	}
}
