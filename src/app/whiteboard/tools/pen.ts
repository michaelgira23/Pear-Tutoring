import { WhiteboardComponent } from './../whiteboard.component';
import { WhiteboardMarking, Point } from './../../shared/model/whiteboard.service';

declare const paper;

export class Pen {

	markingsSubscription: any;
	markings: WhiteboardMarking[];
	// paper.js canvasMarkings on the whiteboard canvas
	canvasMarkings: any = {};

	currentPath: any;
	currentPathStarted: number;
	currentPathFinished: boolean = true;

	constructor(private whiteboard: WhiteboardComponent) { }

	/**
	 * Event handlers
	 */

	mousedown(event) {
		if (this.currentPathFinished) {
			// Create a new path
			const shadowOffsetPoint = new paper.Point(this.whiteboard.markingOptions.shadowOffset.x, this.whiteboard.markingOptions.shadowOffset.y);
			this.currentPath = new paper.Path({
				segments: [this.whiteboard.cursorPoint(event)],
				// Stroke Style
				strokeColor  : this.whiteboard.markingOptions.strokeColor,
				strokeWidth  : this.whiteboard.markingOptions.strokeWidth,
				strokeCap    : this.whiteboard.markingOptions.strokeCap,
				strokeJoin   : this.whiteboard.markingOptions.strokeJoin,
				dashOffset   : this.whiteboard.markingOptions.dashOffset,
				strokeScaling: this.whiteboard.markingOptions.strokeScaling,
				dashArray    : this.whiteboard.markingOptions.dashArray,
				miterLimit   : this.whiteboard.markingOptions.miterLimit,
				// Fill Style
				fillColor    : this.whiteboard.markingOptions.fillColor,
				// Shadow Style
				shadowColor  : this.whiteboard.markingOptions.shadowColor,
				shadowBlur   : this.whiteboard.markingOptions.shadowBlur,
				shadowOffset : shadowOffsetPoint
			});
			this.currentPathStarted = Date.now();
			this.currentPathFinished = false;
		} else {
			// User unclicked the mouse outside of the window, just continue with previous path
			this.currentPath.add(this.whiteboard.cursorPoint(event));
		}
	}

	mousemove(event) {
		// Only care if mouse is being dragged
		if (this.whiteboard.mouseDown && this.currentPath && !this.currentPathFinished) {
			// Add point to the current line
			this.currentPath.add(this.whiteboard.cursorPoint(event));
		}
	}

	mouseup(event) {
		if (this.currentPath && !this.currentPathFinished) {
			this.currentPathFinished = true;

			// Add point to the current line
			this.currentPath.add(this.whiteboard.cursorPoint(event));

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
			if (this.currentPath.segments.length > 1) {
				// Insert path into database
				this.whiteboard.whiteboardService.createMarking(
					this.whiteboard.key, path, this.whiteboard.markingOptions, this.currentPathStarted)
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

	/**
	 * Helper functions
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

}
