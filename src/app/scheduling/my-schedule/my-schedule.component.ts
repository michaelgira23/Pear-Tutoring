import { Component, OnInit } from '@angular/core';

@Component({
	selector: 'app-my-schedule',
	templateUrl: './my-schedule.component.html',
	styleUrls: ['./my-schedule.component.scss']
})
export class MyScheduleComponent implements OnInit {

	constructor() { }

	ngOnInit() {
	}

	// clock display of the user's day, marking freetimes, and when user clicks on a freetime it shows the recommended sessions
}
