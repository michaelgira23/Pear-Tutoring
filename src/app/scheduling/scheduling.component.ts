import { Component, OnInit, OnDestroy } from '@angular/core';
import { SessionService } from '../shared/model/session.service';
import { AuthService } from '../shared/security/auth.service';
import { Session } from '../shared/model/session';
import { Subscription } from 'rxjs/Rx';

@Component({
	selector: 'app-scheduling',
	templateUrl: './scheduling.component.html',
	styleUrls: ['./scheduling.component.scss']
})
export class SchedulingComponent implements OnInit, OnDestroy {

	searchStr: string = '';
	searchResults: Session[] = [];

	publicSessions$: Subscription = new Subscription();
	resultSessions$: Subscription = new Subscription();

	page: number = 0;

	constructor(
		private sessionService: SessionService,
		private auth: AuthService
	) { }

	ngOnInit() {
		this.publicSessions$ = this.sessionService.findPublicSessions()
		.subscribe(
			val3 => {
				this.searchResults = val3;
			},
			err => console.log(err)
		);
	}

	ngOnDestroy() {
		this.publicSessions$.unsubscribe();
	}

	findSessions() {
		if (this.searchStr.length !== 0) {
			if (!this.publicSessions$.closed) {this.publicSessions$.unsubscribe(); }
			this.resultSessions$ = this.sessionService.findSessionsByString(this.searchStr).subscribe(sessions => {
				this.searchResults = sessions;
			});
		} else {
			if (!this.resultSessions$) {this.resultSessions$.unsubscribe()}
			this.publicSessions$ = this.sessionService.findPublicSessions()
			.subscribe(
				val3 => {
					this.searchResults = val3;
				},
				err => console.log(err)
			);
		}
	}
}
