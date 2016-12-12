import { Component, OnInit } from '@angular/core';
import { SessionService } from '../shared/model/session.service';
import { Session } from '../shared/model/session';
import { Validators, FormGroup, FormBuilder } from '@angular/forms';
import { Router } from '@angular/router'
import * as moment from 'moment';

@Component({
	selector: 'app-scheduling',
	templateUrl: './scheduling.component.html',
	styleUrls: ['./scheduling.component.scss']
})
export class SchedulingComponent implements OnInit {

	tutorSessions: Session[];
	tuteeSessions: Session[];
	publicSessions: Session[];
	joinSessionForm: FormGroup;

	constructor(private sessionService: SessionService, private fb: FormBuilder, private router: Router) { }

	ngOnInit() {
		this.joinSessionForm = this.fb.group({
			'sessionId': ['', [Validators.required]]
		})
		// this.sessionService.createSession({
		// 	start: moment.now(),
		// 	end: moment().hours(2).format('x'),
		// 	tutor: '',
		// 	tutees: [],
		// 	max: 3,
		// 	listed: true
		// }).subscribe(
		// 	val => console.log("Mock Session created"),
		// 	err => console.log(err)
		// );
		this.sessionService.findMySessions().tutorSessions
		.subscribe(
			val => this.tutorSessions = val,
			err => console.log(err)
		);
		this.sessionService.findMySessions().tuteeSessions
		.subscribe(
			val => this.tuteeSessions = val,
			err => console.log(err)
		);

		this.sessionService.findPublicSessions()
		.subscribe(
			val => this.publicSessions = val,
			err => console.log(err)
		)
	}

	deleteSession(sessionId: string) {
		this.sessionService.deleteSession(sessionId).subscribe(
			val => console.log('deleted'),
			err => console.log(err)
		)
	}

	joinSession() {
		const sessionId = this.joinSessionForm.value.sessionId;
		this.router.navigate(['session/' + sessionId]);
	}
}
