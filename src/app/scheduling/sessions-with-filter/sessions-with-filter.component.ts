import { Component, OnInit, Input } from '@angular/core';
import { Session } from '../../shared/model/session';
import { objToArr } from '../../shared/common/utils';

import * as moment from 'moment';

@Component({
	selector: 'app-sessions-with-filter',
	templateUrl: './sessions-with-filter.component.html',
	styleUrls: ['./sessions-with-filter.component.scss']
})
export class SessionsWithFilterComponent implements OnInit {

	@Input() sessions: Session[];

	weekdaysModel = {
		Sunday: true,
		Monday: true,
		Tuesday: true,
		Wednsday: true,
		Thursday: true,
		Friday: true,
		Saturday: true
	};
	get weekdays(): string[] {
		return objToArr(this.weekdaysModel);
	}
	get selectedDays(): string[] {
		return objToArr(this.weekdaysModel, (prop) => prop);
	}

	get results(): Session[] {
		return this.sessions.filter(session => {
			let day = moment(session.ywd, 'YYYY-WW-E').format('dddd');
			return !!this.selectedDays.find(sessionDay => day === sessionDay);
		});
	}

	constructor() { }

	ngOnInit() {
	}

}
