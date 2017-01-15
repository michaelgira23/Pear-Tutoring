import { Component, OnInit, ViewChild } from '@angular/core';
import { FirebaseAuthState } from 'angularfire2';
import { Observable, Subject } from 'rxjs';

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
	// Whether or not to add transition duration and timing function properties to SVG
	animate: boolean = false;
	// List of CSS classes that refer to SVGs to write text
	animations: string[] = [
		'share-knowledge',
		'pass-your-test',
		'impact-your-community'
	];

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

		// Loop through SVG text and write
		this.animateHandwritingSVG(this.animations[0])
			.expand(n => {
				return this.animateHandwritingSVG(++n % this.animations.length);
			})
			.subscribe();
	}

	// Writes and disappears an SVG. Animation time varies depending on how long text is.
	// Returns an observable that completes when animation finishes. Animation will run independent of subscribing to this observable.
	animateHandwritingSVG(className: string | number): Observable<any> {
		// Create subject for emitting observable when finished
		const subject = new Subject();

		// Interval each marking path should be drawn in at (in ms)
		const interval = 100;
		// Delay to show SVG after it has been drawn (in ms)
		const delay = 1000;

		// If number, get class name from animations array
		if (typeof className === 'number') {
			className = this.animations[className];
		}

		// Get nth
		const animationIndex = this.animations.indexOf(className);

		// Get SVG and paths from DOM
		const svg: SVGElement = <SVGElement>document.getElementsByClassName(className)[0];
		const paths = svg.getElementsByTagName('path');

		// Turn of animation for reseting values
		this.animate = false;
		this.resetDashArrayOffset(className);
		// Reset height of animation
		(<any>svg).style.height = '100%';

		// Iterate through paths and set timeout for drawing path back in
		for (let i = 0; i < paths.length; i++) {
			const path = paths[i];
			setTimeout(() => {
				this.animate = true;
				path.style.strokeDashoffset = '0';
			}, interval * i + 5);
		}

		// Set final interval for shrinking SVG
		setTimeout(() => {
			this.animate = true;
			(<any>svg).style.height = '0';

			// Emit observable after height is animated
			setTimeout(() => {
				subject.next(animationIndex);
				subject.complete();
			}, interval);

		}, (interval * paths.length) + delay);

		return subject.asObservable();
	}

	resetDashArrayOffset(className: string) {
		const svg: SVGElement = <SVGElement>document.getElementsByClassName(className)[0];
		const paths = svg.getElementsByTagName('path');

		for (let i = 0; i < paths.length; i++) {
			const path = paths[i];
			const pathLength = String(path.getTotalLength());

			// Hide path (convert to string so Typescript doesn't complain)
			path.style.strokeDasharray = pathLength;
			path.style.strokeDashoffset = pathLength;
		}
	}

}
