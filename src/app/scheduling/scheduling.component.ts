import { Component, OnInit } from '@angular/core';
import { SessionService } from '../shared/model/session.service';
import * as moment from 'moment';

@Component({
	selector: 'app-scheduling',
	templateUrl: './scheduling.component.html',
	styleUrls: ['./scheduling.component.scss']
})
export class SchedulingComponent implements OnInit {

	constructor(private sessionService: SessionService) { }

	ngOnInit() {
		this.sessionService.createSession({
			start: moment.now(),
			end: moment().hours(2).format('x'),
			tutor: '',
			tutees: [],
			max: 3,
			listed: true
		}).subscribe(
			val => console.log("Mock Session created"),
			err => console.log(err)
		);
		this.sessionService.findAllSessions()
		.subscribe(
			val => console.log(val),
			err => console.log(err)
		);
	}

}
