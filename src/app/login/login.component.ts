import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Validators, FormGroup, FormBuilder } from '@angular/forms';
import { AuthService } from '../shared/security/auth.service';

@Component({
	selector: 'app-login',
	templateUrl: './login.component.html',
	styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

	form: FormGroup;

	constructor(private fb: FormBuilder, private router: Router, private authService: AuthService) {
		this.form = this.fb.group({
			email: ['', Validators.required],
			password: ['', Validators.required]
		});
	}

	ngOnInit() {
	}

	login() {
		const formValue = this.form.value;
		this.authService.login(formValue.email, formValue.password).subscribe(
			data => {
				// this.router.navigate(['dashboard']);
				window.location.replace('/dashboard');
			},
			err => {
				console.log('Login error', err);
			}
		);
	}

}
