import { Component, OnInit } from '@angular/core';
import { FirebaseAuth, FirebaseAuthState } from 'angularfire2';
import { AuthService } from '../shared/security/auth.service';

@Component({
	selector: 'app-navbar',
	templateUrl: './navbar.component.html',
	styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {

	authInfo: FirebaseAuthState;

	constructor(private auth: FirebaseAuth, private authService: AuthService) { }

	ngOnInit() {
		this.auth.subscribe(
			data => {
				console.log(data);
				this.authInfo = data;
			},
			err => {
				console.log(err);
			}
		);
	}

}
