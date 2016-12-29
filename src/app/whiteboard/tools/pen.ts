import { segments, styles } from '../utils/serialization';
import { WhiteboardMarkingOptions } from '../../shared/model/whiteboard';
import { WhiteboardComponent } from '../whiteboard.component';

declare const paper;

export class Pen {

	currentPath: any;
	currentPathStarted: number;
	currentPathFinished: boolean = true;

	constructor(private whiteboard: WhiteboardComponent) { }

	/**
	 * Event handlers
	 */

	mousedown(event) {
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
		// Only care if mouse is being dragged
		if (this.currentPath && !this.currentPathFinished) {
			// Add point to the current line
			this.currentPath.add(this.whiteboard.cursorPoint(event));
		}
	}

	mouseup(event) {
		if (this.currentPath && !this.currentPathFinished && this.currentPath.segments.length > 1) {
			this.currentPathFinished = true;

			// Insert path into database
			const markingOptions: WhiteboardMarkingOptions = {
				started: this.currentPathStarted,
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
	}

}
