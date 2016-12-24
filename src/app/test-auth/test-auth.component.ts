import { Component, OnInit } from '@angular/core';

import { AuthService } from '../shared/security/auth.service';

@Component({
	selector: 'app-test-auth',
	templateUrl: './test-auth.component.html',
	styleUrls: ['./test-auth.component.scss']
})
export class TestAuthComponent implements OnInit {

	authFireTime: number;
	constructionTime: number;
	count: number = 0;
	initTime: number;
	actions: string[] = [];

	constructor(private authService: AuthService) {
		this.constructionTime = Date.now();
	}

	ngOnInit() {
		this.initTime = Date.now();

		this.authService.auth$.subscribe(
			data => {
				this.count++;
				this.authFireTime = Date.now();
				this.actions.push(`auth$ emitted ${data} after ${ Date.now() - this.initTime } ms`);
			},
			err => {
				console.log(`Getting auth$ error: ${err}`);
				this.actions.push(`auth$ errored ${err} after ${ Date.now() - this.initTime } ms`);
			},
			() => {
				this.actions.push(`auth$ completed after ${ Date.now() - this.initTime } ms`);
			}
		);
	}

}
