import { Component, OnInit } from '@angular/core';
import { UserService, FreeTimes } from '../../shared/model/user.service';
import { SessionService } from '../../shared/model/session.service';
import * as moment from 'moment';

@Component({
	selector: 'app-time-picker',
	templateUrl: './time-picker.component.html',
	styleUrls: ['./time-picker.component.scss']
})
export class TimePickerComponent implements OnInit {

	get freeTimesProps(): string[] {
		return Object.getOwnPropertyNames(this.freeTimesModel);
	}
	freeTimesModel: FreeTimes = {
				Sunday: [],
				Monday: [],
				Tuesday: [],
				Wednsday: [],
				Thursday: [],
				Friday: [],
				Saturday: [],
			};

	constructor(private userService: UserService, private sessionService: SessionService) { }

	ngOnInit() {
		this.userService.getFreeTimes().subscribe(val => {
			this.freeTimesModel = Object.assign(this.freeTimesModel, val);
			this.sessionService.findSessionsByFreeTime(6, this.freeTimesModel['Sunday']).subscribe(console.log, console.log);
		}, console.log);
	}

	addTime(day: string, from: any, to: any) {
		if (from && to) {
			let fromD = moment(from, 'HH:mm').day(day), toD = moment(to, 'HH:mm').day(day);
			if (toD.isSameOrAfter(fromD)) {
				this.userService.addFreeTime(day, {from: fromD.valueOf(), to: toD.valueOf()}).subscribe(
					val => {
						this.freeTimesModel[day].sort((a, b) => a.from.valueOf() - b.from.valueOf());
					},
					err => {
						console.log(err);
				});
			}
		}
	}

	removeTime(day: string, timeIndex: number) {
		let time = this.freeTimesModel[day][timeIndex];
		this.userService.removeFreeTime(day, {from: time.from, to: time.to}).subscribe(
			val => {
				this.freeTimesModel[day].splice(timeIndex, 1);
			},
			err => {
				console.log(err);
			}
		);
	}

	// add - delete - store time periods in 7 days in a week
	// @ViewChild can help access the times from settings component
}
