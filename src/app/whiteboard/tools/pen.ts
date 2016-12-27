import { WhiteboardMarking, WhiteboardMarkingOptions, Point } from '../../shared/model/whiteboard';
import { WhiteboardComponent } from '../whiteboard.component';
import { defaultPosition } from '../../shared/model/whiteboard.service';

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

			let paperOptions = this.whiteboard.styleObjectToPaperObject(this.whiteboard.styleOptions);
			paperOptions.segments = [this.whiteboard.cursorPoint(event)];

			this.currentPath = new paper.Path(paperOptions);
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
				const markingOptions: WhiteboardMarkingOptions = {
					started: this.currentPathStarted,
					path,
					position: defaultPosition,
					style: this.whiteboard.styleOptions
				};
				this.whiteboard.whiteboardService.createMarking(this.whiteboard.key, markingOptions)
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

				let paperOptions = this.whiteboard.styleObjectToPaperObject(marking.style);
				paperOptions.segments = points;
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

		// Erase current path too, if it isn't in the process of being drawn
		if (this.currentPathFinished && this.currentPath) {
			this.currentPath.remove();
		}
	}

}
