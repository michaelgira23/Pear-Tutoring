import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { WhiteboardService, WhiteboardOptions, defaultWhiteboardOptions } from '../shared/model/whiteboard.service';

@Component({
	selector: 'app-create-whiteboard',
	templateUrl: './create-whiteboard.component.html',
	styleUrls: ['./create-whiteboard.component.scss']
})
export class CreateWhiteboardComponent implements OnInit {

	options: WhiteboardOptions = defaultWhiteboardOptions;

	constructor(private router: Router, private whiteboardService: WhiteboardService) { }

	ngOnInit() {
	}

	create() {
		this.whiteboardService.createWhiteboard(this.options)
			.subscribe(
				data => {
					console.log('create whiteboard successful', data);
					console.log('new whiteboard key', data.getKey());
					this.router.navigate(['whiteboard', data.getKey()]);
				},
				err => {
					console.log('there was an error creating the whiteboard!');
				}
			);
	}

}
