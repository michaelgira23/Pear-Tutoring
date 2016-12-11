import { Injectable } from '@angular/core';
import { AngularFire, FirebaseAuthState, FirebaseListObservable, FirebaseObjectObservable } from 'angularfire2';
import { Observable } from 'rxjs/Rx';

import { AuthService } from '../security/auth.service';

@Injectable()
export class WhiteboardService {

	authInfo: FirebaseAuthState;
	whiteboards: FirebaseListObservable<any>;

	constructor(private af: AngularFire, private authService: AuthService) {
		this.whiteboards = this.af.database.list('whiteboards');

		this.authService.auth$.subscribe(
			data => {
				this.authInfo = data;
			},
			err => {
				console.log('auth error whitebaord', err);
			}
		);
	}

	getWhiteboard(key: string): FirebaseObjectObservable<any> {
		return this.af.database.object('whiteboards/' + key);
	}

	createWhiteboard(options?: WhiteboardOptions): Observable<any> {
		// Override default options with any options supplied
		options = Object.assign(defaultWhiteboardOptions, options);

		// Object to insert in the database
		let whiteboard: any = options;
		whiteboard.created = Date.now();
		whiteboard.createdBy = this.authInfo.uid;

		return Observable.from([this.whiteboards.push(whiteboard)]);
	}

	getMarkings(key: string): FirebaseObjectObservable<any> {
		return this.af.database.object('whiteboardMarkings/' + key);
	}

	createMarking(key: string, marking: WhiteboardMarking): Observable<any> {
		// By default, use default options
		marking.options = Object.assign(defaultMarkingOptions, marking.options);

		const whiteboardMarkings = this.af.database.list('whiteboardMarkings/' + key);
		return Observable.from([whiteboardMarkings.push(marking)]);
	}

}

export const defaultWhiteboardOptions: WhiteboardOptions = {
	anyoneWrite: true,
	background: 'white'
};

export const defaultMarkingOptions: WhiteboardMarkingOptions = {
	strokeColor: 'black',
	strokeWidth: 2,
	strokeCap: 'round',
	strokeJoin: 'miter',
	dashOffset: 0,
	strokeScaling: true,
	dashArray: [],
	miterLimit: 10
};

export interface Whiteboard {
	created: number;
	createdBy: string;
	anyoneWrite: boolean;
	background: string;
}

export interface WhiteboardOptions {
	anyoneWrite?: boolean;
	background?: string;
}

export interface WhiteboardMarking {
	options?: WhiteboardMarkingOptions;
	segments: number[][];
}

export interface WhiteboardMarkingOptions {
	strokeColor?: string;
	strokeWidth?: number;
	strokeCap?: string;
	strokeJoin?: string;
	dashOffset?: number;
	strokeScaling?: boolean;
	dashArray?: number[];
	miterLimit?: number;
}
