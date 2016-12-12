import { Component, Input, OnInit, OnChanges, SimpleChanges, OnDestroy, ViewChild, HostListener } from '@angular/core';
import { WhiteboardService, Whiteboard, WhiteboardMarking, defaultMarkingOptions, Point } from '../shared/model/whiteboard.service';

declare const paper;

@Component({
	selector: 'app-whiteboard',
	templateUrl: './whiteboard.component.html',
	styleUrls: ['./whiteboard.component.scss']
})
export class WhiteboardComponent implements OnInit, OnChanges, OnDestroy {

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

	// Whether or not mouse is clicked; used for drawing
	mouseDown: boolean = false;

	// Observable subscriptions
	whiteboardSubscription: any;
	markingsSubscription: any;
	// Whiteboard and marking objects from database
	whiteboard: Whiteboard;
	markings: WhiteboardMarking[];

	// paper.js paths on the whiteboard canvas
	paths: any = {};
	// Current path being drawn
	currentPath: any;
	// Whether moues is still held down and segments are being added to current path
	currentPathFinished: boolean = true;
	// Whether or not user can draw on the whiteboard
	allowDraw: boolean = false;

	// Options for drawing the path that are currently selected
	@Input()
	markingOptions = defaultMarkingOptions;
	// Whether or not to show toolbar for editting marking options
	@Input()
	showToolbar: boolean = true;

	// Rectangle on canvas to set background
	background: any;
	// If resizing background when triggered by window resize
	resizingBackground: boolean = false;

	constructor(private whiteboardService: WhiteboardService) { }

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
						this.allowDraw = true;
					} else {
						this.cleanUp();
						this.clearCanvas();
						this.validKey = false;
						this.allowDraw = false;
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
		}
	}

	ngOnDestroy() {
		this.cleanUp();
	}

	cleanUp() {
		// Clean up observables and stuff
		if (this.whiteboardSubscription) {
			this.whiteboardSubscription.unsubscribe();
			this.whiteboardSubscription = null;
		}
		if (this.markingsSubscription) {
			this.markingsSubscription.unsubscribe();
			this.markingsSubscription = null;
		}
	}

	onMouseDown(event) {
		this.mouseDown = true;

		if (this.allowDraw) {
			if (this.currentPathFinished) {
				// Create a new path
				this.currentPath = new paper.Path({
					segments: [this.cursorPoint(event)],
					strokeColor  : this.markingOptions.strokeColor,
					strokeWidth  : this.markingOptions.strokeWidth,
					strokeCap    : this.markingOptions.strokeCap,
					strokeJoin   : this.markingOptions.strokeJoin,
					dashOffset   : this.markingOptions.dashOffset,
					strokeScaling: this.markingOptions.strokeScaling,
					dashArray    : this.markingOptions.dashArray,
					miterLimit   : this.markingOptions.miterLimit
				});
				this.currentPathFinished = false;
			} else {
				// User unclicked the mouse outside of the window, just continue with previous path
				this.currentPath.add(this.cursorPoint(event));
			}
		}
	}

	onMouseMove(event) {
		// Only care if mouse is being dragged
		if (this.mouseDown && this.currentPath && !this.currentPathFinished && this.allowDraw) {
			// Add point to the current line
			this.currentPath.add(this.cursorPoint(event));
		}
	}

	onMouseUp(event) {
		this.mouseDown = false;
		this.currentPathFinished = true;

		if (this.currentPath) {

			// Add point to the current line
			this.currentPath.add(this.cursorPoint(event));
			// Simplify path to make it smoother and less data
			this.currentPath.simplify();

			// Convert path segments into an array
			const path = [];
			this.currentPath.segments.forEach(segment => {
				const point: Point = {
					x: segment.point.x,
					y: segment.point.y
				};
				path.push(point);
			});

			// Check if we're still allowed to draw
			if (this.allowDraw) {
				// Insert path into database
				this.whiteboardService.createMarking(this.key, path, this.markingOptions)
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

	cursorPoint(event) {
		// Return a paper.js point where the mouse is at relative to the canvas
		const canvasPos = this.canvasEl.getBoundingClientRect();
		const cursorX = event.clientX - canvasPos.left;
		const cursorY = event.clientY - canvasPos.top;

		return new paper.Point(cursorX, cursorY);
	}

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

	markingsToCanvas(paths: any[]) {
		this.clearCanvas();

		// Loop through markings and add to canvas
		paths.forEach(marking => {

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
				miterLimit   : marking.options.miterLimit,
				opacity      : marking.options.opacity
			});

			this.paths[marking.$key] = path;
		});

	}

	clearCanvas() {
		// Erase current canvas markings if they exist
		if (this.paths) {
			const markingKeys = Object.keys(this.paths);
			markingKeys.forEach(key => {
				this.paths[key].remove();
				delete this.paths[key];
			});
		}

		// Erase current path too, if it isn't in the process of being drawn
		if (this.currentPathFinished && this.currentPath) {
			this.currentPath.remove();
		}
	}

}
