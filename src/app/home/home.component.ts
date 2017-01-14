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

		this.animateHandwritingSVG('share-knowledge');
	}

	animateHandwritingSVG(className: string) {
		// Interval each marking path should be drawn in at (in ms)
		const interval = 100;
		// Delay to show SVG after it has been drawn (in ms)
		const delay = 1000;

		const svg: SVGElement = <SVGElement>document.getElementsByClassName(className)[0];
		const paths = svg.getElementsByTagName('path');

		for (let i = 0; i < paths.length; i++) {
			const path = paths[i];
			const pathLength = String(path.getTotalLength());

			// Hide path (convert to string so Typescript doesn't complain)
			path.style.strokeDasharray = pathLength;
			path.style.strokeDashoffset = pathLength;

			// Set timeout for drawing path back in
			setTimeout(() => {
				path.style.strokeDashoffset = '0';
			}, interval * i);
		}

		// Reset height of animation has played before
		(<any>svg).style.height = '100%';

		// Set final interval for shrinking SVG
		setTimeout(() => {
			(<any>svg).style.height = '0';
		}, (interval * paths.length) + delay);
	}

}
