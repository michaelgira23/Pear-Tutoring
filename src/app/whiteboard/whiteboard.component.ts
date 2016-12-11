import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { WhiteboardService, Whiteboard } from '../shared/model/whiteboard.service';

declare const paper;

@Component({
	selector: 'app-whiteboard',
	templateUrl: './whiteboard.component.html',
	styleUrls: ['./whiteboard.component.scss']
})
export class WhiteboardComponent implements OnInit {

	@Input()
	key: string;
	whiteboard: Whiteboard;

	constructor(private route: ActivatedRoute, private whiteboardService: WhiteboardService) { }

	ngOnInit() {
		// Listen to route parameters until we get session component up
		this.route.params.subscribe(
			params => {
				this.key = params['key'];
				this.whiteboardService.getWhiteboard(this.key).subscribe(
					data => {
						console.log('data', data);
						this.whiteboard = data;
					},
					err => {
						console.log('create whiteboard error!', err);
					}
				);
			}
		);
	}

}
