import { Component, OnInit } from '@angular/core';
import { WhiteboardService } from '../shared/model/whiteboard.service';

@Component({
	selector: 'app-whiteboard',
	templateUrl: './whiteboard.component.html',
	styleUrls: ['./whiteboard.component.scss']
})
export class WhiteboardComponent implements OnInit {

	constructor(private whiteboardService: WhiteboardService) { }

	ngOnInit() {
		this.whiteboardService.createWhiteboard().subscribe(
			data => {
				console.log('data', data);
			},
			err => {
				console.log('create whiteboard error!', err);
			}
		);
	}

}
