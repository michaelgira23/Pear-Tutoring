import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SessionService } from '../../shared/model/session.service';

@Component({
	selector: 'app-update-session',
	templateUrl: './update-session.component.html',
	styleUrls: ['./update-session.component.scss']
})
export class UpdateSessionComponent implements OnInit {

	sessionId: string;

	constructor(private sessionService: SessionService, private route: ActivatedRoute) {
	}

	ngOnInit() {
		this.route.params.subscribe(params => {
			this.sessionId = params['id'];
		});
	}

}
