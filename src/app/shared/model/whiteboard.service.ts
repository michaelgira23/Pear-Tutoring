import { Injectable, Inject } from '@angular/core';
import { AngularFire, FirebaseAuthState, FirebaseListObservable, FirebaseObjectObservable, FirebaseRef } from 'angularfire2';
import { Observable, Subject } from 'rxjs/Rx';

import { AuthService } from '../security/auth.service';
import { Whiteboard, WhiteboardOptions,
	WhiteboardMarking, WhiteboardMarkingOptions,
	WhiteboardText, WhiteboardTextOptions,
	StyleOptions,
	Font } from './whiteboard';

export const defaultWhiteboardOptions: WhiteboardOptions = {
	name: 'Unnamed Whiteboard',
	background: '#fff'
};

export const defaultStyleOptions: StyleOptions = {
	stroke: {
		color: '#111',
		width: 2,
		cap: 'round',
		join: 'miter',
		dashOffset: 0,
		scaling: true,
		dashArray: [],
		miterLimit: 10
	},
	fill: {
		color: '#0bf'
	},
	shadow: {
		color: 'rgba(0, 0, 0, 0)',
		blur: 0,
		offset: { x: 0, y: 0 }
	}
};

export const defaultFontOptions: Font = {
	family: 'sans-serif',
	weight: 400,
	size: 32
};

@Injectable()
export class WhiteboardService {

	authInfo: FirebaseAuthState;
	whiteboards: FirebaseListObservable<Whiteboard[]>;
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

	getWhiteboard(key: string): FirebaseObjectObservable<Whiteboard> {
		return this.af.database.object('whiteboards/' + key);
	}

	createWhiteboard(options: WhiteboardOptions): Observable<any> {
		const whiteboard: Whiteboard = {
			created: Date.now(),
			createdBy: this.authInfo ? this.authInfo.uid : null,
			name: options.name,
			background: options.background
		};
		return this.observableToPromise(this.whiteboards.push(whiteboard));
	}

	changeName(key: string, name: string): Observable<Whiteboard> {
		return this.observableToPromise(this.af.database.object('whiteboards/' + key).update({name}));
	}

	/**
	 * Whiteboard Markings
	 */

	getMarkings(key: string): FirebaseListObservable<WhiteboardMarking[]> {
		return this.af.database.list('whiteboardMarkings/' + key);
	}

	createMarking(key: string, options: WhiteboardMarkingOptions): Observable<any> {
		const marking: WhiteboardMarking = {
			created: Date.now(),
			createdBy: this.authInfo ? this.authInfo.uid : null,
			style: options.style,
			started: options.started,
			path: options.path
		};
		const whiteboardMarkings = this.getMarkings(key);
		return this.observableToPromise(whiteboardMarkings.push(marking));
	}

	eraseMarking(whiteboardKey: string, markingKey: string): Observable<WhiteboardMarking> {
		return this.observableToPromise(
			this.af.database.object('whiteboardMarkings/' + whiteboardKey + '/' + markingKey)
				.update({ erased: Date.now() }));
	}

	/**
	 * Whiteboard Text
	 */

	getTexts(key: string): FirebaseListObservable<WhiteboardText[]> {
		return this.af.database.list('whiteboardText/' + key);
	}

	createText(key: string, options: WhiteboardTextOptions): Observable<WhiteboardText> {
		const text: WhiteboardText = {
			created: Date.now(),
			createdBy: this.authInfo ? this.authInfo.uid : null,
			style: options.style,
			rotation: options.rotation,
			bounds: options.bounds,
			content: options.content,
			font: options.font
		};

		const whiteboardText = this.getTexts(key);
		return this.observableToPromise(whiteboardText.push(text));
	}

	eraseText(whiteboardKey: string, textKey: string): Observable<WhiteboardText> {
		return this.observableToPromise(
			this.af.database.object('whiteboardText/' + whiteboardKey + '/' + textKey)
				.update({ erased: Date.now() }));
	}

	// editText(whiteboardKey: string, textKey: string, content: string, options: WhiteboardTextOptions, position: Position): Observable<any> {
	// 	const textObject = this.af.database.object(`whiteboardText/${whiteboardKey}/${textKey}`);
	// 	return this.observableToPromise(textObject.update({
	// 		content,
	// 		options,
	// 		position
	// 	}));
	// }

	/**
	 * Snapshot
	 */

	storeSnapshot(key: string, snapshot: Blob | File): Observable<any> {
		// Upload file
		return this.observableToPromise(this.sdkStorage.child('wbSnapShots/' + key).put(snapshot))
			.map((snap: any) => {
				// Store 'snapshot' property in the whiteboard object
				return this.af.database.object('whiteboards/' + key).update({ snapshot: snap.metadata.downloadURLs[0] });
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
