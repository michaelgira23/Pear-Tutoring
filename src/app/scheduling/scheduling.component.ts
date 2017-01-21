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
	searchOpt: string = 'all';
	searchResults: Session[] = [];

	publicSessions$: Subscription = new Subscription();
	tagsSessions$: Subscription = new Subscription();
	propertySessions$: Subscription = new Subscription();

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

	findSessionsByProperty(prop: string) {
		if (this.searchStr.length !== 0) {
			if (!this.tagsSessions$.closed) { this.tagsSessions$.unsubscribe(); }
			if (!this.propertySessions$.closed) { this.propertySessions$.unsubscribe(); }
			if (!this.publicSessions$.closed) {this.publicSessions$.unsubscribe(); }
			if (prop === 'tags') {
				let tags = this.searchStr.split(',').map(tag => tag.trim());
				this.tagsSessions$ = this.sessionService.findSessionsByTags(tags, this.page).subscribe(val => {
					this.searchResults = val;
				}, console.log);
			} else {
				this.propertySessions$ = this.sessionService.findSessionsByProperty(prop, this.searchStr).subscribe(val => {
					this.searchResults = val;
				}, console.log);
			}
		} else {
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
