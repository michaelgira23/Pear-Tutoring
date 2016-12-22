import { Component, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { Validators, FormGroup, FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { SessionService, allowedSubjects } from '../../shared/model/session.service';
import { Session } from '../../shared/model/session';
import * as moment from 'moment';
import { UserService } from '../../shared/model/user.service';
import { User } from '../../shared/model/user';
import { Subscription } from 'rxjs/Rx';

@Component({
	selector: 'app-create-session',
	templateUrl: './create-session.component.html',
	styleUrls: ['./create-session.component.scss']
})
export class CreateSessionComponent implements OnInit, OnChanges {

	createSessionForm: FormGroup;
	allUsers: User[];
	allowedSubjects: string[] = allowedSubjects;

	// The component detects if there's a session id provided, and prefill the form with values from the session information
	sessionInfo: Session;
	@Input()
	sessionId: string;

	findSession$: Subscription;

	constructor(private fb: FormBuilder,
				private sessionService: SessionService,
				private userService: UserService,
				private router: Router) { }

	ngOnInit() {
		this.createSessionForm = this.fb.group({
			start: ['', Validators.required],
			end: ['', Validators.required],
			subject: ['', Validators.required],
			max: ['', Validators.required],
			listed: [false, Validators.required],
			title: ['', [Validators.required]],
			desc: ['', Validators.required],
			tutees: ['', Validators.required],
			wbBackground: [''],
			tags: ['']
		});

		this.userService.findAllUsers().subscribe(
			val => this.allUsers = val,
			err => console.log('Getting users error', err)
		);
	}

	ngOnChanges(changes: SimpleChanges) {
		if (changes['sessionId']) { this.sessionId = changes['sessionId'].currentValue; }
		this.refreshSessionInfo();
	}

	refreshSessionInfo() {
		// if we have the id, query the database and get the session object
		if (this.findSession$) {this.findSession$.unsubscribe(); }
		this.findSession$ = this.sessionService.findSession(this.sessionId).subscribe(val => {
			this.sessionInfo = val;
			this.formInit();
		});
	}

	formInit() {
		this.createSessionForm = this.fb.group({
			start: [moment(this.sessionInfo.start, 'X').format('MM-DD-YYYY'), Validators.required],
			end: [moment(this.sessionInfo.end, 'X').format('MM-DD-YYYY'), Validators.required],
			subject: [this.sessionInfo.subject, Validators.required],
			max: [this.sessionInfo.max, Validators.required],
			listed: [this.sessionInfo.listed, Validators.required],
			title: [this.sessionInfo.title, [Validators.required]],
			desc: [this.sessionInfo.desc, Validators.required],
			tutees: [this.sessionInfo.tutees.map(tutee => tutee.$key).join(', '), Validators.required],
			wbBackground: [''],
			tags: [this.sessionInfo.tags.join(', ')]
		});
	}

	createSession() {
		let sessionToCreate = Object.assign({}, this.createSessionForm.value);
		sessionToCreate.start = moment(sessionToCreate.start, 'MM-DD-YYYY').format('X');
		sessionToCreate.end = moment(sessionToCreate.end, 'MM-DD-YYYY').format('X');
		sessionToCreate.tags = sessionToCreate.tags.split(',').map(val => val.trim());
		sessionToCreate.tutees = sessionToCreate.tutees.split(',').map(val => val.trim());
		sessionToCreate.tutor = this.userService.uid;
		delete sessionToCreate.wbBackground;
		let wbOpt = {
			background: this.createSessionForm.value.wbBackground
		};
		if (!this.sessionId && !this.sessionInfo) {
			this.sessionService.createSession(sessionToCreate, wbOpt).subscribe(
				val => this.router.navigate(['scheduling']),
				err => console.log(err)
			);
		}
		if (this.sessionId || this.sessionInfo) {
			this.sessionService.updateSession(this.sessionId, sessionToCreate).subscribe(
				val => this.router.navigate(['scheduling']),
				err => console.log(err)
			);
		}
	}

}
