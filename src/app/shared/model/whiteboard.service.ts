import { Injectable } from '@angular/core';
import { AngularFire } from 'angularfire2';
import { Observable, Subject } from 'rxjs/Rx';

@Injectable()
export class WhiteboardService {

	whiteboards: any;

	constructor(private af: AngularFire) {
		this.whiteboards = this.af.database.list('whiteboards');
	}

	createWhiteboard(): Observable<any> {
		const whiteboard = {
			created: Date.now()
		};
		return Observable.from(this.whiteboards.push(whiteboard));
	}

	getWhiteboard(key) {

	}

}
