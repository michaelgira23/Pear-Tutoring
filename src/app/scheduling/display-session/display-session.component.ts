import { Component, OnInit, Input} from '@angular/core';
import { Router } from '@angular/router';
import { Session } from '../../shared/model/session';
import { SessionService } from '../../shared/model/session.service';
import { UUID } from 'angular2-uuid';

declare const componentHandler;

@Component({
	selector: 'app-display-session',
	templateUrl: './display-session.component.html',
	styleUrls: ['./display-session.component.scss']
})
export class DisplaySessionComponent implements OnInit {

	menuId: string = UUID.UUID();

	@Input()
	session: Session;
	get startTime(): string {
		return this.session.start.format('M/D/Y');
	};
	get endTime(): string {
		return this.session.end.format('M/D/Y');
	}
	get subject(): string {
		return this.session.subject.toLowerCase();
	}

	sideOpen: boolean;

	constructor(private router: Router, private sessionService: SessionService) {
	}

	ngOnInit() {
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
}
