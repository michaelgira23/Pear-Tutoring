import { Component, OnInit } from '@angular/core';
import { SessionService } from '../shared/model/session.service';
import { AuthService } from '../shared/security/auth.service';
import { Session } from '../shared/model/session';
import { Validators, FormGroup, FormBuilder } from '@angular/forms';
@Component({
	selector: 'app-scheduling',
	templateUrl: './scheduling.component.html',
	styleUrls: ['./scheduling.component.scss']
})
export class SchedulingComponent implements OnInit {

	tutorSessions: Session[] = [];
	tuteeSessions: Session[] = [];
	publicSessions: Session[] = [];
	searchByTagForm: FormGroup;
	searchBySubjectForm: FormGroup;
	sessionsByTags: Session[] = [];
	sessionsBySubject: Session[] = [];
	get mySessions(): Session[] {
		return this.tutorSessions.concat(this.tuteeSessions);
	};

	constructor(
		private sessionService: SessionService,
		private fb: FormBuilder,
		private auth: AuthService
	) { }

	ngOnInit() {
		this.searchByTagForm = this.fb.group({
			tags: ['', Validators.required]
		});

		this.searchBySubjectForm = this.fb.group({
			subject: ['', Validators.required]
		});

		this.auth.auth$.subscribe(val => {
			this.sessionService.findMySessions().tutorSessions
			.subscribe(
				val1 => {this.tutorSessions = val1, console.log(val1);},
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

	findSessionsByTags() {
		let tags = this.searchByTagForm.value.tags.split(',').map(tag => tag.trim());
		this.sessionService.findSessionsByTags(tags).subscribe(val => {
			this.sessionsByTags = val;
		}, console.log);
	}

	findSessionsBySubject() {
		let subject = this.searchBySubjectForm.value.subject;
		this.sessionService.findSessionsBySubject(subject).subscribe(val => {
			console.log(val);
			this.sessionsBySubject = val;
		}, console.log);
	}
}
