import { Component, OnInit, Input } from '@angular/core';
import { Session } from '../../shared/model/session'

@Component({
	selector: 'app-display-session',
	templateUrl: './display-session.component.html',
	styleUrls: ['./display-session.component.scss']
})
export class DisplaySessionComponent implements OnInit {

	@Input()
	session: Session

	constructor() { }

	ngOnInit() {
	}

}
