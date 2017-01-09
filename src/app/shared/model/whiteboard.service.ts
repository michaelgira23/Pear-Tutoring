import { Injectable, Inject } from '@angular/core';
import * as firebase from 'firebase';
import { AngularFire, FirebaseAuthState, FirebaseListObservable, FirebaseObjectObservable, FirebaseRef } from 'angularfire2';
import { Observable, Subject } from 'rxjs/Rx';
import _ from 'lodash';
import deepAssign from 'deep-assign';

import { AuthService } from '../security/auth.service';
import { styles, colors } from '../../whiteboard/utils/serialization';
import { removeRedundant } from '../../whiteboard/utils/diff';
import { Whiteboard, WhiteboardOptions,
	WhiteboardMarking, WhiteboardMarkingOptions,
	WhiteboardText, WhiteboardTextOptions,
	WhiteboardImage,
	StyleOptions,
	Font } from './whiteboard';

// Declare the `Array.prototype.includes` because we use a Polyfill
declare global {
	interface Array<T> {
		includes(searchElement: T): boolean;
	}
}

const editableWhiteboardProperties = [
	'name',
	'background'
];

const editableMarkingProperties = [
	'style',
	'path'
];

const editableTextProperties = [
	'style',
	'rotation',
	'bounds',
	'content',
	'font'
];

const editableImageProperties = [
	'rotation',
	'bounds'
];

const fixedLengthProperties = [
	'style',
	'bounds',
	'font'
];

type Item = Whiteboard | WhiteboardMarking | WhiteboardText | WhiteboardImage;
type ItemType = 'whiteboard' | 'marking' | 'text' | 'image';

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

	// Map different whiteboard items to their methods and nodes in the db
	typeToThings: { [type: string]: any } = {
		whiteboard: {
			editableProperties: editableWhiteboardProperties,
			getFormatted: this.getFormattedWhiteboard.bind(this),
			node: 'whiteboards',
			editsInRootNode: true
		},
		marking: {
			editableProperties: editableMarkingProperties,
			getFormatted: this.getFormattedMarking.bind(this),
			node: 'whiteboardMarkings',
			editsInRootNode: false
		},
		text: {
			editableProperties: editableTextProperties,
			getFormatted: this.getFormattedText.bind(this),
			node: 'whiteboardText',
			editsInRootNode: false
		},
		image: {
			editableProperties: editableImageProperties,
			getFormatted: this.getFormattedImage.bind(this),
			node: 'whiteboardImages',
			editsInRootNode: false
		}
	};

	authInfo: FirebaseAuthState;
	whiteboards: FirebaseListObservable<Whiteboard[]>;
	sdkDb: any;
	sdkStorage: any;

	constructor(
		private af: AngularFire,
		@Inject(FirebaseRef) fb,
		private authService: AuthService
	) {
		this.sdkDb = fb.database().ref();
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

	getFormattedWhiteboard(whiteboardKey: string): Observable<Whiteboard> {
		return <Observable<Whiteboard>>this.getWhiteboard(whiteboardKey)
			.map(whiteboard => this.currentItem('whiteboard', whiteboard));
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

	editWhiteboard(whiteboardKey: string, options: any): Observable<Whiteboard> {
		return this.editItem(whiteboardKey, 'whiteboard', whiteboardKey, options);
	}

	/**
	 * Whiteboard Markings
	 */

	getMarkings(whiteboardKey: string): FirebaseListObservable<WhiteboardMarking[]> {
		return this.af.database.list(`whiteboardMarkings/${whiteboardKey}`);
	}

	getFormattedMarkings(whiteboardKey: string): Observable<WhiteboardMarking[]> {
		return this.getMarkings(whiteboardKey)
			.map(markings => {
				return <WhiteboardMarking[]>markings.map(marking => this.currentItem('marking', marking));
			});
	}

	getMarking(whiteboardKey: string, markingKey: string): FirebaseObjectObservable<WhiteboardMarking> {
		return this.af.database.object(`whiteboardMarkings/${whiteboardKey}/${markingKey}`);
	}

	getFormattedMarking(whiteboardKey: string, markingKey: string): Observable<WhiteboardMarking> {
		return <Observable<WhiteboardMarking>>this.getMarking(whiteboardKey, markingKey)
			.map(marking => this.currentItem('marking', marking));
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

	editMarking(whiteboardKey: string, markingKey: string, options: any): Observable<WhiteboardMarking> {
		return this.editItem(whiteboardKey, 'marking', markingKey, options);
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

	getFormattedTexts(whiteboardKey: string): Observable<WhiteboardText[]> {
		return this.getTexts(whiteboardKey)
			.map(texts => {
				return <WhiteboardText[]>texts.map(text => this.currentItem('text', text));
			});
	}

	getText(whiteboardKey: string, textKey: string): FirebaseObjectObservable<WhiteboardText> {
		return this.af.database.object(`whiteboardText/${whiteboardKey}/${textKey}`);
	}

	getFormattedText(whiteboardKey: string, textKey: string): Observable<WhiteboardText> {
		return <Observable<WhiteboardText>>this.getText(whiteboardKey, textKey)
			.map(text => this.currentItem('text', text));
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

	editText(whiteboardKey: string, textKey: string, options: any): Observable<WhiteboardText> {
		return this.editItem(whiteboardKey, 'text', textKey, options);
	}

	eraseText(whiteboardKey: string, textKey: string): Observable<WhiteboardText> {
		return this.observableToPromise(
			this.af.database.object(`whiteboardText/${whiteboardKey}/${textKey}`)
				.update({ erased: firebase.database['ServerValue']['TIMESTAMP'] }));
	}

	/**
	 * File upload
	 */

	getImages(whiteboardKey: string): FirebaseListObservable<WhiteboardImage[]> {
		return this.af.database.list(`whiteboardImages/${whiteboardKey}`);
	}

	getFormattedImages(whiteboardKey: string): Observable<WhiteboardImage[]> {
		return this.getImages(whiteboardKey)
			.map(images => {
				return <WhiteboardImage[]>images.map(image => this.currentItem('image', image));
			});
	}

	getImage(whiteboardKey: string, imageKey: string): FirebaseObjectObservable<WhiteboardImage> {
		return this.af.database.object(`whiteboardImages/${whiteboardKey}/${imageKey}`);
	}

	getFormattedImage(whiteboardKey: string, imageKey: string): Observable<WhiteboardImage> {
		return <Observable<WhiteboardImage>>this.getImage(whiteboardKey, imageKey)
			.map(image => this.currentItem('image', image));
	}

	uploadImage(whiteboardKey: string, file: File): Observable<any> {
		const subject = new Subject<any>();
		const pushKey = this.sdkDb.push().key;

		// Initialize file reader
		const reader = new FileReader();
		reader.readAsDataURL(file);

		reader.onload = () => {

			// Read image to get dimensions
			const image = new Image();
			image.src = reader.result;

			image.onload = () => {
				// Upload file
				this.observableToPromise(this.sdkStorage.child(`whiteboardFiles/${whiteboardKey}/${pushKey}`).put(file))
					.subscribe((uploadedImage: any) => {
						// Add image object to the whiteboard
						// return this.af.database.object(`whiteboards/${whiteboardKey}`).update({ snapshot: uploadedImage.metadata.downloadURLs[0] });
						console.log('uplaod image', uploadedImage);
						const whiteboardImage: WhiteboardImage = {
							created: firebase.database['ServerValue']['TIMESTAMP'],
							createdBy: this.authInfo ? this.authInfo.uid : null,
							rotation: 0,
							bounds: {
								x: 10,
								y: 10,
								width: image.width,
								height: image.height
							},
							name: file.name,
							url: uploadedImage.metadata.downloadURLs[0]
						};

						const whiteboardImages = this.af.database.object(`whiteboardImages/${whiteboardKey}/${pushKey}`);
						this.observableToPromise(whiteboardImages.set(whiteboardImage))
							.subscribe(
								data => {
									subject.next(data);
									subject.complete();
								},
								err => {
									subject.error(err);
									subject.complete();
								}
							);
					});
			};
		};

		return subject.asObservable();
	}

	editImage(whiteboardKey: string, imageKey: string, options: any): Observable<WhiteboardImage> {
		return this.editItem(whiteboardKey, 'image', imageKey, options);
	}

	eraseImage(whiteboardKey: string, imageKey: string): Observable<WhiteboardImage> {
		return this.observableToPromise(
			this.af.database.object(`whiteboardText/${whiteboardKey}/${imageKey}`)
				.update({ erased: firebase.database['ServerValue']['TIMESTAMP'] }));
	}

	/**
	 * Edit Items
	 */

	// Compiles the edits in a item object to the most up-to-date properties of the total item
	private currentItem(itemType: ItemType, item: Item): Item {

		// If item doesn't exist, return null
		if (!item.$exists()) {
			return null;
		}

		// If no edits, then initial values are the most up-to-date
		if (typeof item.edits !== 'object') {
			// Delete item edits property just in case it was something dumb like a boolean
			// Yeah. Booleans are pretty dumb.
			delete item.edits;
			return item;
		}

		// Convert edits to arrays. We don't care about push keys.
		let edits = [];
		const editKeys = Object.keys(item.edits);
		editKeys.forEach(editKey => {
			edits.push(item.edits[editKey]);
		});

		// Sort edits in chronological order
		edits.sort((a, b) => {
			return a.edited - b.edited;
		});

		// Go through edit timestamps and update respective values
		edits.forEach(edit => {
			// Go through edit properties and make sure they're editable
			const editProperties = Object.keys(edit.edits);
			for (let i = 0; i < editProperties.length; i++) {
				const editProperty = editProperties[i];

				// If property isn't editable, ignore
				if (!this.typeToThings[itemType].editableProperties.includes(editProperty)) {
					continue;
				}

				// New value to edit in the item object
				let newValue = edit.edits[editProperty];

				// If editting style, merge with the current styles
				if (fixedLengthProperties.includes(editProperty)) {
					// Merge new edits with current object
					newValue = deepAssign(item[editProperty], newValue);
				}

				// Edit value
				item[editProperty] = newValue;
			}
		});

		// Delete edits and return
		delete item.edits;
		return item;
	}

	private editItem(whiteboardKey: string, itemType: ItemType, itemKey: string, options: any): Observable<any> {
		// Get current marking
		return this.typeToThings[itemType].getFormatted(whiteboardKey, itemKey)
			.first()
			.map(item => {

				if (!item) {
					return;
				}

				let edits = {};
				// Go through options and make sure they're editable
				const editProperties = Object.keys(options);
				for (let i = 0; i < editProperties.length; i++) {
					const editProperty = editProperties[i];

					// If property isn't editable, ignore
					if (!this.typeToThings[itemType].editableProperties.includes(editProperty)) {
						continue;
					}

					let newValue = null;

					// If new edit properties aren't the same as existing properties, add
					if (!_.isEqual(options[editProperty], item[editProperty])) {
						// Totally reassign properties, unless it's style
						// We can get rid of redundant styles because style objects have a fixed length
						if (fixedLengthProperties.includes(editProperty)) {
							newValue = removeRedundant(item[editProperty], options[editProperty]);
						} else {
							newValue = options[editProperty];
						}
					}

					// If newValue doesn't equal null, then let's edit the property!
					if (newValue !== null) {
						edits[editProperty] = newValue;
					}
				}

				if (_.isEmpty(edits)) {
					return Observable.of(null);
				}

				let pathURL = null;
				if (this.typeToThings[itemType].editsInRootNode) {
					pathURL = `${this.typeToThings[itemType].node}/${whiteboardKey}/edits`;
				} else {
					pathURL = `${this.typeToThings[itemType].node}/${whiteboardKey}/${itemKey}/edits`;
				}

				const pushKey = this.sdkDb.push().key;

				return this.af.database.object(`${pathURL}/${pushKey}`)
					.update({
						edited: firebase.database['ServerValue']['TIMESTAMP'],
						edits
					});

			});

	}

	/**
	 * Snapshot
	 */

	storeSnapshot(whiteboardKey: string, snapshot: Blob | File): Observable<any> {
		// Upload file
		return this.observableToPromise(this.sdkStorage.child(`wbSnapShots/${whiteboardKey}`).put(snapshot))
			.switchMap((snap: any) => {
				// Store 'snapshot' property in the whiteboard object
				return this.observableToPromise(
					this.af.database.object(`whiteboards/${whiteboardKey}`)
						.update({ snapshot: snap.metadata.downloadURLs[0] })
				);
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
