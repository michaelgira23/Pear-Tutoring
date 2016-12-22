import { Component, Input, OnInit, OnChanges, SimpleChanges, OnDestroy, ViewChild, HostListener } from '@angular/core';
import {
	WhiteboardService,
	Whiteboard,
	defaultMarkingOptions,
	defaultTextOptions,
	defaultShapeOptions } from '../shared/model/whiteboard.service';

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
	@ViewChild('whiteboard')
	canvas;
	// Actual canvas DOM reference
	canvasEl: any;

	whiteboardSubscription: any;
	// Latest value of whiteboard object from database
	whiteboard: Whiteboard;

	// Whether or not to show toolbar
	@Input()
	showToolbar: boolean = true;
	// Whether or not user can make changes to whiteboard
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
	selectedItems = [];
	selectedPoints = [];

	/**
	 * Tool variables
	 */

	// What tool is selected in the whiteboard toolbar
	@Input()
	tool: string = 'cursor';

	// Pen tool
	@Input()
	markingOptions = defaultMarkingOptions;

	// Text tool
	@Input()
	textOptions = defaultTextOptions;

	// Shape tool
	@Input()
	shapeOptions = defaultShapeOptions;
	@Input()
	shapeType: string = 'polygon';
	@Input()
	polygonSides: any = 4;

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
			this.tools.pen.markingsSubscription = this.whiteboardService.getMarkings(this.key).subscribe(
				data => {
					this.tools.pen.markings = data;

					// Only update markings if whiteboard canvas is initialized
					if (this.canvasEl) {
						this.tools.pen.markingsToCanvas(this.tools.pen.markings);
					}
				},
				err => {
					console.log('whiteboard markings error!', err);
				}
			);

			// Subscribe to text on whiteboard
			this.tools.text.textsSubscription = this.whiteboardService.getTexts(this.key).subscribe(
				data => {
					this.tools.text.texts = data;

					// Only update texts if whiteboard canvas is initialized
					if (this.canvasEl) {
						this.tools.text.textsToCanvas(this.tools.text.texts);
					}
				}
			);

			// Subscribe to shapes on whiteboard
			this.tools.shape.shapesSubscription = this.whiteboardService.getShapes(this.key).subscribe(
				data => {
					this.tools.shape.shapes = data;

					// Only update texts if whiteboard canvas is initialized
					if (this.canvasEl) {
						this.tools.shape.shapesToCanvas(this.tools.shape.shapes);
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
	}

	cleanUp() {
		// Clean up observables and stuff when component should be reset/destroyed
		if (this.whiteboardSubscription) {
			this.whiteboardSubscription.unsubscribe();
			this.whiteboardSubscription = null;
		}
		if (this.tools.pen.markingsSubscription) {
			this.tools.pen.markingsSubscription.unsubscribe();
			this.tools.pen.markingsSubscription = null;
		}
		if (this.tools.text.textsSubscription) {
			this.tools.text.textsSubscription.unsubscribe();
			this.tools.text.textsSubscription = null;
		}
		if (this.tools.shape.shapesSubscription) {
			this.tools.shape.shapesSubscription.unsubscribe();
			this.tools.shape.shapesSubscription = null;
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
		if (!this.resizingBackground) {
			this.resizingBackground = true;

			setTimeout(() => {
				if (this.resizingBackground) {
					if (this.whiteboard.background) {
						this.setBackgroundColor(this.whiteboard.background);
					}
					this.resizingBackground = false;
				}
			}, 100);
		}
	}

	@HostListener('window:keydown', ['$event'])
	onKeydown(event: KeyboardEvent) {
		this.mapKeys(event);
		if (event.keyCode === 90 && event.ctrlKey) {
			window.alert('Undo');
			let newMarks = [];
			for (let i = 0; i < (this.tools.pen.markings.length - 1); ++i) {
				newMarks[i] = this.tools.pen.markings[i];
			}
			this.tools.pen.markingsToCanvas(newMarks);
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

	/**
	 * General functions
	 */

	cursorPoint(event) {
		// Return a paper.js point where the mouse is at relative to the canvas
		const canvasPos = this.canvasEl.getBoundingClientRect();
		const cursorX = event.clientX - canvasPos.left;
		const cursorY = event.clientY - canvasPos.top;

		return new paper.Point(cursorX, cursorY);
	}

	clearCanvas() {
		this.tools.pen.clearMarkings();
		this.tools.text.clearText();
		this.tools.shape.clearShapes();
	}

	/**
	 * Background functions
	 */

	setBackgroundColor(color: string) {
		// If there is currently a background, remove it
		if (this.background) {
			this.background.remove();
		}

		// Create new points for the background
		const topLeft = new paper.Point(0, 0);
		const bottomRight = new paper.Point(this.canvasEl.width, this.canvasEl.height);

		// Create a new rectangle that spans the whole canvas
		this.background = new paper.Path.Rectangle(topLeft, bottomRight);

		// Send the canvas to the back
		this.background.sendToBack();
		this.background.fillColor = color;
	}

	/**
	* Selection functions
	*/

	deselectAllItems(): void {
		this.selectedItems.forEach(function(item) {
			item.selected = false;
		});
		this.selectedItems = [];
	}

	selectItem(item: any): void {
		item.selected = true;
		this.selectedItems.push(item);
	}

	selectOnly(item: any): void {
		this.deselectAllItems();
		this.selectItem(item);
	}
}
