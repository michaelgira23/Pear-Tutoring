import { Injectable } from '@angular/core';
import { AngularFire, FirebaseAuthState } from 'angularfire2';
import { Observable, Subject } from 'rxjs/Rx';

import { AuthService } from '../security/auth.service';

@Injectable()
export class WhiteboardService {

	authInfo: FirebaseAuthState;
	whiteboards: any;

	constructor(private af: AngularFire, private authService: AuthService) {
		this.whiteboards = this.af.database.list('whiteboards');

		this.authService.auth$.subscribe(
			data => {
				console.log('auth state whiteboard', data);
				this.authInfo = data;
			},
			err => {
				console.log('auth error whitebaord', err);
			}
		);
	}

	createWhiteboard(options?: WhiteboardOptions): Observable<any> {
		const defaultOptions: WhiteboardOptions = {
			anyoneWrite: true
		};

		// Override default options with any options supplied
		options = Object.assign(defaultOptions, options);

		// Object to insert in the database
		let whiteboard: any = options;
		whiteboard.created = Date.now();
		whiteboard.createdBy = this.authInfo.uid;

		return Observable.from(this.whiteboards.push(whiteboard));
	}

	getWhiteboard(key) {
		return this.af.database.object('whiteboards/' + key);
	}

}

export interface Whiteboard {
	created: number;
	createdBy: string;
	anyoneWrite: boolean;
}

export interface WhiteboardOptions {
	anyoneWrite?: boolean;
}
