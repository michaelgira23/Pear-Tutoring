import { Component, Input, OnInit, OnChanges, SimpleChanges, OnDestroy, ViewChild, HostListener } from '@angular/core';
import {
	WhiteboardService,
	Whiteboard,
	WhiteboardMarking,
	WhiteboardText,
	WhiteboardShape,
	Point,
	defaultMarkingOptions,
	defaultTextOptions,
	defaultShapeOptions } from '../shared/model/whiteboard.service';
import {Pen} from './tools/pen';
import {Shape} from './tools/shape';
import {Eraser} from './tools/eraser';
import {TextTool} from './tools/text-tool';

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

	// Whether or not mouse is being clicked; used for drawing and things
	mouseDown: boolean = false;
	// Whether or not to show toolbar
	@Input()
	showToolbar: boolean = true;
	// Whether or not user can make changes to whiteboard
	allowWrite: boolean = false;

	/**
	 * Background variables
	 */

	// Rectangle path on canvas to set background
	background: any;
	// If resizing background when triggered by window resize
	resizingBackground: boolean = false;

	/**
	 * Tool variables
	 */

	// What tool is selected in the whiteboard toolbar
	@Input()
	tool = 'draw';

	/**
	 * Markings
	 */

	markingsSubscription: any;
	markings: WhiteboardMarking[];
	// paper.js canvasMarkings on the whiteboard canvas
	canvasMarkings: any = {};

	@Input()
	markingOptions = defaultMarkingOptions;

	/**
	 * Text tool
	 */

	textsSubscription: any;
	texts: WhiteboardText[];

	// paper.js point text objects on the whiteboard
	canvasText: any = {};

	@Input()
	textOptions = defaultTextOptions;
	selectedText: any;
	
	/**
	 * Shape tool
	 */

	shapesSubscription: any;
	shapes: WhiteboardShape[];
	// paper.js shape objects on the whiteboard
	canvasShapes: any = {};

	@Input()
	shapeOptions = defaultShapeOptions;
	@Input()
	shapeType: string = 'rectangle';
	selectedShape: any;

	// Tool handlers

	pen = new Pen(this);
	shape = new Shape(this);
	eraser = new Eraser(this);
	text = new TextTool(this);

	toolHandlers = {
		"pen": this.pen,
		"shape": this.shape,
		"eraser": this.eraser,
		"text": this.text
	};

	constructor(private whiteboardService: WhiteboardService) { }

	/**
	 * Angular Lifecycle Hooks
	 */

	ngOnInit() {
		// Get canvas DOM reference
		this.canvasEl = this.canvas.nativeElement;
		// Setup Canvas with paper.js
		paper.setup(this.canvasEl);

		// Put content on whiteboard if it exists
		if (this.whiteboard && this.whiteboard.background) {
			this.setBackgroundColor(this.whiteboard.background);
		}
		if (this.markings) {
			this.markingsToCanvas(this.markings);
		}
		if (this.texts) {
			this.textsToCanvas(this.texts);
		}
		if (this.shapes) {
			this.shapesToCanvas(this.shapes);
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
			this.markingsSubscription = this.whiteboardService.getMarkings(this.key).subscribe(
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
			this.textsSubscription = this.whiteboardService.getTexts(this.key).subscribe(
				data => {
					this.texts = data;

					// Only update texts if whiteboard canvas is initialized
					if (this.canvasEl) {
						this.textsToCanvas(this.texts);
					}
				}
			);

			// Subscribe to shapes on whiteboard
			this.shapesSubscription = this.whiteboardService.getShapes(this.key).subscribe(
				data => {
					this.shapes = data;

					// Only update texts if whiteboard canvas is initialized
					if (this.canvasEl) {
						this.shapesToCanvas(this.shapes);
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
		if (this.markingsSubscription) {
			this.markingsSubscription.unsubscribe();
			this.markingsSubscription = null;
		}
	}

	/**
	 * Trigger Event Handlers
	 */

	// For triggering the neat little event system for each tool
	triggerToolEvent(tool: string, eventName: string, event: any) {
		if (this.toolHandlers[tool] && typeof this.toolHandlers[tool][eventName] === 'function') {
			// finds the paper.js point of the mouse relative to the canvas
			const canvasPos = this.canvasEl.getBoundingClientRect();
			const cursorX = event.clientX - canvasPos.left;
			const cursorY = event.clientY - canvasPos.top;
			const point = new paper.Point(cursorX, cursorY);

			this.toolHandlers[tool][eventName](event, point);
			// everything's normal for this . . . it should be firing:
			// console.log("Tool: " + tool + " eventname: " + eventName + " function: " + this.toolHandlers[tool][eventName]);
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
		if (event.keyCode === 90 && event.ctrlKey) {
			window.alert('Undo');
			let newMarks = [];
			for (let i = 0; i < (this.markings.length - 1); ++i) {
				newMarks[i] = this.markings[i];
			}
			this.markingsToCanvas(newMarks);
		}
	}

	/**
	 * General functions
	 */

	clearCanvas() {
		this.clearMarkings();
		this.clearText();
		this.clearShapes();
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
	 * Draw tool
	 */

	markingsToCanvas(canvasMarkings: WhiteboardMarking[]) {
		this.clearMarkings();

		// Loop through markings and add to canvas
		canvasMarkings.forEach(marking => {

			// Make sure marking isn't erased
			if (!marking.erased) {

				// Convert path points to paper.js Points objects
				let points = [];
				marking.path.forEach(point => {
					points.push(new paper.Point(point.x, point.y));
				});

				const path = new paper.Path({
					segments: points,
					strokeColor  : marking.options.strokeColor,
					strokeWidth  : marking.options.strokeWidth,
					strokeCap    : marking.options.strokeCap,
					strokeJoin   : marking.options.strokeJoin,
					dashOffset   : marking.options.dashOffset,
					strokeScaling: marking.options.strokeScaling,
					dashArray    : marking.options.dashArray,
					miterLimit   : marking.options.miterLimit
				});

				this.canvasMarkings[marking.$key] = path;
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

		// Erase current path too, if it isn't in the process of being drawn

		// TODO: these values are stored in pen.ts

		// if (this.currentPathFinished && this.currentPath) {
		// 	this.currentPath.remove();
		// }
	}

	// Shape tool

	shapesToCanvas(shapes) {
		console.log('shapes to canvas', shapes);
		this.clearShapes();

		// Loop through shapes and add to canvas
		shapes.forEach(shape => {

			// Make sure shape isn't erased
			if (!shape.erased) {

				const shadowOffsetPoint = new paper.Point(shape.options.shadowOffset.x, shape.options.shadowOffset.y);
				const shapeOptions = {
					// Stroke Style
					strokeColor  : shape.options.strokeColor,
					strokeWidth  : shape.options.strokeWidth,
					strokeCap    : shape.options.strokeCap,
					strokeJoin   : shape.options.strokeJoin,
					dashOffset   : shape.options.dashOffset,
					strokeScaling: shape.options.strokeScaling,
					dashArray    : shape.options.dashArray,
					miterLimit   : shape.options.miterLimit,
					// Fill Style
					fillColor    : shape.options.fillColor,
					// Shadow Style
					shadowColor  : shape.options.shadowColor,
					shadowBlur   : shape.options.shadowBlur,
					shadowOffset : shadowOffsetPoint
				};

				switch (shape.type) {
					case 'circle':
						this.canvasShapes[shape.$key] = new paper.Shape.Circle(shapeOptions);
						break;
					case 'rectangle':
						this.canvasShapes[shape.$key] = new paper.Shape.Rectangle(shapeOptions);
						break;
					case 'ellipse':
						this.canvasShapes[shape.$key] = new paper.Shape.Ellipse(shapeOptions);
						break;
					default:
						console.log('Unrecognized shape!', shape.type);
				}
			}
		});
	}

	clearShapes() {
		// Erase current canvas markings if they exist
		if (this.shapes) {
			const shapeKeys = Object.keys(this.canvasShapes);
			shapeKeys.forEach(key => {
				this.canvasShapes[key].remove();
				delete this.canvasShapes[key];
			});
		}
	}

	// Text tool

	textsToCanvas(texts: WhiteboardText[]) {
		console.log('texts to canvas', texts);
		this.clearText();

		// Loop through texts and add to canvas
		texts.forEach(text => {

			// Make sure text isn't erased
			if (!text.erased) {

				const shadowOffsetPoint = new paper.Point(text.options.shadowOffset.x, text.options.shadowOffset.y);
				const path = new paper.PointText({
					content: text.content,
					// Stroke Style
					strokeColor  : text.options.strokeColor,
					strokeWidth  : text.options.strokeWidth,
					strokeCap    : text.options.strokeCap,
					strokeJoin   : text.options.strokeJoin,
					dashOffset   : text.options.dashOffset,
					strokeScaling: text.options.strokeScaling,
					dashArray    : text.options.dashArray,
					miterLimit   : text.options.miterLimit,
					// Fill Style
					fillColor    : text.options.fillColor,
					// Shadow Style
					shadowColor  : text.options.shadowColor,
					shadowBlur   : text.options.shadowBlur,
					shadowOffset : shadowOffsetPoint,
					// Character Style
					fontFamily   : text.options.fontFamily,
					fontWeight   : text.options.fontWeight,
					fontSize     : text.options.fontSize,
					// Position
					point        : new paper.Point(text.position.anchor.x, text.position.anchor.y),
					position     : new paper.Point(text.position.position.x, text.position.position.y),
					rotation     : text.position.rotation,
					scaling      : new paper.Point(text.position.scaling.x, text.position.scaling.y),
				});

				this.canvasText[text.$key] = path;
			}
		});
	}

	clearText() {
		// Erase current canvas markings if they exist
		if (this.texts) {
			const textKeys = Object.keys(this.canvasText);
			textKeys.forEach(key => {
				this.canvasText[key].remove();
				delete this.canvasText[key];
			});
		}
	}

	deselectAllText() {
		const textKeys = Object.keys(this.canvasText);
		textKeys.forEach(key => {
			this.canvasText[key].selected = false;
		});
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
}
