import { Component, OnInit } from '@angular/core';
import { UserService } from '../../shared/model/user.service';
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
	freeTimesModel: any = {
				Sunday: [],
				Monday: [],
				Tuesday: [],
				Wednsday: [],
				Thursday: [],
				Friday: [],
				Saturday: [],
			};

	constructor(private userService: UserService) { }

	ngOnInit() {
		this.userService.getFreeTimes().subscribe(val => {
			this.freeTimesModel = Object.assign(this.freeTimesModel, val);
			console.log(this.freeTimesModel);
		});
	}

	addTime(day: string, from: any, to: any) {
		if (from && to) {
			let fromD = moment(from, 'HH:mm'), toD = moment(to, 'HH:mm');
			if (toD.isSameOrAfter(fromD)) {
				this.userService.addFreeTime(day, {from: fromD.valueOf(), to: toD.valueOf()}).subscribe(
					val => {
						this.freeTimesModel[day].push({fromD, toD});
						this.freeTimesModel[day].sort((a, b) => a.fromD.valueOf() - b.fromD.valueOf());
					},
					err => {
						console.log('err');
				});
			}
		}
	}

	removeTime(day: string, timeIndex: number) {
		this.userService.removeFreeTime(day, this.freeTimesModel[day][timeIndex]).subscribe(
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
