import { WhiteboardComponent } from './../whiteboard.component';
declare const paper;

export class Eraser {

	eraserPath: any;
	eraserPathFinished: boolean = true;

	constructor(private whiteboard: WhiteboardComponent) { }

	/**
	 * Event handlers
	 */

	mousedown(event) {
		if (this.eraserPathFinished) {
			// Create a new path
			this.eraserPath = new paper.Path({
				segments: [this.whiteboard.cursorPoint(event)]
			});
			this.eraserPathFinished = false;
		} else {
			// User unclicked the mouse outside of the window, just continue with previous path
			this.eraserPath.add(this.whiteboard.cursorPoint(event));
		}
	}

	mousemove(event) {
		// Only care if mouse is being dragged
		if (this.whiteboard.mouseDown && this.eraserPath && !this.eraserPathFinished) {
			// Add point to the current line
			this.eraserPath.add(this.whiteboard.cursorPoint(event));
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
		// Erase markings
		const markingKeys = Object.keys(this.whiteboard.canvasMarkings);
		markingKeys.forEach(markingKey => {
			// If marking and erase path intersect, erase the line
			if (this.whiteboard.canvasMarkings[markingKey].intersects(path)) {
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

		// Also erase text
		const textKeys = Object.keys(this.whiteboard.canvasText);
		textKeys.forEach(textKey => {
			// If text and erase path intersect, erase the line
			if (this.whiteboard.canvasText[textKey].intersects(path)) {
				this.whiteboard.whiteboardService.eraseText(this.whiteboard.key, textKey)
					.subscribe(
						data => {
							console.log('Erased text', data);
						},
						err => {
							console.log('Erase text error', err);
						}
					);
			}
		});
	}
}
