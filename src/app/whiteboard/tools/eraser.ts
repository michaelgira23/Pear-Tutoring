import {Point} from '../../shared/model/whiteboard.service';

export class Eraser {

	eraserPath: any;
	eraserPathFinished: boolean;

	// whiteboard that this tool serves
	whiteboard: any;

	constructor(parentWhiteboard: any) {
		this.eraserPathFinished = true;
		this.whiteboard = parentWhiteboard;
	}

	/**
	* Events
	*/

	mousedown(event, point) {
		if (this.eraserPathFinished) {
			// Create a new path
			this.eraserPath = new this.whiteboard.paper.Path({
				segments: [point]
			});
			this.eraserPathFinished = false;
		} else {
			// User unclicked the mouse outside of the window, just continue with previous path
			this.eraserPath.add(point);
		}
	}

	mousemove(event, point) {
		// Only care if mouse is being dragged
		if (this.whiteboard.mouseDown && this.eraserPath && !this.eraserPathFinished) {
			// Add point to the current line
			this.eraserPath.add(point);
			this.eraseMarkingsOnLine(this.eraserPath);
		}
	}

	mouseup(event) {
		if (this.eraserPath && !this.eraserPathFinished) {
			this.eraserPathFinished = true;
			this.eraseMarkingsOnLine(this.eraserPath);
			this.eraserPath.remove();
		}
	}

	/**
	* Helper functions
	*/

	eraseMarkingsOnLine(path) {
		const markingKeys = Object.keys(this.whiteboard.canvasMarkings);
		markingKeys.forEach(markingKey => {
			// Get intersections between path and erasing path
			const intersections = this.whiteboard.canvasMarkings[markingKey].getIntersections(path);

			// If canvasMarkings intersect, erase the line
			if (intersections.length > 0) {
				this.whiteboard.whiteboardService.eraseMarking(this.whiteboard.key, markingKey)
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
}


