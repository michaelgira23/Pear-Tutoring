import { Component, OnInit, Input } from '@angular/core';
import { User } from '../../shared/model/user';
import { userStatus } from '../../shared/model/user.service';

@Component({
	selector: 'app-display-user',
	templateUrl: './display-user.component.html',
	styleUrls: ['./display-user.component.scss']
})
export class DisplayUserComponent implements OnInit {

	@Input()
	user: User;
	get statusColor(): string {
		switch (this.user.status) {
			case userStatus.ONLINE: return '#00C851';
			case userStatus.OFFLINE: return '2E2E2E';
			case userStatus.IN_SESSION: return 'FFBB33';
		}
		return '#2E2E2E';
	};

	constructor() { }

	ngOnInit() {
	}

}
