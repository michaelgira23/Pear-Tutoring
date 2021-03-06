import { Component, Input, OnInit, OnChanges, SimpleChanges, OnDestroy, ViewChild, HostListener } from '@angular/core';
import { segments, rectangles, styles, font, colors } from './utils/serialization';
import { Whiteboard, WhiteboardMarking, WhiteboardShapeType, WhiteboardText, WhiteboardImage, Color } from '../shared/model/whiteboard';
import { WhiteboardService, defaultStyleOptions, defaultFontOptions } from '../shared/model/whiteboard.service';
import { PermissionsService } from '../shared/security/permissions.service';

// Whiteboard tools
import { Cursor } from './tools/cursor';
import { Pen } from './tools/pen';
import { Eraser } from './tools/eraser';
import { Text } from './tools/text';
import { Shape } from './tools/shape';

declare const paper;

@Component({
	selector: 'app-whiteboard',
	templateUrl: './whiteboard.component.html',
	styleUrls: ['./whiteboard.component.scss']
})
export class WhiteboardComponent implements OnInit, OnChanges, OnDestroy {

	/**
	 * General variables for everything
	 */

	// Key of whiteboard
	@Input()
	key: string;
	// Whether or not whiteboard with key exists
	validKey: boolean = true;

	// Whiteboard <canvas>
	@ViewChild('whiteboard') canvas;
	// Actual canvas DOM reference
	canvasEl: HTMLCanvasElement;

	/**
	 * Model variables
	 */

	// Whiteboard subscription
	whiteboardSubscription: any;
	// Latest value of whiteboard object from database
	whiteboard: Whiteboard;
	whiteboardName: string;

	// Future permissions subscription
	permissionsSubscription: any;
	// Scopes of permissions
	private _permissions: any = {};

	// Whether or not user can make changes to whiteboard.
	// While behavior is the same for permissions.write, this is controlled by client ans is for display purposes only.
	// It is independent of whether the user actually has read/write permissions.
	@Input()
	get allowWrite() {
		return this._allowWrite;
	}
	set allowWrite(value) {
		// Save old permissions first
		const oldPermissions = {
			read: this.shouldRead,
			write: this.shouldWrite
		};
		this._allowWrite = value;
		this.triggerToolEvent(this.tool, 'changepermissions', oldPermissions);
	}

	private _allowWrite: boolean = false;

	// Hook shouldRead directly to read permissions
	get shouldRead() {
		return this._permissions.read;
	}

	// Only write to the whiteboard if 1) User has permissions and 2) Components want user to write
	get shouldWrite() {
		return this._permissions.write && this.allowWrite;
	}

	// Markings subscription
	markingsSubscription: any;
	// Serialized markings returned from database
	markings: WhiteboardMarking[];
	// paper.js paths on the whiteboard canvas
	canvasMarkings: any = {};

	// Text subscription
	textSubscription: any;
	// Serialized text returned from database
	text: WhiteboardText[];
	// paper.js point text objects on the whiteboard
	canvasText: any = {};

	// Image subscription
	imagesSubscription: any;
	// Serialized images returned from database
	images: WhiteboardImage[];
	// paper.js rasters on the whiteboard canvas
	canvasImages: any = {};

	/**
	 * Snapshot variables
	 */

	// Whether or not taking a snapshot
	takingSnapshot: boolean = false;
	snapshotDimensions = {
		width: 250,
		height: 125
	};

	/**
	 * Miscellaneous variables
	 */

	// Rectangle path on canvas to set background
	background: any;

	// Whether anything is selected
	anythingSelected: boolean;
	// Whether a marking is selected
	markingSelected: boolean;
	// Whether text is selected
	textSelected: boolean;

	/**
	 * Tool variables
	 */

	// For detecting if certain keys are pressed
	mouseDown: boolean = false;
	ctrlKey: boolean = false;
	metaKey: boolean = false;
	shiftKey: boolean = false;

	// What tool is selected in the whiteboard toolbar
	tool: string = 'cursor';

	// For mapping of cursor for tools
	toolCursor: any = {
		pen: {
			url: 'assets/whiteboard-cursors/pen.png',
			offset: {
				x: 0,
				y: 20
			}
		},
		eraser: {
			url: 'assets/whiteboard-cursors/eraser.png',
			offset: {
				x: 0,
				y: 20
			}
		},
		text: {
			url: 'assets/whiteboard-cursors/text.png',
			offset: {
				x: 0,
				y: 20
			}
		},
		shape: {
			url: 'assets/whiteboard-cursors/shape.png',
			offset: {
				x: 0,
				y: 20
			}
		}
	};

	// Options when creating things
	styleOptions = defaultStyleOptions;
	fontOptions = defaultFontOptions;

	// Shape tool
	shapeType: WhiteboardShapeType = 'polygon';
	polygonSides: any = 4;
	starPoints: any = 5;
	starRadiusPercentage: any = 50;

	// Image upload
	draggingFile: boolean = false;

	// Tools
	tools = {
		cursor: new Cursor(this),
		pen   : new Pen(this),
		eraser: new Eraser(this),
		text  : new Text(this),
		shape : new Shape(this)
	};

	constructor(private permissionsService: PermissionsService, public whiteboardService: WhiteboardService) {
		// Attach custom setters on options
		// When options change, update options on all selected items
		const styleOptionsKeys = Object.keys(this.styleOptions);
		styleOptionsKeys.forEach(styleKey => {
			this.styleOptions[styleKey] = new Proxy(this.styleOptions[styleKey], {
				set: (obj, prop, value) => {
					// Check that value is actually changing
					if (this.styleOptions[styleKey][prop] === value) {
						return;
					}
					// console.log('edit style options', styleKey, prop, value);

					// Set like normal
					obj[prop] = value;

					this.getSelectedMarkings().concat(this.getSelectedText()).forEach(item => {
						// Serialize styles
						let serializedStyles = styles.serialize(item);
						// Replace new changed style
						serializedStyles[styleKey][prop] = value;
						// Re-deserialize styles with this new changed style
						const newStyles = styles.deserialize(serializedStyles);

						Object.assign(item, newStyles);
					});

					return true;
				}
			});
		});

		// We can attach the proxy onto the root of fontOptions because, unlike the style options, fontOptions is only one layer deep.
		this.fontOptions = new Proxy(this.fontOptions, {
			set: (obj, prop, value) => {
				// Check that value is actually changing
				if (this.fontOptions[prop] === value) {
					return;
				}
				// console.log('edit font options', prop, value);

				// Set like normal
				obj[prop] = value;

				this.getSelectedText().forEach(item => {
					// Serialize font
					let serializedFont = font.serialize(item);
					// Replace new font property
					serializedFont[prop] = value;
					// Re-deserialize font with this new changed property
					const newFont = font.deserialize(serializedFont);

					Object.assign(item, newFont);
				});

				return true;
			}
		});
	}

	/**
	 * Angular Lifecycle Hooks
	 */

	ngOnInit() {
		// Get canvas DOM reference
		this.canvasEl = this.canvas.nativeElement;
		// Setup Canvas with paper.js
		paper.setup(this.canvasEl);

		// Set background if it exists
		if (this.whiteboard) {
			this.setBackgroundColor(this.whiteboard.background);
		}
	}

	ngOnChanges(changes: SimpleChanges) {
		// Check if the key has changed
		if (changes['key'] && changes['key'].currentValue !== changes['key'].previousValue) {

			// Take a snapshot we're switching from a previous whiteboard
			if (this.whiteboard && this.validKey) {
				this.takeSnapshot(changes['key'].previousValue);
			}

			// If we are changing the key, clean up any previous observables
			this.cleanUp();

			// Change whiteboard key
			this.tuneWhiteboard(this.key);

		}
	}

	ngOnDestroy() {
		// Take a screenshot if valid key
		if (this.whiteboard && this.validKey) {
			this.takeSnapshot();
		}
		this.cleanUp();
	}

	/**
	 * For triggering the neat little custom event system for each tool
	 *
	 * List of custom events:
	 * - mousedown - When any mouse button is pressed (regular mousedown behavior)
	 * - mousemove - When the mouse is moved (regular mousemove behavior)
	 * - mouseup - When the mouse is unpressed (regular mouseup behavior)
	 * - keyup - When any key on the keyboard is unpressed (regular keyup behavior)
	 * - changetool - Triggered when a tool is deselected
	 * - selecttool - Triggered when a tool is selected
	 * - changepermissions - Triggered when permissions change
	 */

	triggerToolEvent(tool: string, eventName: string, ...data: any[]) {
		// Trigger possible event handler in specified tool
		if (this.tools[tool] && typeof this.tools[tool][eventName] === 'function') {
			this.tools[tool][eventName].apply(this.tools[tool], data);
		}
		// Trigger possible event handler in this component
		if (this[eventName]) {
			this[eventName].apply(this, data);
		}
	}

	/**
	 * Custom event handlers
	 * (put all events to prevent naming conflicts)
	 */

	mousedown        () {}
	mousemove        () {}
	mouseup          () {}
	keyup            () {}
	changetool       () {}
	selecttool       () {}
	changepermissions(oldPermissions) {

		// Check if permissions changed
		const readChanged = this.shouldRead !== oldPermissions.read;
		const writeChanged = this.shouldWrite !== oldPermissions.write;

		// console.log(`new permissions read: ${this.shouldRead}, write: ${this.shouldWrite}`);

		if (readChanged) {
			if (this.shouldRead) {
				// Initialize whiteboard with key
				this.tuneWhiteboard(this.key);
			} else {
				// Clear canvas
				// clearCanva() must come before cleanUp() because otherwise we wouldn't know what stuff to delete
				this.clearCanvas();
				this.cleanUp();
			}
		}

		if (writeChanged && !this.shouldWrite) {
			// If we don't have write permissions, hide toolbar and select cursor tool
			this.changeTool('cursor');
		}
	}

	/**
	 * Trigger Event Handlers
	 */

	onMouseDown(event) {
		this.mouseDown = true;
		this.triggerToolEvent(this.tool, 'mousedown', event);
	}

	onMouseMove(event) {
		this.triggerToolEvent(this.tool, 'mousemove', event);
	}

	onMouseUp(event) {
		this.mouseDown = false;
		this.triggerToolEvent(this.tool, 'mouseup', event);
	}

	onDrag(event) {
		event.preventDefault();
		event.stopPropagation();
	}

	onDragOn(event) {
		this.draggingFile = true;
	}

	onDragOff(event) {
		this.draggingFile = false;
	}

	onDrop(event) {
		const point = this.cursorPoint(event);
		if (event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0]) {
			const uploadFile = event.dataTransfer.files[0];
			// console.log('file', uploadFile);
			this.whiteboardService.uploadImage(this.key, uploadFile, point.x, point.y)
				.subscribe(
					data => {
						// console.log('successfully uploaded image', data);
					},
					err => {
						console.log('error uploading image', err);
					}
				);
		}
	}

	// When the window resizes, reset the background
	@HostListener('window:resize', ['$event'])
	onResize(event) {
		this.setBackgroundColor(this.whiteboard.background);
	}

	@HostListener('window:keydown', ['$event'])
	onKeydown(event: KeyboardEvent) {
		this.mapKeys(event);
		if (event.keyCode === 90 && event.ctrlKey) {
			window.alert('Undo');
			let newMarks = [];
			for (let i = 0; i < (this.markings.length - 1); ++i) {
				newMarks[i] = this.markings[i];
			}
			this.markingsToCanvas(newMarks);
		}
	}

	@HostListener('window:keyup', ['$event'])
	onKeyup(event: KeyboardEvent) {
		this.mapKeys(event);
	}

	mapKeys(event: KeyboardEvent) {
		this.ctrlKey = event.ctrlKey;
		this.metaKey = event.metaKey;
		this.shiftKey = event.shiftKey;
		this.triggerToolEvent(this.tool, 'keyup', event);
	}

	/**
	 * General functions
	 */

	paperIdToSerializedObject(id): any {
		// Return corresponding serialized database object from paper id
		const markingKey = this.markingIdToPushKey(id);
		const textKey = this.textIdToPushKey(id);
		const imageKey = this.imageIdToPushKey(id);

		if (markingKey) {
			for (let i = 0; i < this.markings.length; i++) {
				if (this.markings[i].$key === markingKey) {
					return this.markings[i];
				}
			}
		} else if (textKey) {
			for (let i = 0; i < this.text.length; i++) {
				if (this.text[i].$key === textKey) {
					return this.text[i];
				}
			}
		} else if (imageKey) {
			for (let i = 0; i < this.images.length; i++) {
				if (this.images[i].$key === imageKey) {
					return this.images[i];
				}
			}
		}

		return null;
	}

	cursorPoint(event) {
		// Return a paper.js point where the mouse is at relative to the canvas
		const canvasPos = this.canvasEl.getBoundingClientRect();
		const cursorX = (event.clientX - canvasPos.left);
		const cursorY = (event.clientY - canvasPos.top);

		return new paper.Point(cursorX, cursorY);
	}

	cleanUp() {
		// Clean up observables and stuff when component should be reset/destroyed
		if (this.whiteboardSubscription) {
			this.whiteboardSubscription.unsubscribe();
			this.whiteboardSubscription = null;
		}
		this.whiteboard = null;
		this.whiteboardName = null;

		if (this.markingsSubscription) {
			this.markingsSubscription.unsubscribe();
			this.markingsSubscription = null;
		}
		this.markings = [];
		this.canvasMarkings = {};

		if (this.textSubscription) {
			this.textSubscription.unsubscribe();
			this.textSubscription = null;
		}
		this.text = [];
		this.canvasText = {};
	}

	clearCanvas() {
		// console.log('clera acnaas');
		this.setBackgroundColor('#fff');
		this.clearCurrentMarkings();
		this.clearMarkings();
		this.clearCurrentText();
		this.clearText();

		// Fallback to just manually deleting everything
		this.getAllItems().forEach(item => item.remove());
	}

	/**
	 * Whiteboard functions
	 */

	// Listen whiteboard key in database
	tuneWhiteboard(key: string) {
		// console.log('tune whiteboard');
		// Unsubscribe from current subscriptions just in case
		this.cleanUp();

		// Check if we have read permissions or if there's even a valid key
		if (!this.key) {
			// console.log('actually don\'t tune whiteboard');
			return;
		}

		// Subscribe to whiteboard metadata
		this.whiteboardSubscription = this.whiteboardService.getFormattedWhiteboard(this.key).subscribe(
			whiteboard => {
				// Check if whiteboard exists
				if (whiteboard && whiteboard.$exists()) {
					this.validKey = true;
					this.allowWrite = true;
				} else {
					this.clearCanvas();
					this.validKey = false;
					this.allowWrite = false;
					return;
				}

				this.whiteboard = whiteboard;
				this.whiteboardName = this.whiteboard.name;

				// Only update background if whiteboard canvas is initialized
				if (this.canvasEl) {
					this.setBackgroundColor(this.whiteboard.background);
				}

				// Subscribe to permissions
				this.permissionsSubscription = this.permissionsService.getUserPermission(this.key, 'whiteboard')
					.subscribe(
						permissions => {
							// console.log(this.key);
							// Save old permissions first
							const oldPermissions = {
								read: this.shouldRead,
								write: this.shouldWrite
							};
							this._permissions = permissions;
							this.triggerToolEvent(this.tool, 'changepermissions', oldPermissions);
						},
						err => {
							console.log('get whiteboard permissions error!', err);
						}
					);

				// Subscribe to markings on whiteboard
				this.markingsSubscription = this.whiteboardService.getFormattedMarkings(this.key)
					.subscribe(
						markings => {
							this.markings = markings;

							// Only update markings if whiteboard canvas is initialized
							if (this.canvasEl) {
								this.markingsToCanvas(this.markings);
							}
						},
						err => {
							console.log('whiteboard markings error!', err);
						}
					);

				// Subscribe to text on whiteboard
				this.textSubscription = this.whiteboardService.getFormattedTexts(this.key)
					.subscribe(
						text => {
							this.text = text;

							// Only update text if whiteboard canvas is initialized
							if (this.canvasEl) {
								this.textsToCanvas(this.text);
							}
						},
						err => {
							console.log('whiteboard text error!', err);
						}
					);

				// Subscribe to images on whiteboard
				this.imagesSubscription = this.whiteboardService.getFormattedImages(this.key)
					.subscribe(
						images => {
							this.images = images;

							// Only update images if whiteboard canvas is initialized
							if (this.canvasEl) {
								this.imagesToCanvas(this.images);
							}
						}
					);
			},
			err => {
				console.log('create whiteboard error!', err);
			}
		);
	}

	changeTool(newTool: string) {
		// Trigger change event for previous tool
		this.triggerToolEvent(this.tool, 'changetool', newTool);
		// Trigger change event for the next tool
		this.triggerToolEvent(newTool, 'selecttool', this.tool);

		this.tool = newTool;
	}

	changeWhiteboardName(name: string) {
		if (this.shouldWrite) {
			this.whiteboardService.editWhiteboard(this.key, { name })
				.subscribe(
					data => {
						// console.log('successfully changed whiteboard name!', data);
					},
					err => {
						console.log('error while changing whiteboard name', err);
					}
				);
		}
	}

	/**
	 * Background functions
	 */

	setBackgroundColor(color: Color | string) {
		// If there is currently a background, remove it
		if (this.background) {
			this.background.remove();
		}

		// Create new points for the background
		const topLeft = new paper.Point(0, 0);
		const bottomRight = new paper.Point(this.canvasEl.width, this.canvasEl.height);

		// Create a new rectangle that spans the whole canvas
		this.background = new paper.Shape.Rectangle(topLeft, bottomRight);

		// Send the canvas to the back
		this.background.sendToBack();
		this.background.fillColor = colors.deserialize(color);
	}

	/**
	 * Marking functions
	 */

	markingsToCanvas(markings: WhiteboardMarking[]) {
		this.clearCurrentMarkings();

		// If no read permissions, simply clear at leave it at that
		if (!this.shouldRead) {
			return;
		}

		// Keep track of which markings we deal with
		let newMarkingKeys = [];

		// Loop through markings and add to canvas
		for (let i = 0; i < markings.length; i++) {
			const marking = markings[i];
			newMarkingKeys.push(marking.$key);

			// Get options for current marking
			let paperOptions = styles.deserialize(marking.style);
			paperOptions.segments = segments.deserialize(marking.path);

			// Check if marking already exists on whiteboard
			if (this.canvasMarkings[marking.$key]) {
				// Marking already exists on whiteboard

				// Check if marking should be erased
				if (marking.erased) {
					this.canvasMarkings[marking.$key].remove();
					delete this.canvasMarkings[marking.$key];
					continue;
				}

				// Update options onto existing marking on canvas
				Object.assign(this.canvasMarkings[marking.$key], paperOptions);
			} else if (!marking.erased) {
				// Create new marking on whiteboard
				this.canvasMarkings[marking.$key] = new paper.Path(paperOptions);
			}
		}

		// Now let's delete all markings that are still on canvas, but we haven't recieved from markings parameter
		const canvasMarkingKeys = Object.keys(this.canvasMarkings);
		canvasMarkingKeys.forEach(key => {
			// If key isn't in the markings we've dealt with, delete
			if (!newMarkingKeys.includes(key)) {
				this.canvasMarkings[key].remove();
				delete this.canvasMarkings[key];
			}
		});
	}

	clearMarkings() {
		// Erase current canvas markings if they exist
		if (this.canvasMarkings) {
			const markingKeys = Object.keys(this.canvasMarkings);
			markingKeys.forEach(key => {
				this.canvasMarkings[key].remove();
				delete this.canvasMarkings[key];
			});
		}
	}

	clearCurrentMarkings() {
		// Erase current path in pen tool if it isn't in the proccess of being drawn
		if (this.tools.pen.currentPath && this.tools.pen.currentPathFinished) {
			this.tools.pen.currentPath.remove();
			this.tools.pen.currentPath = null;
		}

		// Erase current shape in shape tool if it isn't in the proccess of being drawn
		if (this.tools.shape.currentShape && this.tools.shape.currentShapeFinished) {
			this.tools.shape.currentShape.remove();
			this.tools.shape.currentShape = null;
		}
	}

	markingIdToPushKey(id) {
		const markingKeys = Object.keys(this.canvasMarkings);
		for (let i = 0; i < markingKeys.length; i++) {
			const marking = this.canvasMarkings[markingKeys[i]];
			if (marking.id === id) {
				return markingKeys[i];
			}
		}
		return null;
	}

	/**
	 * Text functions
	 */

	textsToCanvas(texts: WhiteboardText[]) {
		this.clearCurrentText();

		// If no read permissions, simply clear at leave it at that
		if (!this.shouldRead) {
			return;
		}

		// Keep track of which texts we deal with
		let newTextKeys = [];

		// Loop through texts and add to canvas
		for (let i = 0; i < texts.length; i++) {
			const text = texts[i];
			newTextKeys.push(text.$key);

			// Get options for current text
			let paperOptions = styles.deserialize(text.style);
			paperOptions.point = [0, 0];
			paperOptions.rotation = text.rotation;
			paperOptions.content = text.content;

			// Combine paperOptions and fontOptions
			const fontOptions = font.deserialize(text.font);
			paperOptions = Object.assign(paperOptions, fontOptions);

			// Check if text already exists on whiteboard
			if (this.canvasText[text.$key]) {
				// Marking already exists on whiteboard

				// Check if text should be erased
				if (text.erased) {
					this.canvasText[text.$key].remove();
					delete this.canvasText[text.$key];
					continue;
				}

				// Update options onto existing text on canvas
				Object.assign(this.canvasText[text.$key], paperOptions);
				// Set bounds here because it doesn't work in object init for some reason
				this.canvasText[text.$key].bounds = rectangles.deserialize(text.bounds);
			} else if (!text.erased) {
				// Create new text on whiteboard
				this.canvasText[text.$key] = new paper.PointText(paperOptions);
				// Set bounds here because it doesn't work in object init for some reason
				this.canvasText[text.$key].bounds = rectangles.deserialize(text.bounds);
			}
		}

		// Now let's delete all markings that are still on canvas, but we haven't recieved from markings parameter
		const canvasTextKeys = Object.keys(this.canvasText);
		canvasTextKeys.forEach(key => {
			// If key isn't in the markings we've dealt with, delete
			if (!newTextKeys.includes(key)) {
				this.canvasText[key].remove();
				delete this.canvasText[key];
			}
		});
	}

	clearText() {
		// Erase current canvas markings if they exist
		if (this.canvasText) {
			const textKeys = Object.keys(this.canvasText);
			textKeys.forEach(key => {
				this.canvasText[key].remove();
				delete this.canvasText[key];
			});
		}
	}

	clearCurrentText() {
		// Erase current text too if it isn't in the process of being created
		// console.log('clear current text');
		if (this.tools.text.currentText && this.tools.text.currentTextFinished) {
			// If we are editing current text, that means it's already on whiteboard and already registered in database.
			// We should not remove then.
			if (!this.tools.text.editingCurrentText) {
				this.tools.text.currentText.remove();
			}
			this.tools.text.currentText = null;
		}
	}

	textIdToPushKey(id) {
		const textKeys = Object.keys(this.canvasText);
		for (let i = 0; i < textKeys.length; i++) {
			const text = this.canvasText[textKeys[i]];
			if (text.id === id) {
				return textKeys[i];
			}
		}
		return null;
	}

	/**
	 * Image functions
	 */

	imagesToCanvas(images: WhiteboardImage[]) {

		// If no read permissions, simply clear at leave it at that
		if (!this.shouldRead) {
			return;
		}

		// Keep track of which images we deal with
		let newImageKeys = [];

		// Loop through images and add to canvas
		for (let i = 0; i < images.length; i++) {
			const image = images[i];
			newImageKeys.push(image.$key);

			// Get options for current image
			let paperOptions = {
				crossOrigin: 'anonymous',
				rotation: image.rotation,
				source: image.url
			};

			// Check if image already exists on whiteboard
			if (this.canvasImages[image.$key]) {
				// Marking already exists on whiteboard

				// Check if image should be erased
				if (image.erased) {
					this.canvasImages[image.$key].remove();
					delete this.canvasImages[image.$key];
					continue;
				}

				// Update options onto existing image on canvas
				Object.assign(this.canvasImages[image.$key], paperOptions);
				// Set bounds after image loads
				this.canvasImages[image.$key].onLoad = () => {
					if (this.canvasImages[image.$key]) {
						this.canvasImages[image.$key].bounds = rectangles.deserialize(image.bounds);
					}
				};

			} else if (!image.erased) {
				// Create new marking on whiteboard
				this.canvasImages[image.$key] = new paper.Raster(image.url, paperOptions);

				// Set bounds after image loads
				this.canvasImages[image.$key].onLoad = () => {
					if (this.canvasImages[image.$key]) {
						this.canvasImages[image.$key].bounds = rectangles.deserialize(image.bounds);
					}
				};

			}
		}

		// Now let's delete all markings that are still on canvas, but we haven't recieved from markings parameter
		const canvasImageKeys = Object.keys(this.canvasImages);
		canvasImageKeys.forEach(key => {
			// If key isn't in the markings we've dealt with, delete
			if (!newImageKeys.includes(key)) {
				this.canvasImages[key].remove();
				delete this.canvasImages[key];
			}
		});
	}

	clearImages() {
		// Erase current canvas markings if they exist
		if (this.canvasImages) {
			const imageKeys = Object.keys(this.canvasImages);
			imageKeys.forEach(key => {
				this.canvasImages[key].remove();
				delete this.canvasImages[key];
			});
		}
	}

	imageIdToPushKey(id) {
		const imageKeys = Object.keys(this.canvasImages);
		for (let i = 0; i < imageKeys.length; i++) {
			const image = this.canvasImages[imageKeys[i]];
			if (image.id === id) {
				return imageKeys[i];
			}
		}
		return null;
	}

	/**
	 * Selection functions
	 */

	getAllItems(): any[] {
		let blacklistedIds = [paper.project.activeLayer.id];
		if (this.background) {
			blacklistedIds.push(this.background.id);
		}

		return paper.project.getItems({
			match: item => {
				return !blacklistedIds.includes(item.id);
			}
		});
	}

	selectedItems(): any[] {
		return this.getAllItems().filter(item => item.selected);
	}

	deselectAllItems() {
		this.getAllItems().forEach(item => item.selected = false);
	}

	// For updating variables determining what is selected
	updateSelectedValues() {
		this.markingSelected = this.isMarkingSelected();
		this.textSelected = this.isTextSelected();
		this.anythingSelected = this.markingSelected || this.textSelected;
	}

	getSelectedMarkings(): any[] {
		return this.selectedItems().filter(item => this.markingIdToPushKey(item.id));
	}

	isMarkingSelected(): boolean {
		const items = this.selectedItems();
		for (let i = 0; i < items.length; i++) {
			if (this.markingIdToPushKey(items[i].id)) {
				return true;
			}
		}
		return false;
	}

	getSelectedText(): any[] {
		return this.selectedItems().filter(item => this.textIdToPushKey(item.id));
	}

	isTextSelected(): boolean {
		const items = this.selectedItems();
		for (let i = 0; i < items.length; i++) {
			if (this.textIdToPushKey(items[i].id)) {
				return true;
			}
		}
		return false;
	}

	/**
	 * Edit functions
	 */

 	// Triggers on mouseup of toolbar
	onToolbarOptionsChange() {
		// Edit items
		this.editItems(this.selectedItems());
	}

	editItems(items: any[]) {
		// Add items to edit in an array
		let editMarkings = [];
		let editText = [];
		let editImages = [];

		items.forEach(item => {
			// Get key from marking and text
			const markingKey = this.markingIdToPushKey(item.id);
			const textKey = this.textIdToPushKey(item.id);
			const imageKey = this.imageIdToPushKey(item.id);

			if (markingKey) {
				// If marking key exists, it's a marking

				const serializedStyles = styles.serializeOptions(styles.serialize(item));
				const serializedSegments = segments.serialize(item.segments);

				editMarkings.push({
					key: markingKey,
					options: {
						style: serializedStyles,
						path: serializedSegments
					}
				});
			} else if (textKey) {
				// If text key exists, it's text

				const serializedStyles = styles.serializeOptions(styles.serialize(item));
				const serializedBounds = rectangles.serialize(item.bounds);
				const serializedFont = font.serialize(item);

				editText.push({
					key: textKey,
					options: {
						style: serializedStyles,
						rotation: item.rotation,
						bounds: serializedBounds,
						content: item.content,
						font: serializedFont
					}
				});
			} else if (imageKey) {
				// If image key exists, it's an image

				const serializedBounds = rectangles.serialize(item.bounds);

				editImages.push({
					key: imageKey,
					options: {
						rotation: item.rotation,
						bounds: serializedBounds
					}
				});
			} else {
				console.log('unrecognized item to edit!');
			}
		});

		// Add edited properties to database
		// We must do this in a separate step because
		// changing the database would cause paper.js to redraw everything,
		// which would assign all items new ids and mess up everything
		editMarkings.forEach(marking => {
			this.whiteboardService.editMarking(this.key, marking.key, marking.options)
				.subscribe(
					data => {
						// console.log('successfully edited marking!', data);
					},
					err => {
						console.log('error while editing marking!', err);
					}
				);
		});

		editText.forEach(text => {
			this.whiteboardService.editText(this.key, text.key, text.options)
				.subscribe(
					data => {
						// console.log('successfully edited text!', data);
					},
					err => {
						console.log('error while editing text!', err);
					}
				);
		});

		editImages.forEach(image => {
			this.whiteboardService.editImage(this.key, image.key, image.options)
				.subscribe(
					data => {
						// console.log('successfully edited image!', data);
					},
					err => {
						console.log('error while editing image!', err);
					}
				);
		});
	}

	/**
	 * Snapshot functions
	 */

	takeSnapshot(key = this.key) {
		// Make it's a valid whiteboard first
		if (typeof key !== 'string') {
			return;
		}

		// Calculate scale required to make canvas the snapshot dimensions
		const canvasWidth = this.canvasEl.width / paper.project.view.pixelRatio;
		const scaleWidth = this.snapshotDimensions.width / canvasWidth;
		const canvasHeight = this.canvasEl.height / paper.project.view.pixelRatio;
		const scaleHeight = this.snapshotDimensions.height / canvasHeight;

		const originalViewSize = paper.project.view.viewSize;

		// Scale the image down so it doesn't take up as much bandwidth to download
		this.takingSnapshot = true;
		paper.project.view.viewSize = new paper.Size(this.snapshotDimensions.width, this.snapshotDimensions.height);
		paper.project.view.scale(scaleWidth, scaleHeight, new paper.Point(0, 0));

		// Wait for changes to take place
		setTimeout(() => {
			// Save canvas as an image
			let imgBlob = this.canvasEl.toBlob();
			// Revert whiteboard to original size
			paper.project.view.scale(1 / scaleWidth, 1 / scaleHeight, new paper.Point(0, 0));
			paper.project.view.viewSize = originalViewSize;
			this.takingSnapshot = false;

			// Upload image to Firebase
			this.whiteboardService.storeSnapshot(key, imgBlob).subscribe(
				data => {
					// console.log('whiteboard snapshot is saved', data);
				},
				err => {
					console.log('error when saving whiteboard snapshot', err);
				}
			);
		}, 15);
	}

}
