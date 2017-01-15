import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { FirebaseAuthState } from 'angularfire2';
import { Observable } from 'rxjs';

import { AuthService } from '../shared/security/auth.service';

@Component({
	selector: 'app-home',
	templateUrl: './home.component.html',
	styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {

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
	// Whether or not animation timer has already started
	animationSubscription: any;

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
		this.animationSubscription = this.animateHandwritingSVG(this.animations[0])
			.expand(n => {
				return this.animateHandwritingSVG(++n % this.animations.length);
			})
			.subscribe();
	}

	ngOnDestroy() {
		this.animationSubscription.unsubscribe();
	}

	// Writes and disappears an SVG. Animation time varies depending on how long text is.
	animateHandwritingSVG(className: string | number): Observable<any> {
		return Observable.create(observer => {

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
					observer.next(animationIndex);
					observer.complete();
				}, interval);

			}, (interval * paths.length) + delay);
		});
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
