import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Validators, FormGroup, FormBuilder } from '@angular/forms';
import { UserService, RegisterOptions } from '../shared/model/user.service';

@Component({
	selector: 'app-register',
	templateUrl: './register.component.html',
	styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {

	form: FormGroup;

	constructor(private fb: FormBuilder, private router: Router, private userService: UserService) {
		this.form = this.fb.group({
			firstName: ['', Validators.required],
			lastName: ['', Validators.required],
			email: ['', Validators.required],
			password: ['', Validators.required],
			grade: ['', Validators.required]
		});
	}

	ngOnInit() {
	}

	register() {
		let formValue: RegisterOptions = Object.assign({}, this.form.value);
		for (let prop in formValue) {
			if (formValue[prop]) {
				formValue[prop] = formValue[prop].trim();
			}
		}
		this.userService.register(formValue).subscribe(
			data => {
				this.router.navigate(['/home']);
			},
			err => {
				console.log('Register error', err);
			}
		);
	}

}
