import { Component, OnInit } from '@angular/core';
import { Validators, FormGroup, FormBuilder } from '@angular/forms';
import { SessionService, SessionOptions } from '../../shared/model/session.service';
import { AuthService } from '../../shared/security/auth.service';
import * as moment from 'moment';
import { UserService } from '../../shared/model/user.service';
import { User } from '../../shared/model/user';

@Component({
	selector: 'app-create-session',
	templateUrl: './create-session.component.html',
	styleUrls: ['./create-session.component.scss']
})
export class CreateSessionComponent implements OnInit {

	createSessionForm: FormGroup;
	allUsers: User[];
	uid: string;

	constructor(private fb: FormBuilder, private sessionService: SessionService, private userService: UserService, private auth: AuthService) { }

	ngOnInit() {
		this.createSessionForm = this.fb.group({
			start: ['', Validators.required],
			end: ['', Validators.required],
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

		this.auth.auth$.subscribe(val => this.uid = val.uid);
	}

	createSession() {
		let sessionToCreate = this.createSessionForm.value;
		sessionToCreate.start = moment(sessionToCreate.start).format('X');
		sessionToCreate.end = moment(sessionToCreate.end).format('X');
		sessionToCreate.tags = sessionToCreate.tutees.split(',').map(val => val.trim());
		sessionToCreate.tutees = sessionToCreate.tutees.split(',').map(val => val.trim());
		sessionToCreate.tutor = this.uid;
		delete sessionToCreate.wbBackground;
		this.sessionService.createSession(sessionToCreate).subscribe(
			val => console.log('session created'),
			err => console.log(err)
		);
	}

}
