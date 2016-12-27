import { Component, OnInit } from '@angular/core';
import { NotificationsService } from './shared/model/notifications.service';

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

	constructor (private notificationsService: NotificationsService) { }

	ngOnInit() {
		this.notificationsService.init();
	}

}
