import { Injectable } from '@angular/core';
import { AngularFire, FirebaseAuthState, FirebaseListObservable, FirebaseObjectObservable } from 'angularfire2';
import { Observable } from 'rxjs/Rx';

import { AuthService } from '../security/auth.service';

export const defaultWhiteboardOptions: WhiteboardOptions = {
	background: '#FFF'
};

export const defaultMarkingOptions: WhiteboardMarkingOptions = {
	// Stroke Style
	strokeColor: '#111',
	strokeWidth: 2,
	strokeCap: 'round',
	strokeJoin: 'miter',
	dashOffset: 0,
	strokeScaling: true,
	dashArray: [],
	miterLimit: 10,
	// Fill Style
	fillColor: 'rgba(0, 0, 0, 0)',
	// Shadow Style
	shadowColor: 'rgba(0, 0, 0, 0)',
	shadowBlur: 0,
	shadowOffset: { x: 0, y: 0 }
};

export const defaultTextOptions: WhiteboardTextOptions = {
	// Stroke Style
	strokeColor: 'rgba(0, 0, 0, 0)',
	strokeWidth: 0,
	strokeCap: 'round',
	strokeJoin: 'miter',
	dashOffset: 0,
	strokeScaling: true,
	dashArray: [],
	miterLimit: 10,
	// Fill Style
	fillColor: '#111',
	// Shadow Style
	shadowColor: 'rgba(0, 0, 0, 0)',
	shadowBlur: 0,
	shadowOffset: { x: 0, y: 0 },
	// Character Style
	fontFamily: 'sans-serif',
	fontWeight: 600,
	fontSize: '2.5em'
};

export const defaultTextPosition: WhiteboardTextPosition = {
	anchor  : { x: 0, y: 0 },
	position: { x: 0, y: 0 },
	pivot   : { x: 0, y: 0 },
	rotation: 0,
	scaling : { x: 1, y: 1 }
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

	eraseMarking(whiteboardKey: string, markingKey: string): Observable<any> {
		return Observable.from([
			this.af.database.object('whiteboardMarkings/' + whiteboardKey + '/' + markingKey)
				.update({ erased: Date.now() })
		]);
	}

	getTexts(key: string): FirebaseListObservable<any> {
		return this.af.database.list('whiteboardText/' + key);
	}

	createText(key: string, content: string, options: WhiteboardTextOptions): Observable<any> {
		let text: WhiteboardText = {
			created: Date.now(),
			createdBy: this.authInfo ? this.authInfo.uid : null,
			options: Object.assign(defaultTextOptions, options),
			content
		};

		const whiteboardText = this.af.database.list('whiteboardText/' + key);
		return Observable.from([whiteboardText.push(text)]);
	}

}

export interface Whiteboard {
	$key: string;
	created: number;
	createdBy: string;
	background: string;
}

export interface WhiteboardOptions {
	background?: string;
}

export interface WhiteboardMarking {
	$key?: string;
	created: number;
	createdBy: string;
	options?: WhiteboardMarkingOptions;
	path: Point[];
	erased?: boolean;
}

export interface WhiteboardMarkingOptions extends ItemOptions { }

export interface WhiteboardText {
	$key?: string;
	created: number;
	createdBy: string;
	options?: WhiteboardTextOptions;
	position?: WhiteboardTextPosition;
	content: string;
	erased?: boolean;
}

export interface WhiteboardTextOptions extends ItemOptions {
	// Character Style
	fontFamily?: string;
	fontWeight?: string | number;
	fontSize?: number | string;
}

export interface WhiteboardTextPosition {
	anchor?: Point;
	position?: Point;
	pivot?: Point;
	rotation?: number;
	scaling?: Point;
}

interface ItemOptions {
	// Stroke Style
	strokeColor?: string;
	strokeWidth?: number;
	strokeCap?: string;
	strokeJoin?: string;
	dashOffset?: number;
	strokeScaling?: boolean;
	dashArray?: number[];
	miterLimit?: number;
	// Fill Style
	fillColor?: string;
	// Shadow Style
	shadowColor?: string;
	shadowBlur?: number;
	shadowOffset?: Point;
}

export interface Point {
	x: number;
	y: number;
}
