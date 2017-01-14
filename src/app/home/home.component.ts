import { Component, OnInit, ViewChild } from '@angular/core';
import { FirebaseAuthState } from 'angularfire2';

import { AuthService } from '../shared/security/auth.service';

@Component({
	selector: 'app-home',
	templateUrl: './home.component.html',
	styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

	@ViewChild('video')
	video;

	authInfo: FirebaseAuthState;

	constructor(private authService: AuthService) {
		this.authService.auth$.subscribe(authInfo => this.authInfo = authInfo);
	}

	ngOnInit() {
		// Fix weird Chrome bug where video won't autoplay
		setTimeout(() => {
			if (this.video.nativeElement.paused) {
				this.video.nativeElement.play();
			}
		}, 150);
	}

}
