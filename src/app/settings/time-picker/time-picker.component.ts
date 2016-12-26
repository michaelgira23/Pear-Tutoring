import { Component, OnInit } from '@angular/core';

@Component({
	selector: 'app-time-picker',
	templateUrl: './time-picker.component.html',
	styleUrls: ['./time-picker.component.scss']
})
export class TimePickerComponent implements OnInit {

	get freeTimes(): {[key: string]: {from: number; to: number}[]} {
		return this.freeTimesModel;
	}
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

	constructor() { }

	ngOnInit() {
	}

	addTime(day: string) {
		this.freeTimesModel[day].push({from: '', to: ''});
	}

	removeTime(day: string, timeIndex: number) {
		this.freeTimesModel[day].splice(timeIndex, 1);
	}

	// add - delete - store time periods in 7 days in a week
	// @ViewChild can help access the times from settings component
}
