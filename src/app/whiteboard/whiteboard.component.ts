import { Component, Input, OnInit, OnChanges, SimpleChanges, OnDestroy, ViewChild, HostListener } from '@angular/core';
import { segments, rectangles, styles, font, colors } from './utils/serialization';
import { Whiteboard, WhiteboardMarking, WhiteboardText, WhiteboardShapeType, Color } from '../shared/model/whiteboard';
import { WhiteboardService, defaultStyleOptions, defaultFontOptions } from '../shared/model/whiteboard.service';

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

	// Name of the whiteboard
	get wbName(): string {
		if (this.whiteboard) {
			return this.whiteboard.name;
		}
		return '';
	};
	set wbName(name: string) {
		this.wbName = name;
	}

	// Whiteboard <canvas>
	@ViewChild('whiteboard') canvas;
	// Actual canvas DOM reference
	canvasEl: HTMLCanvasElement;

	// Whiteboard subscription
	whiteboardSubscription: any;
	// Latest value of whiteboard object from database
	whiteboard: Whiteboard;

	// Markings subscription
	markingsSubscription: any;
	// Serialized markings returned from database
	markings: WhiteboardMarking[];
	// paper.js canvasMarkings on the whiteboard canvas
	canvasMarkings: any = {};

	// Text subscription
	textSubscription: any;
	// Serialized text returned from database
	text: WhiteboardText[];
	// paper.js point text objects on the whiteboard
	canvasText: any = {};

	// Whether or not taking a snapshot
	takingSnapshot: boolean = false;
	snapshotDimensions = {
		width: 250,
		height: 125
	};

	// Whether or not to show toolbar
	@Input()
	showToolbar: boolean = true;
	// Whether or not user can make changes to whiteboard
	@Input()
	allowWrite: boolean = false;

	// For detecting if certain keys are pressed
	mouseDown: boolean = false;
	ctrlKey: boolean = false;
	metaKey: boolean = false;
	shiftKey: boolean = false;

	/**
	 * Background variables
	 */

	// Rectangle path on canvas to set background
	background: any;
	// If resizing background when triggered by window resize
	resizingBackground: boolean = false;

	/**
	* Selected entities
	*/
	selectedPoints = [];

	/**
	 * Tool variables
	 */

	// What tool is selected in the whiteboard toolbar
	@Input()
	tool: string = 'cursor';

	// Options when creating things
	@Input()
	styleOptions = defaultStyleOptions;
	@Input()
	fontOptions = defaultFontOptions;

	// Shape tool
	@Input()
	shapeType: WhiteboardShapeType = 'polygon';
	@Input()
	polygonSides: any = 4;
	@Input()
	starPoints: any = 5;
	@Input()
	starRadiusPercentage: any = 50;

	// Tools
	tools = {
		cursor: new Cursor(this),
		pen   : new Pen(this),
		eraser: new Eraser(this),
		text  : new Text(this),
		shape : new Shape(this)
	};

	constructor(public whiteboardService: WhiteboardService) { }

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

			// take a snapshot before clean up
			if (this.whiteboard) {
				this.takeSnapshot();
			}

			// If we are changing the key, clean up any previous observables
			this.cleanUp();

			// Subscribe to whiteboard metadata
			this.whiteboardSubscription = this.whiteboardService.getWhiteboard(this.key).subscribe(
				data => {
					// Check if whiteboard exists
					if (data.$exists()) {
						this.validKey = true;
						this.allowWrite = true;
					} else {
						this.cleanUp();
						this.clearCanvas();
						this.validKey = false;
						this.allowWrite = false;
						return;
					}

					this.whiteboard = data;

					// Only update background if whiteboard canvas is initialized
					if (this.canvasEl) {
						this.setBackgroundColor(this.whiteboard.background);
					}
				},
				err => {
					console.log('create whiteboard error!', err);
				}
			);

			// Subscribe to markings on whiteboard
			this.markingsSubscription = this.whiteboardService.getFormattedMarkings(this.key).subscribe(
				data => {
					this.markings = data;

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
			this.textSubscription = this.whiteboardService.getTexts(this.key).subscribe(
				data => {
					this.text = data;

					// Only update text if whiteboard canvas is initialized
					if (this.canvasEl) {
						this.textsToCanvas(this.text);
					}
				}
			);
		}

		// Also check if the tool changed
		if (changes['tool'] && changes['tool'].currentValue !== changes['tool'].previousValue) {
			// Trigger change event for previous tool
			this.triggerToolEvent(changes['tool'].previousValue, 'changetool', changes['tool'].currentValue);
			// Trigger change event for the next tool
			this.triggerToolEvent(changes['tool'].currentValue, 'selecttool', changes['tool'].previousValue);
		}
	}

	ngOnDestroy() {
		this.cleanUp();
		this.takeSnapshot();
	}

	cleanUp() {
		// Clean up observables and stuff when component should be reset/destroyed
		if (this.whiteboardSubscription) {
			this.whiteboardSubscription.unsubscribe();
			this.whiteboardSubscription = null;
		}
		if (this.markingsSubscription) {
			this.markingsSubscription.unsubscribe();
			this.markingsSubscription = null;
		}
		if (this.textSubscription) {
			this.textSubscription.unsubscribe();
			this.textSubscription = null;
		}
	}

	/**
	 * Trigger Event Handlers
	 */

	// For triggering the neat little event system for each tool
	triggerToolEvent(tool: string, eventName: string, event: any) {
		if (this.tools[tool] && typeof this.tools[tool][eventName] === 'function') {
			this.tools[tool][eventName](event);
		}
	}

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
		this.triggerToolEvent(this.tool, 'modifierKey', event);
	}

	changeWbName(name: string): void {
		if (name !== this.wbName) {
			this.whiteboardService.changeName(this.key, name).subscribe(val => {
				console.log('name changed');
			}, console.log);
		}
	}

	/**
	 * General functions
	 */

	cursorPoint(event) {
		// Return a paper.js point where the mouse is at relative to the canvas
		const canvasPos = this.canvasEl.getBoundingClientRect();
		const cursorX = (event.clientX - canvasPos.left);
		const cursorY = (event.clientY - canvasPos.top);

		return new paper.Point(cursorX, cursorY);
	}

	clearCanvas() {
		this.clearMarkings();
		this.clearText();
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

	markingsToCanvas(canvasMarkings: WhiteboardMarking[]) {
		this.clearMarkings();

		// Loop through markings and add to canvas
		canvasMarkings.forEach(marking => {

			// Make sure marking isn't erased
			if (!marking.erased) {
				let paperOptions = styles.deserialize(marking.style);
				paperOptions.segments = segments.deserialize(marking.path);
				this.canvasMarkings[marking.$key] = new paper.Path(paperOptions);
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

	textsToCanvas(canvasText: WhiteboardText[]) {
		this.clearText();

		// Loop through texts and add to canvas
		canvasText.forEach(text => {

			// Make sure text isn't erased
			if (!text.erased) {
				let paperOptions = styles.deserialize(text.style);
				paperOptions.point = [0, 0];
				paperOptions.rotation = text.rotation;
				paperOptions.content = text.content;

				// Combine paperOptions and fontOptions
				const fontOptions = font.deserialize(text.font);
				paperOptions = Object.assign(paperOptions, fontOptions);

				this.canvasText[text.$key] = new paper.PointText(paperOptions);
				// Set bounds here because it doesn't work in object init for some reason
				this.canvasText[text.$key].bounds = rectangles.deserialize(text.bounds);
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

		// Erase current text too if it isn't in the process of being created
		if (this.tools.text.currentText && this.tools.text.currentTextFinished) {
			this.tools.text.currentText.remove();
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
	 * Selection functions
	 */

	getAllItems() {
		return paper.project.getItems({
			match: item => {
				return item.id !== this.background.id &&
						item.id !== paper.project.activeLayer.id;
			}
		});
	}

	selectedItems() {
		return this.getAllItems().filter(item => item.selected);
	}

	deselectAllItems() {
		this.selectedItems().forEach(item => item.selected = false);
	}

	editItems(items: any[]) {
		// Edit selected items into the database
		items.forEach(item => {

			// Get key from marking and text
			const markingKey = this.markingIdToPushKey(item.id);
			const textKey = this.textIdToPushKey(item.id);

			if (markingKey) {
				// If marking key exists, it's a marking

				// Serialize paths and styles to see what's different
				const serializedSegments = segments.serialize(item.segments);
				const serializedStyles = styles.serializeOptions(styles.serialize(item));

				this.whiteboardService.editMarking(this.key, markingKey, {
					path: serializedSegments,
					style: serializedStyles
				})
					.subscribe(
						data => {
							console.log('successfully edited marking!', data);
						},
						err => {
							console.log('error while editing marking!', err);
						}
					);
			} else if (textKey) {
				// If text key exists, it's text
				console.log('edit text');
			} else {
				console.log('unrecognized item!');
			}
		});
	}

	/**
	 * Snapshot functions
	 */

	takeSnapshot() {
		// Make it's a valid whiteboard first
		if (this.key && this.validKey) {
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
				this.canvasEl.toBlob((imgBlob: Blob) => {
					// Revert whiteboard to original size
					paper.project.view.scale(1 / scaleWidth, 1 / scaleHeight, new paper.Point(0, 0));
					paper.project.view.viewSize = originalViewSize;
					this.takingSnapshot = false;
					this.setBackgroundColor(this.whiteboard.background);

					// Upload image to Firebase
					this.whiteboardService.storeSnapshot(this.key, imgBlob).subscribe(
						data => {
							console.log('whiteboard snapshot is saved', data);
						},
						err => {
							console.log('error when saving whiteboard snapshot', err);
						}
					);
				});
			}, 15);
		}
	}

}
