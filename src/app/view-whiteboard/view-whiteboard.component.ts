import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { defaultStyleOptions } from '../shared/model/whiteboard.service';

@Component({
	selector: 'app-view-whiteboard',
	templateUrl: './view-whiteboard.component.html',
	styleUrls: ['./view-whiteboard.component.scss']
})
export class ViewWhiteboardComponent implements OnInit {

	key: string;
	styleOptions = defaultStyleOptions;
	showToolbar: boolean = true;

	constructor(private route: ActivatedRoute) { }

	ngOnInit() {
		this.route.params.subscribe(
			params => {
				this.key = params['key'];
			}
		);
	}

}
