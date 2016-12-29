import { rectangles } from '../utils/serialization';
import { WhiteboardComponent } from '../whiteboard.component';
import { WhiteboardTextOptions } from './../../shared/model/whiteboard';

declare const paper;

export class Text {

	currentText: any;
	currentTextFinished: boolean = true;

	constructor(private whiteboard: WhiteboardComponent) { }

	/**
	 * Event handlers
	 */

	mousedown(event) {
		const point = this.whiteboard.cursorPoint(event);
		this.currentTextFinished = false;
		this.currentText = new paper.PointText({
			content: 'TEXT',
			point: point,
			fillColor: 'black',
			fontSize: '2.5em',
			fontWeight: 600
		});
	}

	mousemove(event) {
		if (this.currentText && !this.currentTextFinished) {
			const point = this.whiteboard.cursorPoint(event);
			this.currentText.point = point;
		}
	}

	mouseup(event) {
		if (this.currentText && this.whiteboard.allowWrite) {
			this.currentTextFinished = true;
			this.currentText.content = prompt('Enter text here:', 'TEXT');

			// Save text
			const text: WhiteboardTextOptions = {
				rotation: this.currentText.rotation,
				bounds: rectangles.serialize(this.currentText.bounds),
				content: this.currentText.content,
				font: this.whiteboard.fontOptions,
				style: this.whiteboard.styleOptions
			};
			this.whiteboard.whiteboardService.createText(this.whiteboard.key, text)
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

}
