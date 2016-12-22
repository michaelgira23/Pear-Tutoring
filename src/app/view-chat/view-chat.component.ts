import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
	selector: 'app-view-chat',
	templateUrl: './view-chat.component.html',
	styleUrls: ['./view-chat.component.scss']
})
export class ViewChatComponent implements OnInit {

	key: string;

	constructor(private route: ActivatedRoute) { }

	ngOnInit() {
		this.route.params.subscribe(
			params => {
				this.key = params['key'];
			}
		);
	}
}
