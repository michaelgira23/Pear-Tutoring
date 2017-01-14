import { segments, styles } from '../utils/serialization';
import { WhiteboardMarkingOptions } from '../../shared/model/whiteboard';
import { WhiteboardComponent } from '../whiteboard.component';

declare const paper;

export class Pen {

	// For toolbar
	toolbarShowStyles = true;

	currentPath: any;
	currentPathStarted: number;
	currentPathFinished: boolean = true;

	constructor(private whiteboard: WhiteboardComponent) { }

	/**
	 * Event handlers
	 */

	mousedown(event) {
		// If no permissions, delete current line
		if (!this.whiteboard.shouldWrite) {
			this.clearCurrentPath();
			return;
		}

		if (this.currentPathFinished) {
			this.currentPathFinished = false;
			this.currentPathStarted = Date.now();

			let paperOptions = styles.deserialize(this.whiteboard.styleOptions, true);
			paperOptions.segments = [this.whiteboard.cursorPoint(event)];
			this.currentPath = new paper.Path(paperOptions);
		} else if (this.currentPath) {
			// User unclicked the mouse outside of the window, just continue with previous path
			this.currentPath.add(this.whiteboard.cursorPoint(event));
		}
	}

	mousemove(event) {
		// If no permissions, delete current line
		if (!this.whiteboard.shouldWrite) {
			this.clearCurrentPath();
			return;
		}

		// Only care if mouse is being dragged
		if (this.currentPath && !this.currentPathFinished) {
			// Add point to the current line
			this.currentPath.add(this.whiteboard.cursorPoint(event));
		}
	}

	mouseup(event) {
		// If no permissions, delete current line
		if (!this.whiteboard.shouldWrite) {
			this.clearCurrentPath();
			return;
		}

		if (this.currentPath && !this.currentPathFinished && this.currentPath.segments.length > 1) {
			this.currentPathFinished = true;

			// Simplify path
			this.currentPath.simplify(10);

			// Insert path into database
			const markingOptions: WhiteboardMarkingOptions = {
				drawTime: Date.now() - this.currentPathStarted,
				path: segments.serialize(this.currentPath.segments),
				style: styles.serialize(this.currentPath, true)
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
		}

		// If we don't have permission to read, erase line.
		// Otherwise, it will be erased when the database responds with new data.
		if (!this.whiteboard.shouldRead) {
			this.clearCurrentPath();
		}
	}

	/**
	 * Helper functions
	 */

	clearCurrentPath() {
		this.currentPathFinished = true;
		if (this.currentPath) {
			this.currentPath.remove();
		}
		this.currentPath = null;
	}

}
