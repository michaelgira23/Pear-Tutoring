import { Component, OnInit } from '@angular/core';
import { Validators, FormGroup, FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../shared/security/auth.service';

@Component({
	selector: 'app-register',
	templateUrl: './register.component.html',
	styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {

	form: FormGroup;

	constructor(private fb: FormBuilder, private router: Router, private authService: AuthService) {
		this.form = this.fb.group({
			email: ['', Validators.required],
			password: ['', Validators.required]
		});
	}

	ngOnInit() {
	}

	register() {
		console.log("reister called")
		const formValue = this.form.value;
		this.authService.register(formValue.email, formValue.password).subscribe(
			data => {
				this.router.navigate(['/home']);
			},
			err => {
				console.log('Register error', err);
			}
		);
	}

}
