import { Component, OnInit } from '@angular/core';
import { Validators, FormGroup, FormBuilder } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { SessionService, AllowedSubjects } from '../shared/model/session.service';
import { Session } from '../shared/model/session';
import * as moment from 'moment';
import { UserService } from '../shared/model/user.service';
import { User } from '../shared/model/user';
import { Subscription } from 'rxjs/Rx';
import { DateModel } from 'ng2-datepicker';

@Component({
	selector: 'app-create-session',
	templateUrl: './create-session.component.html',
	styleUrls: ['./create-session.component.scss']
})
export class CreateSessionComponent implements OnInit {

	createSessionForm: FormGroup = this.fb.group({
		date: ['', Validators.required],
		startTime: ['', Validators.required],
		endTime: ['', Validators.required],
		grade: ['', Validators.required],
		classStr: ['', Validators.required],
		subject: ['', Validators.required],
		max: ['', Validators.required],
		listed: [true, Validators.required],
		title: ['', [Validators.required]],
		desc: ['', Validators.required],
		tutees: [[]],
		tags: ['', Validators.required]
	});
	allUsers: User[];
	allowedSubjects: string[] = AllowedSubjects;

	customCtrlReady = false;

	// The component detects if there's a session id provided, and prefill the form with values from the session information
	sessionInfo: Session;
	sessionId: string;

	findSession$: Subscription;

	get formPristine(): boolean {
		return this.createSessionForm.pristine;
	}

	constructor(
		private fb: FormBuilder,
		private router: Router,
		private route: ActivatedRoute,
		private sessionService: SessionService,
		private userService: UserService
	) { }

	ngOnInit() {

		// this.createSessionForm.controls['endTime'].setValidators(validateIsAfter(moment(this.createSessionForm.value.startTime, 'HH:mm')));

		this.route.params.subscribe(params => {
			if (params['id']) {
				this.sessionId = params['id'];
			}
			this.refreshSessionInfo();
		});

		this.userService.findAllUsers().subscribe(
			val => this.allUsers = val,
			err => console.log('Getting users error', err)
		);

		this.refreshSessionInfo();
	}

	refreshSessionInfo() {
		// if we have the id that means we are doing the update, query the database and get the session object
		if (this.sessionId) {
			if (this.findSession$) {this.findSession$.unsubscribe(); }
			this.findSession$ = this.sessionService.findSession(this.sessionId).subscribe(val => {
				this.sessionInfo = val;
				this.formInit();
				this.customCtrlReady = true;
			});
		} else {
			this.customCtrlReady = true;
		}
	}

	formInit() {
		if (this.sessionInfo) {
			let dateModel = new DateModel({
				day: this.sessionInfo.start.day().toString(),
				month: this.sessionInfo.start.month().toString(),
				year: this.sessionInfo.start.year().toString(),
				formatted: this.sessionInfo.start.format('YYYY-MM-DD'),
				momentObj: this.sessionInfo.start.clone()
			});
			this.createSessionForm = this.fb.group({
				date: [dateModel, Validators.required],
				startTime: [this.sessionInfo.start.format('HH:mm'), Validators.required],
				endTime: [this.sessionInfo.end.format('HH:mm'), [Validators.required]],
				grade: [this.sessionInfo.grade, Validators.required],
				classStr: [this.sessionInfo.classStr, Validators.required],
				subject: [this.sessionInfo.subject, Validators.required],
				max: [this.sessionInfo.max, [Validators.required]],
				listed: [this.sessionInfo.listed, Validators.required],
				title: [this.sessionInfo.title, [Validators.required]],
				desc: [this.sessionInfo.desc, Validators.required],
				tutees: [this.sessionInfo.tutees],
				tags: [this.sessionInfo.tags ? this.sessionInfo.tags.join(', ') : '', Validators.required]
			});
		}
	}

	createSession() {
		let sessionToCreate = Object.assign({}, this.createSessionForm.value);
		console.log('start', sessionToCreate.startTime, sessionToCreate.endTime);
		console.log(moment(sessionToCreate.startTime, 'HH:mm').hours(), moment(sessionToCreate.endTime, 'HH:mm').hours());

		sessionToCreate.start = sessionToCreate.date.momentObj.clone()
								.hours(moment(sessionToCreate.startTime, 'HH:mm').hours())
								.minutes(moment(sessionToCreate.startTime, 'HH:mm').minutes());
		sessionToCreate.end = sessionToCreate.date.momentObj.clone()
								.hours(moment(sessionToCreate.endTime, 'HH:mm').hours())
								.minutes(moment(sessionToCreate.endTime, 'HH:mm').minutes());
		sessionToCreate.tags = sessionToCreate.tags.split(',').map(val => val.trim());
		sessionToCreate.tutees = sessionToCreate.tutees.map(val => val.$key);
		sessionToCreate.tutor = this.userService.uid;
		delete sessionToCreate.wbBackground;
		delete sessionToCreate.date;
		delete sessionToCreate.startTime;
		delete sessionToCreate.endTime;
		if (!this.sessionId && !this.sessionInfo) {
			this.sessionService.createSession(sessionToCreate).subscribe(
				val => this.router.navigate(['dashboard']),
				err => console.log(err)
			);
		}
		if (this.sessionId || this.sessionInfo) {
			this.sessionService.updateSession(this.sessionId, sessionToCreate).subscribe(
				val => this.router.navigate(['dashboard']),
				err => console.log(err)
			);
		}
	}

	autoFill() {
		// let testTime = moment('2017-1-30 15:30', 'YYYY-MM-DD HH:mm');
		let testTime = moment({
			year: 2017,
			month: 0,
			day: 30,
			hour: 15,
			minute: 30
		});
		let dateModel = new DateModel({
			day: testTime.day().toString(),
			month: testTime.month().toString(),
			year: testTime.year().toString(),
			formatted: testTime.format('YYYY-MM-DD'),
			momentObj: testTime.clone()
		});
		this.createSessionForm = this.fb.group({
			date: [dateModel, Validators.required],
			startTime: [testTime.format('HH:mm'), Validators.required],
			endTime: [testTime.clone().add(1, 'hour').format('HH:mm'), [Validators.required]],
			grade: ['10', Validators.required],
			classStr: ['Math Integrated II Accelerated', Validators.required],
			subject: ['Math', Validators.required],
			max: ['3', [Validators.required]],
			listed: [true, Validators.required],
			title: ['Unit Circle', [Validators.required]],
			desc: ['We will go over the basics of the Unit Circle and how to use it to evaluate sin and cosine.', Validators.required],
			tutees: [[]],
			tags: ['math, unit circle', Validators.required]
		});
	}

}

// function validateIsAfter(startTime: moment.Moment): ValidatorFn {
// 	return function (c: FormControl) {
// 		let endTime = moment(c.value, 'HH:mm').seconds(0);
// 		startTime = moment().hours(startTime.hours()).minutes(startTime.minutes()).seconds(0);
// 		console.log(endTime.isAfter(startTime), endTime.format('l'), startTime.format('l'));
// 		return endTime.isAfter(startTime) ? null : {
// 			error: 'Session must be shorter than 5 hours!'
// 		};
// 	};
// }
