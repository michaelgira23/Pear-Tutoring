import { Component, OnInit, Input, OnChanges, SimpleChange } from '@angular/core';
import { User } from '../../shared/model/user';
import { userStatus } from '../../shared/model/user.service';

@Component({
	selector: 'app-display-user',
	templateUrl: './display-user.component.html',
	styleUrls: ['./display-user.component.scss']
})
export class DisplayUserComponent implements OnInit, OnChanges {

	@Input()
	user: User;
	get statusColor(): string {
		switch (this.user.status) {
			case userStatus.ONLINE: return '#00C851';
			case userStatus.OFFLINE: return '#4B515D';
			case userStatus.IN_SESSION: return '#FFBB33';
		}
		return '#4B515D';
	};

	constructor() { }

	ngOnInit() {
	}

	ngOnChanges(changes: {[key: string]: SimpleChange}) {
		this.user = changes['user'].currentValue;
	}
}
