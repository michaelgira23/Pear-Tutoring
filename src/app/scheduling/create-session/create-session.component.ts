import { Component, OnInit } from '@angular/core';
import { Validators, FormGroup, FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { SessionService, SessionOptions, allowedSubjects } from '../../shared/model/session.service';
import * as moment from 'moment';
import { UserService } from '../../shared/model/user.service';
import { AuthService } from '../../shared/security/auth.service';
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
	allowedSubjects: string[] = allowedSubjects;

	constructor(private fb: FormBuilder,
				private sessionService: SessionService,
				private userService: UserService,
				private auth: AuthService,
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

		this.auth.auth$.subscribe(val => this.uid = val ? val.uid : null);
	}

	createSession() {
		let sessionToCreate = Object.assign({}, this.createSessionForm.value);
		sessionToCreate.start = moment(sessionToCreate.start).format('X');
		sessionToCreate.end = moment(sessionToCreate.end).format('X');
		sessionToCreate.tags = sessionToCreate.tags.split(',').map(val => val.trim());
		sessionToCreate.tutees = sessionToCreate.tutees.split(',').map(val => val.trim());
		sessionToCreate.tutor = this.uid;
		delete sessionToCreate.wbBackground;
		let wbOpt = {
			background: this.createSessionForm.value.wbBackground
		}
		this.sessionService.createSession(sessionToCreate, wbOpt).subscribe(
			val => this.router.navigate(['scheduling']),
			err => console.log(err)
		);
	}

}
