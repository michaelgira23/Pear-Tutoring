import { Injectable, Inject } from '@angular/core';
import * as firebase from 'firebase';
import { AngularFire, FirebaseAuthState, FirebaseListObservable, FirebaseObjectObservable, FirebaseRef } from 'angularfire2';
import { Observable, Subject } from 'rxjs/Rx';
import _ from 'lodash';

import { AuthService } from '../security/auth.service';
import { styles, colors } from '../../whiteboard/utils/serialization';
import { removeRedundant } from '../../whiteboard/utils/diff';
import { Whiteboard, WhiteboardOptions,
	WhiteboardMarking, WhiteboardMarkingOptions,
	WhiteboardText, WhiteboardTextOptions,
	StyleOptions,
	Font } from './whiteboard';

// Declare the `Array.prototype.includes` because we use a Polyfill
declare global {
	interface Array<T> {
		includes(searchElement: T): boolean;
	}
}

const editableMarkingProperties = [
	'style',
	'path'
];

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

	constructor(
		private af: AngularFire,
		@Inject(FirebaseRef) fb,
		private authService: AuthService
	) {
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

	getWhiteboard(whiteboardKey: string): FirebaseObjectObservable<Whiteboard> {
		return this.af.database.object(`whiteboards/${whiteboardKey}`);
	}

	createWhiteboard(options: WhiteboardOptions): Observable<any> {
		const whiteboard: Whiteboard = {
			created: firebase.database['ServerValue']['TIMESTAMP'],
			createdBy: this.authInfo ? this.authInfo.uid : null,
			name: options.name,
			background: colors.serialize(options.background)
		};
		return this.observableToPromise(this.whiteboards.push(whiteboard));
	}

	changeName(key: string, name: string): Observable<Whiteboard> {
		return this.observableToPromise(this.af.database.object('whiteboards/' + key).update({name}));
	}

	/**
	 * Whiteboard Markings
	 */

	getMarkings(whiteboardKey: string): FirebaseListObservable<WhiteboardMarking[]> {
		return this.af.database.list(`whiteboardMarkings/${whiteboardKey}`);
	}

	getFormattedMarkings(whiteboardKey: string): Observable<WhiteboardMarking[]> {
		return this.getMarkings(whiteboardKey)
			.map(markings => { return markings.map(this.currentMarking); });
	}

	getMarking(whiteboardKey: string, markingKey: string): FirebaseObjectObservable<WhiteboardMarking> {
		return this.af.database.object(`whiteboardMarkings/${whiteboardKey}/${markingKey}`);
	}

	getFormattedMarking(whiteboardKey: string, markingKey: string): Observable<WhiteboardMarking> {
		return this.getMarking(whiteboardKey, markingKey)
			.map(this.currentMarking);
	}

	// Compiles the edits in a marking object to the most up-to-date properties of the total marking
	currentMarking(marking: WhiteboardMarking): WhiteboardMarking {

		// If marking doesn't exist, return null
		if (!marking.$exists()) {
			return null;
		}

		// If no edits, then initial values are the most up-to-date
		if (typeof marking.edits !== 'object') {
			// Delete marking edits property just in case it was something dumb like a boolean
			// Yeah. Booleans are pretty dumb.
			delete marking.edits;
			return marking;
		}

		// Convert edits to arrays. We don't care about push keys.
		let edits = [];
		const editKeys = Object.keys(marking.edits);
		editKeys.forEach(editKey => {
			edits.push(marking.edits[editKey]);
		});

		// Sort edits in chronological order
		edits.sort((a, b) => {
			return a.edited - b.edited;
		});

		// Go through edit timestamps and update respective values
		edits.forEach(edit => {
			// Go through edit properties and make sure they're editable
			const editProperties = Object.keys(edit);
			for (let i = 0; i < editProperties.length; i++) {
				const editProperty = editProperties[i];

				// If property isn't editable, ignore
				if (!editableMarkingProperties.includes(editProperty)) {
					continue;
				}

				// New value to edit in the marking object
				let newValue = edits[editProperty];

				// If editting style, merge with the current styles
				if (typeof newValue === 'object' && editProperty === 'style') {
					// Merge new edits with current object
					newValue = Object.assign(marking[editProperty], newValue);
				}

				// Edit value
				marking[editProperty] = newValue;
			}
		});

		// Delete edits and return
		delete marking.edits;
		return marking;
	}

	createMarking(key: string, options: WhiteboardMarkingOptions): Observable<any> {
		const marking: WhiteboardMarking = {
			created: firebase.database['ServerValue']['TIMESTAMP'],
			createdBy: this.authInfo ? this.authInfo.uid : null,
			style: styles.serializeOptions(options.style),
			drawTime: options.drawTime,
			path: options.path
		};
		const whiteboardMarkings = this.getMarkings(key);
		return this.observableToPromise(whiteboardMarkings.push(marking));
	}

	editMarking(whiteboardKey: string, markingKey: string, options: any): Observable<any> {
		// Get current marking
		return this.getFormattedMarking(whiteboardKey, markingKey)
			.first()
			.map(marking => {
				let edits = {};
				// Go through options and make sure they're editable
				const editProperties = Object.keys(options);
				for (let i = 0; i < editProperties.length; i++) {
					const editProperty = editProperties[i];

					// If property isn't editable, ignore
					if (!editableMarkingProperties.includes(editProperty)) {
						continue;
					}

					let newValue = null;

					// If new edit properties aren't the same as existing properties, add
					if (!_.isEqual(options[editProperty], marking[editProperty])) {
						// Totally reassign properties, unless it's style
						// We can get rid of redundant styles because style objects have a fixed length
						if (editProperty === 'style') {
							newValue = removeRedundant(marking[editProperty], options[editProperty]);
						} else {
							newValue = options[editProperty];
						}
					}

					// If newValue doesn't equal null, then let's edit the property!
					if (newValue !== null) {
						edits[editProperty] = newValue;
					}
				}

				return this.af.database.list(`whiteboardMarkings/${whiteboardKey}/${markingKey}/edits`)
					.push({
						edited: firebase.database['ServerValue']['TIMESTAMP'],
						edits
					});

			});

	}

	eraseMarking(whiteboardKey: string, markingKey: string): Observable<WhiteboardMarking> {
		return this.observableToPromise(
			this.af.database.object(`whiteboardMarkings/${whiteboardKey}/${markingKey}`)
				.update({ erased: firebase.database['ServerValue']['TIMESTAMP'] }));
	}

	/**
	 * Whiteboard Text
	 */

	getTexts(whiteboardKey: string): FirebaseListObservable<WhiteboardText[]> {
		return this.af.database.list(`whiteboardText/${whiteboardKey}`);
	}

	createText(key: string, options: WhiteboardTextOptions): Observable<WhiteboardText> {
		const text: WhiteboardText = {
			created: firebase.database['ServerValue']['TIMESTAMP'],
			createdBy: this.authInfo ? this.authInfo.uid : null,
			style: styles.serializeOptions(options.style),
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
			this.af.database.object(`whiteboardText/${whiteboardKey}/${textKey}`)
				.update({ erased: firebase.database['ServerValue']['TIMESTAMP'] }));
	}

	/**
	 * Snapshot
	 */

	storeSnapshot(whiteboardKey: string, snapshot: Blob | File): Observable<any> {
		// Upload file
		return this.observableToPromise(this.sdkStorage.child(`wbSnapShots/${whiteboardKey}`).put(snapshot))
			.map((snap: any) => {
				// Store 'snapshot' property in the whiteboard object
				return this.af.database.object(`whiteboards/${whiteboardKey}`).update({ snapshot: snap.metadata.downloadURLs[0] });
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
