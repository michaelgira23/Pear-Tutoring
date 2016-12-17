import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Validators, FormGroup, FormBuilder } from '@angular/forms';
import { UserService } from '../shared/model/user.service';

@Component({
	selector: 'app-register',
	templateUrl: './register.component.html',
	styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {

	form: FormGroup;

	constructor(private fb: FormBuilder, private router: Router, private userService: UserService) {
		this.form = this.fb.group({
			email: ['', Validators.required],
			password: ['', Validators.required]
		});
	}

	ngOnInit() {
	}

	register() {
		const formValue = this.form.value;
		this.userService.register(formValue.email, formValue.password).subscribe(
			data => {
				this.router.navigate(['/home']);
			},
			err => {
				console.log('Register error', err);
			}
		);
	}

}
