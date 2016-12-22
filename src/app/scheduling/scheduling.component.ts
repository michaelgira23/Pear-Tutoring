import { Component, OnInit } from '@angular/core';
import { SessionService } from '../shared/model/session.service';
import { UserService } from '../shared/model/user.service';
import { AuthService } from '../shared/security/auth.service';
import { Session } from '../shared/model/session';
import { Validators, FormGroup, FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
	selector: 'app-scheduling',
	templateUrl: './scheduling.component.html',
	styleUrls: ['./scheduling.component.scss']
})
export class SchedulingComponent implements OnInit {

	tutorSessions: Session[] = [];
	tuteeSessions: Session[] = [];
	publicSessions: Session[] = [];
	joinSessionForm: FormGroup;
	sessionsByTags: Session[] = [];
	get mySessions(): Session[] {
		return this.tutorSessions.concat(this.tuteeSessions);
	};

	constructor(private sessionService: SessionService,
				private fb: FormBuilder, private router: Router,
				private userService: UserService,
				private auth: AuthService) { }

	ngOnInit() {
		this.joinSessionForm = this.fb.group({
			'sessionId': ['', [Validators.required]]
		});
		this.auth.auth$.subscribe(val => {
			this.sessionService.findMySessions().tutorSessions
			.subscribe(
				val1 => this.tutorSessions = val1,
				err => console.log(err)
			);
			this.sessionService.findMySessions().tuteeSessions
			.subscribe(
				val2 => this.tuteeSessions = val2,
				err => console.log(err)
			);

			this.sessionService.findPublicSessions()
			.subscribe(
				val3 => this.publicSessions = val3,
				err => console.log(err)
			);
		});
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

	findSessionsByTags(tagsStr: string) {
		let tags = tagsStr.split(',').map(tag => tag.trim());
		this.sessionService.findSessionsByTags(tags).subscribe(val => {
			this.sessionsByTags = val;
		});
	}
}
