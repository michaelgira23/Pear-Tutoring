import { Injectable, Inject } from '@angular/core';
import { AngularFire, FirebaseAuthState, FirebaseListObservable, FirebaseObjectObservable, FirebaseRef } from 'angularfire2';
import { Observable, Subject } from 'rxjs/Rx';

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

export const defaultTextPosition: Position = {
	anchor  : { x: 0, y: 0 },
	position: { x: 0, y: 0 },
	rotation: 0,
	scaling : { x: 1, y: 1 }
};

export const defaultShapeOptions: WhiteboardShapeOptions = {
	// Stroke Style
	strokeColor: '#111',
	strokeWidth: 5,
	strokeCap: 'round',
	strokeJoin: 'miter',
	dashOffset: 0,
	strokeScaling: true,
	dashArray: [],
	miterLimit: 10,
	// Fill Style
	fillColor: '#00bbff',
	// Shadow Style
	shadowColor: 'rgba(0, 0, 0, 0)',
	shadowBlur: 0,
	shadowOffset: { x: 0, y: 0 }
};

export const defaultShapePosition: Position = {
	anchor  : { x: 0, y: 0 },
	position: { x: 0, y: 0 },
	rotation: 0,
	scaling : { x: 1, y: 1 }
};

@Injectable()
export class WhiteboardService {

	authInfo: FirebaseAuthState;
	whiteboards: FirebaseListObservable<any>;
	sdkStorage: any;

	constructor(private af: AngularFire, private authService: AuthService, @Inject(FirebaseRef) fb) {
		this.sdkStorage = fb.storage().ref();
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

	/**
	 * Whiteboard
	 */

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

		return this.observableToPromise(this.whiteboards.push(whiteboard));
	}

	/**
	 * Whiteboard Markings
	 */

	getMarkings(key: string): FirebaseListObservable<any> {
		return this.af.database.list('whiteboardMarkings/' + key);
	}

	createMarking(key: string, path: Point[], options?: WhiteboardMarkingOptions, started: number = Date.now()): Observable<any> {
		// By default, use default options
		let marking: WhiteboardMarking = {
			started: started,
			finished: Date.now(),
			createdBy: this.authInfo ? this.authInfo.uid : null,
			options: Object.assign(defaultMarkingOptions, options),
			path
		};

		const whiteboardMarkings = this.getMarkings(key);
		return this.observableToPromise(whiteboardMarkings.push(marking));
	}

	/**
	 * Eraser
	 */

	eraseMarking(whiteboardKey: string, markingKey: string): Observable<any> {
		return this.observableToPromise(
			this.af.database.object('whiteboardMarkings/' + whiteboardKey + '/' + markingKey)
				.update({ erased: Date.now() }));
	}

	/**
	 * Whiteboard Text
	 */

	getTexts(key: string): FirebaseListObservable<any> {
		return this.af.database.list('whiteboardText/' + key);
	}

	createText(key: string, content: string, options: WhiteboardTextOptions, position: Position): Observable<any> {
		let text: WhiteboardText = {
			created: Date.now(),
			createdBy: this.authInfo ? this.authInfo.uid : null,
			options: Object.assign(defaultTextOptions, options),
			content,
			position
		};

		const whiteboardText = this.af.database.list('whiteboardText/' + key);
		return this.observableToPromise(whiteboardText.push(text));
	}

	editText(whiteboardKey: string, textKey: string, content: string, options: WhiteboardTextOptions, position: Position): Observable<any> {
		const textObject = this.af.database.object(`whiteboardText/${whiteboardKey}/${textKey}`);
		return this.observableToPromise(textObject.update({
			content,
			options,
			position
		}));
	}

	/**
	 * Whiteboard Shapes
	 */

	getShapes(key: string): FirebaseListObservable<any> {
		return this.af.database.list('whiteboardShapes/' + key);
	}

	createShape(
		key: string,
		type: string,
		options: WhiteboardShapeOptions,
		position: Position,
		size: Size,
		radius: number | Size): Observable<any> {

		let shape: WhiteboardShape = {
			created: Date.now(),
			createdBy: this.authInfo ? this.authInfo.uid : null,
			type,
			options: Object.assign(defaultShapeOptions, options),

		};

		const whiteboardShape = this.af.database.list('whiteboardShape/' + key);
		return this.observableToPromise([whiteboardShape.push(shape)]);
	}

	/**
	 * Snapshot
	 */

	storeSnapshot(wbId: string, snapshot: Blob | File): Observable<any> {
		// Upload file
		return this.observableToPromise(this.sdkStorage.child('wbSnapShots/' + wbId).put(snapshot))
			.map((snap: any) => {
				// Store 'snapshot' property in the whiteboard object
				return this.af.database.object('whiteboards/' + wbId).update({ snapshot: snap.metadata.downloadURLs[0] });
			});
	}

	private observableToPromise(promise): Observable<any> {

		const subject = new Subject<any>();

		promise
			.then(res => {
					subject.next(res);
					subject.complete();
				},
				err => {
					subject.error(err);
					subject.complete();
				});

		return subject.asObservable();
	}

}

/**
 * Whiteboard
 */

export interface Whiteboard {
	$key: string;
	created: number;
	createdBy: string;
	background: string;
}

export interface WhiteboardOptions {
	background?: string;
}

/**
 * Whiteboard Markings
 */

export interface WhiteboardMarking {
	$key?: string;
	started: number;
	finished: number;
	createdBy: string;
	options?: WhiteboardMarkingOptions;
	path: Point[];
	erased?: boolean;
}

export interface WhiteboardMarkingOptions extends ItemOptions { }

/**
 * Whiteboard Text
 */

export interface WhiteboardText {
	$key?: string;
	created: number;
	createdBy: string;
	options?: WhiteboardTextOptions;
	position?: Position;
	content: string;
	erased?: boolean;
}

export interface WhiteboardTextOptions extends ItemOptions {
	// Character Style
	fontFamily?: string;
	fontWeight?: string | number;
	fontSize?: number | string;
}

/**
 * Whiteboard Shapes
 */

export interface WhiteboardShape {
	$key?: string;
	created: number;
	createdBy: string;
	type: string;
	options?: WhiteboardShapeOptions;
	position?: Position;
	size?: Size;
	radius?: number | Size;
	erased?: boolean;
}

export interface WhiteboardShapeOptions extends ItemOptions { }

/**
 * Generic Types
 */

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

export interface Position {
	anchor?: Point;
	position?: Point;
	rotation?: number;
	scaling?: Point;
}

export interface Size {
	width: number;
	height: number;
}

export interface Point {
	x: number;
	y: number;
}
