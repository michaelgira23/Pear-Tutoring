import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs/Rx';
import * as moment from 'moment';

import { getEditDistance } from '../shared/common/utils';
import { SessionService } from '../shared/model/session.service';
import { AuthService } from '../shared/security/auth.service';
import { Session } from '../shared/model/session';

@Component({
	selector: 'app-scheduling',
	templateUrl: './scheduling.component.html',
	styleUrls: ['./scheduling.component.scss']
})
export class SchedulingComponent implements OnInit, OnDestroy {

	totalSessions: Session[] = [];
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
			val => {
				this.totalSessions = val;
				this.findSessions();
			},
			err => console.log(err)
		);
	}

	ngOnDestroy() {
		this.publicSessions$.unsubscribe();
	}

	findSessions() {
		const scopes = ['classStr', 'title', 'subject'];

		// If nothing in the search box, just sort by starting timestamp
		if (this.searchStr.length === 0) {
			this.searchResults = this.totalSessions
				// Filter out any sessions that have aleady happened
				.filter(session => moment().unix() < session.end.unix())
				// Sort by starting timestamp
				.sort((a, b) => a.start.unix() - b.start.unix());
			return;
		}

		this.searchResults = this.totalSessions
			// Filter out any sessions that have aleady happened
			.filter(session => moment().unix() < session.end.unix())
			// Sort by starting timestamp
			.sort((a, b) => a.start.unix() - b.start.unix())
			// Sort by average of edit distances of three scopes
			.sort((a, b) => {
				let aEditDistances = [];
				let bEditDistances = [];
				scopes.forEach(scope => {
					aEditDistances.push(getEditDistance(a[scope].toLowerCase(), this.searchStr.toLowerCase()));
					bEditDistances.push(getEditDistance(b[scope].toLowerCase(), this.searchStr.toLowerCase()));
				});

				// const aAverage = aEditDistances.reduce((sum, value) => (sum + value), 0) / (aEditDistances.length || 1);
				// const bAverage = bEditDistances.reduce((sum, value) => (sum + value), 0) / (bEditDistances.length || 1);
				const aMax = Math.min.apply(Math, aEditDistances);
				const bMax = Math.min.apply(Math, bEditDistances);
				return aMax - bMax;
			});
	}
}
