import { Component, Input, OnInit, OnDestroy, ViewChild, HostListener } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { WhiteboardService, Whiteboard, defaultMarkingOptions, Point } from '../shared/model/whiteboard.service';

declare const paper;

@Component({
	selector: 'app-whiteboard',
	templateUrl: './whiteboard.component.html',
	styleUrls: ['./whiteboard.component.scss']
})
export class WhiteboardComponent implements OnInit, OnDestroy {

	// Key of whiteboard
	@Input()
	key: string;

	// Whiteboard <canvas>
	@ViewChild('whiteboard')
	canvas;
	// Actual canvas DOM reference
	canvasEl: any;

	// paper.js paths on the whiteboard canvas
	paths: any = {};
	// Options for drawing the path that are currently selected
	@Input()
	pathOptions = defaultMarkingOptions;
	// Current path being drawn
	currentPath: any;
	currentPathFinished: boolean = true;
	// Rectangle on canvas to set background
	background: any;
	// If resizing background when triggered by window resize
	resizingBackground: boolean = false;

	// Whether or not mouse is clicked; used for drawing
	mouseDown: boolean = false;

	// Observable subscriptions
	whiteboardSubscription: any;
	markingsSubscription: any;

	// Data from database
	whiteboard: Whiteboard;

	constructor(private route: ActivatedRoute, private whiteboardService: WhiteboardService) { }

	ngOnInit() {
		this.canvasEl = this.canvas.nativeElement;
		// Setup Canvas with paper.js
		paper.setup(this.canvasEl);

		// Listen to route parameters until we get session component up
		this.route.params.subscribe(
			params => {
				this.key = params['key'];
				this.whiteboardSubscription = this.whiteboardService.getWhiteboard(this.key).subscribe(
					data => {
						console.log('whiteboard data', data);
						this.whiteboard = data;
						this.setBackgroundColor(this.whiteboard.background);
					},
					err => {
						console.log('create whiteboard error!', err);
					}
				);

				this.markingsSubscription = this.whiteboardService.getMarkings(this.key).subscribe(
					data => {
						console.log('new marking', data);
						this.markingsToCanvas(data);
					},
					err => {
						console.log('whiteboard markings error!', err);
					}
				);
			}
		);
	}

	ngOnDestroy() {
		this.whiteboardSubscription.unsubscribe();
		this.markingsSubscription.unsubscribe();
	}

	onMouseDown(event) {
		this.mouseDown = true;

		if (this.currentPathFinished) {
			// Create a new path
			this.currentPath = new paper.Path({
				segments: [this.cursorPoint(event)],
				strokeColor  : this.pathOptions.strokeColor,
				strokeWidth  : this.pathOptions.strokeWidth,
				strokeCap    : this.pathOptions.strokeCap,
				strokeJoin   : this.pathOptions.strokeJoin,
				dashOffset   : this.pathOptions.dashOffset,
				strokeScaling: this.pathOptions.strokeScaling,
				dashArray    : this.pathOptions.dashArray,
				miterLimit   : this.pathOptions.miterLimit
			});
			this.currentPathFinished = false;
		} else {
			// User unclicked the mouse outside of the window, just continue with previous path
			this.currentPath.add(this.cursorPoint(event));
		}
	}

	onMouseMove(event) {
		// Only care if mouse is being dragged
		if (this.mouseDown) {
			// Add point to the current line
			this.currentPath.add(this.cursorPoint(event));
		}
	}

	onMouseUp(event) {
		this.mouseDown = false;
		this.currentPathFinished = true;

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

		// Insert path into database
		this.whiteboardService.createMarking(this.key, path, this.pathOptions)
			.subscribe(
				data => {
					console.log('successfully added marking', data);
				},
				err => {
					console.log('add marking error', err);
				}
			);
	}

	@HostListener('window:resize', ['$event'])
	onResize(event) {
		if (!this.resizingBackground) {
			this.resizingBackground = true;

			setTimeout(() => {
				if (this.resizingBackground) {
					this.resizeBackground();
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

	resizeBackground() {
		if (this.background) {
			const bottomLeft = new paper.Point(0, this.canvasEl.height);
			const topLeft = new paper.Point(0, 0);
			const topRight = new paper.Point(this.canvasEl.width, 0);
			const bottomRight = new paper.Point(this.canvasEl.width, this.canvasEl.height);

			console.log(this.background.segments);

			this.background.insertSegments(0, [bottomLeft, topLeft, topRight, bottomRight]);
			this.background.removeSegments(4);
		}
	}

	markingsToCanvas(paths: any[]) {
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

}
