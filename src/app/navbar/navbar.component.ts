import { Component, OnInit } from '@angular/core';
import { FirebaseAuthState } from 'angularfire2';
import { AuthService } from '../shared/security/auth.service';

@Component({
	selector: 'app-navbar',
	templateUrl: './navbar.component.html',
	styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {

	authInfo: FirebaseAuthState;

	constructor(private authService: AuthService) { }

	ngOnInit() {
		this.authService.auth$.subscribe(
			data => {
				this.authInfo = data;
			},
			err => {
				console.log('auth error', err);
			}
		);
	}

	logout() {
		this.authService.logout();
	}

}
