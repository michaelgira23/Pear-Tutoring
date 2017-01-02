import { Component, OnInit, ViewChild } from '@angular/core';

@Component({
	selector: 'app-home',
	templateUrl: './home.component.html',
	styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

	@ViewChild('video')
	video;

	constructor() { }

	ngOnInit() {
		// Fix weird Chrome bug where video won't autoplay
		setTimeout(() => {
			if (this.video.nativeElement.paused) {
				this.video.nativeElement.play();
			}
		}, 150);
	}

}
