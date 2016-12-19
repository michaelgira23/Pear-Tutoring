import { Component, OnInit } from '@angular/core';
import { FirebaseAuthState } from 'angularfire2';
import { UserService } from '../shared/model/user.service';

@Component({
	selector: 'app-navbar',
	templateUrl: './navbar.component.html',
	styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {

	authInfo: FirebaseAuthState;

	constructor(private userService: UserService) { }

	ngOnInit() {
		this.userService.auth$.subscribe(
			data => {
				this.authInfo = data;
			},
			err => {
				console.log('auth error', err);
			}
		);
	}

}
