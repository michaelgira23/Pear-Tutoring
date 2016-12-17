import { Component, OnInit, Input } from '@angular/core';
import { Router } from '@angular/router';
import { Session } from '../../shared/model/session'

@Component({
	selector: 'app-display-session',
	templateUrl: './display-session.component.html',
	styleUrls: ['./display-session.component.scss']
})
export class DisplaySessionComponent implements OnInit {

	@Input()
	session: Session

	constructor(private router: Router) { }

	ngOnInit() {
	}

	joinSession() {
		this.router.navigate(['session', this.session.$key]);
	}
}
