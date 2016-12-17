import { Injectable } from '@angular/core';
import { AngularFire, FirebaseAuthState, FirebaseListObservable, FirebaseObjectObservable } from 'angularfire2';
import { Observable } from 'rxjs/Rx';

import { AuthService } from '../security/auth.service';

export const defaultWhiteboardOptions: WhiteboardOptions = {
	background: '#FFF'
};

export const defaultMarkingOptions: WhiteboardMarkingOptions = {
	strokeColor: '#111',
	strokeWidth: 2,
	strokeCap: 'round',
	strokeJoin: 'miter',
	dashOffset: 0,
	strokeScaling: true,
	dashArray: [],
	miterLimit: 10
};

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
		whiteboard.createdBy = this.authInfo ? this.authInfo.uid : null;

		return Observable.from([this.whiteboards.push(whiteboard)]);
	}

	getMarkings(key: string): FirebaseListObservable<any> {
		return this.af.database.list('whiteboardMarkings/' + key);
	}

	createMarking(key: string, path: Point[], options: WhiteboardMarkingOptions): Observable<any> {
		// By default, use default options
		let marking: WhiteboardMarking = {
			created: Date.now(),
			createdBy: this.authInfo ? this.authInfo.uid : null,
			options: Object.assign(defaultMarkingOptions, options),
			path
		};

		const whiteboardMarkings = this.getMarkings(key);
		return Observable.from([whiteboardMarkings.push(marking)]);
	}

}

export interface Whiteboard {
	created: number;
	createdBy: string;
	background: string;
}

export interface WhiteboardOptions {
	background?: string;
}

export interface WhiteboardMarking {
	created: number;
	createdBy: string;
	options?: WhiteboardMarkingOptions;
	path: Point[];
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

export interface Point {
	x: number;
	y: number;
}
