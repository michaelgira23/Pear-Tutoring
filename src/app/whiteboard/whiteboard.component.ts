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
	 * Draw tool
	 */

	markingsSubscription: any;
	markings: WhiteboardMarking[];
	// paper.js canvasMarkings on the whiteboard canvas
	canvasMarkings: any = {};

	@Input()
	markingOptions = defaultMarkingOptions;
	currentPath: any;
	currentcanvasMarkingstarted: number;
	currentPathFinished: boolean = true;

	/**
	 * Eraser tool
	 */

	eraserPath: any;
	eraserPathFinished: boolean = true;

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
	// Whether or not to create or edit text on mouseup
	editExisting: boolean = false;

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

	/**
	 * Event handlers for each tool
	 */

	toolHandlers: any = {

		/**
		 * Draw tool
		 */

		draw: {
			mousedown: event => {
				if (this.allowWrite) {
					if (this.currentPathFinished) {
						// Create a new path
						const shadowOffsetPoint = new paper.Point(this.markingOptions.shadowOffset.x, this.markingOptions.shadowOffset.y);
						this.currentPath = new paper.Path({
							segments: [this.cursorPoint(event)],
							// Stroke Style
							strokeColor  : this.markingOptions.strokeColor,
							strokeWidth  : this.markingOptions.strokeWidth,
							strokeCap    : this.markingOptions.strokeCap,
							strokeJoin   : this.markingOptions.strokeJoin,
							dashOffset   : this.markingOptions.dashOffset,
							strokeScaling: this.markingOptions.strokeScaling,
							dashArray    : this.markingOptions.dashArray,
							miterLimit   : this.markingOptions.miterLimit,
							// Fill Style
							fillColor    : this.markingOptions.fillColor,
							// Shadow Style
							shadowColor  : this.markingOptions.shadowColor,
							shadowBlur   : this.markingOptions.shadowBlur,
							shadowOffset : shadowOffsetPoint
						});
						this.currentcanvasMarkingstarted = Date.now();
						this.currentPathFinished = false;
					} else {
						// User unclicked the mouse outside of the window, just continue with previous path
						this.currentPath.add(this.cursorPoint(event));
					}
				}
			},
			mousemove: event => {
				// Only care if mouse is being dragged
				if (this.mouseDown && this.currentPath && !this.currentPathFinished && this.allowWrite) {
					// Add point to the current line
					this.currentPath.add(this.cursorPoint(event));
				}
			},
			mouseup: event => {
				if (this.currentPath && !this.currentPathFinished) {
					this.currentPathFinished = true;

					// Add point to the current line
					this.currentPath.add(this.cursorPoint(event));

					// Convert path segments into an array
					const path = [];
					this.currentPath.segments.forEach(segment => {
						const point: Point = {
							x: segment.point.x,
							y: segment.point.y
						};
						path.push(point);
					});

					// Check if we're still allowed to draw and it's more than just one point
					if (this.allowWrite && this.currentPath.segments.length > 1) {
						// Insert path into database
						this.whiteboardService.createMarking(this.key, path, this.markingOptions, this.currentcanvasMarkingstarted)
							.subscribe(
								data => {
									console.log('successfully added marking', data);
								},
								err => {
									console.log('add marking error', err);
								}
							);
					} else {
						// Erase the path since we can't draw
						this.currentPath.remove();
					}
				}
			}
		},

		/**
		 * Eraser tool
		 */

		eraser: {
			mousedown: event => {
				if (this.allowWrite) {
					if (this.eraserPathFinished) {
						// Create a new path
						this.eraserPath = new paper.Path({
							segments: [this.cursorPoint(event)]
						});
						this.eraserPathFinished = false;
					} else {
						// User unclicked the mouse outside of the window, just continue with previous path
						this.eraserPath.add(this.cursorPoint(event));
					}
				}
			},
			mousemove: event => {
				// Only care if mouse is being dragged
				if (this.mouseDown && this.eraserPath && !this.eraserPathFinished && this.allowWrite) {
					// Add point to the current line
					this.eraserPath.add(this.cursorPoint(event));
					this.eraseMarkingsOnLine(this.eraserPath);
				}
			},
			mouseup: event => {
				if (this.eraserPath && !this.eraserPathFinished) {
					this.eraserPathFinished = true;
					this.eraseMarkingsOnLine(this.eraserPath);
					this.eraserPath.remove();
				}
			}
		},

		/**
		 * Text tool
		 */

		text: {
			mousedown: event => {
				const point = this.cursorPoint(event);
				const hit = paper.project.hitTest(point, {
					class: paper.PointText,
					fill: true,
					stroke: true,
					segments: true,
					bounds: true
				});

				console.log(hit);

				let key = null;

				if (hit) {
					key = this.textIdToPushKey(hit.item.id);

					if (key) {
						console.log('select existing text');
						this.editExisting = true;
						this.selectedText = this.canvasText[key];
					}
				}

				if (!key) {
					// Create new text
					console.log('create new text');
					this.editExisting = false;
					this.selectedText = new paper.PointText({
						content: 'TEXT',
						point: point,
						fillColor: 'black',
						fontSize: '2.5em',
						fontWeight: 600
					});
				}

				console.log(this.selectedText);

				this.deselectAllText();
				this.selectedText.selected = true;

			},
			mousemove: event => {
				if (this.selectedText && this.mouseDown) {
					// Check if mouse is over any of the manipulation points
					const point = this.cursorPoint(event);
					const hit = this.selectedText.hitTest(point, {
						tolerance: 1000,
						fill: true,
						stroke: true,
						segments: true,
						bounds: true
					});

					console.log(Date.now(), hit);

					if (hit) {
						// If dragging one of the text corners, move selected text
						this.selectedText.point = point;
					}
				}
			},
			mouseup: event => {
				if (this.selectedText && this.allowWrite) {
					console.log('mouseup', this.selectedText);

					// Convert points into objects for database
					const anchor = {
						x: this.selectedText.point.x,
						y: this.selectedText.point.y
					};
					const positionPosition = {
						x: this.selectedText.position.x,
						y: this.selectedText.position.y
					};
					const scaling = {
						x: this.selectedText.scaling.x,
						y: this.selectedText.scaling.y
					};

					const position = {
						anchor,
						position: positionPosition,
						rotation: this.selectedText.rotation,
						scaling
					};

					if (this.editExisting) {
						// Modify existing text in database
						const pushKey = this.textIdToPushKey(this.selectedText.id);
						this.whiteboardService.editText(this.key, pushKey, this.selectedText.content, this.textOptions, position)
							.subscribe(
								data => {
									console.log('successfully editted text', data);
								},
								err => {
									console.log('edit text error', err);
								}
							);
					} else {
						// Create new text in database
						this.whiteboardService.createText(this.key, this.selectedText.content, this.textOptions, position)
							.subscribe(
								data => {
									console.log('successfully added text', data);
								},
								err => {
									console.log('add text error', err);
								}
							);
					}
				}
			},
			toolchange: nextTool => {
				this.deselectAllText();
			}
		},

		/**
		 * Shapes tool
		 */

		shape: {
			mousedown: event => {
				const point = this.cursorPoint(event);
				const hit = paper.project.hitTest(point, {
					tolerance: 1000,
					class: paper.Shape,
					fill: true,
					stroke: true,
					segments: true,
					bounds: true
				});

				console.log(hit);

				let key = null;

				if (hit) {
					key = this.shapeIdToPushKey(hit.item.id);

					if (key) {
						this.selectedShape = this.canvasShapes[key];
					}
				}

				if (!key) {
					// Create new text
					this.selectedText = new paper.PointText({
						content: 'TEXT',
						point: point,
						fillColor: 'black',
						fontSize: '2.5em',
						fontWeight: 600
					});
				}

				this.deselectAllShapes();
				this.selectedText.selected = true;

			},
			mousemove: event => {
				if (this.selectedText && this.mouseDown) {
					// Check if mouse is over any of the manipulation points
					const point = this.cursorPoint(event);
					const hit = this.selectedText.hitTest(point, {
						tolerance: 1000,
						fill: true,
						stroke: true,
						segments: true,
						bounds: true
					});

					console.log(Date.now(), hit);

					if (hit) {
						// If dragging one of the text corners, move selected text
						this.selectedText.point = point;
					}
				}
			},
			mouseup: event => {
				if (this.selectedText && this.allowWrite) {
					this.whiteboardService.createShape(this.key, this.selectedText.content, this.textOptions)
						.subscribe(
							data => {
								console.log('successfully added text', data);
							},
							err => {
								console.log('add text error', err);
							}
						);
				}
			},
			toolchange: nextTool => {
				this.deselectAllShapes();
			}
		}
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
			this.toolHandlers[tool][eventName](event);
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

	cursorPoint(event) {
		// Return a paper.js point where the mouse is at relative to the canvas
		const canvasPos = this.canvasEl.getBoundingClientRect();
		const cursorX = event.clientX - canvasPos.left;
		const cursorY = event.clientY - canvasPos.top;

		return new paper.Point(cursorX, cursorY);
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
		if (this.currentPathFinished && this.currentPath) {
			this.currentPath.remove();
		}
	}

	/**
	 * Eraser tool
	 */

	eraseMarkingsOnLine(path) {
		const markingKeys = Object.keys(this.canvasMarkings);
		markingKeys.forEach(key => {
			// Get intersections between path and erasing path
			const intersections = this.canvasMarkings[key].getIntersections(path);

			// If canvasMarkings intersect, erase the line
			if (intersections.length > 0) {
				this.whiteboardService.eraseMarking(this.key, key)
					.subscribe(
						data => {
							console.log('Erased marking', data);
						},
						err => {
							console.log('Erase marking error', err);
						}
					);
			}
		});
	}

	/**
	 * Text tool
	 */

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

	/**
	 * Shapes tool
	 */

	shapesToCanvas(shapes: WhiteboardShape[]) {
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

	deselectAllShapes() {
		const shapeKeys = Object.keys(this.canvasShapes);
		shapeKeys.forEach(key => {
			this.canvasShapes[key].selected = false;
		});
	}

	shapeIdToPushKey(id) {
		const shapeKeys = Object.keys(this.canvasShapes);
		for (let i = 0; i < shapeKeys.length; i++) {
			const shape = this.canvasShapes[shapeKeys[i]];
			if (shape.id === id) {
				return shapeKeys[i];
			}
		}
		return null;
	}

}
