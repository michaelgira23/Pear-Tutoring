import {Point} from '../../shared/model/whiteboard.service';

export class Pen {

	currentPath: any;
	currentcanvasMarkingstarted: number;
	currentPathFinished: boolean;

	// whiteboard that this tool serves
	whiteboard: any;

	constructor(parentWhiteboard: any) {
		this.whiteboard = parentWhiteboard;
		this.currentPathFinished = true;
	}

	mousedown(event, point) {
		if (this.currentPathFinished) {
			// Create a new path
			const shadowOffsetPoint = new this.whiteboard.paper.Point(this.whiteboard.markingOptions.shadowOffset.x, this.whiteboard.markingOptions.shadowOffset.y);
			this.currentPath = new this.whiteboard.paper.Path({
				segments: [point],
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
			this.currentcanvasMarkingstarted = Date.now();
			this.currentPathFinished = false;
		} else {
			// User unclicked the mouse outside of the window, just continue with previous path
			this.currentPath.add(point);
		}
	}

	mousemove(event, point) {
		// Only care if mouse is being dragged
		if (this.whiteboard.mouseDown && this.currentPath && !this.currentPathFinished) {
			// Add point to the current line
			this.currentPath.add(point);
		}
	}

	mouseup(event, point) {
		if (this.currentPath && !this.currentPathFinished) {
			this.currentPathFinished = true;

			// Add point to the current line
			this.currentPath.add(point);

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
				this.whiteboard.whiteboardService.createMarking(this.whiteboard.key, path, this.whiteboard.markingOptions, this.currentcanvasMarkingstarted)
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

}