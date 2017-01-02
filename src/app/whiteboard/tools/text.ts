import { rectangles, styles, font } from '../utils/serialization';
import { WhiteboardComponent } from '../whiteboard.component';
import { WhiteboardTextOptions } from './../../shared/model/whiteboard';

declare const paper;

export class Text {

	// For toolbar
	toolbarShowStyles = true;
	toolbarShowText = true;

	currentText: any;
	currentTextFinished: boolean = true;

	constructor(private whiteboard: WhiteboardComponent) { }

	/**
	 * Event handlers
	 */

	mousedown(event) {
		const point = this.whiteboard.cursorPoint(event);
		if (this.currentTextFinished) {
			this.currentTextFinished = false;

			let paperOptions = styles.deserialize(this.whiteboard.styleOptions);
			paperOptions.content = 'TEXT';
			paperOptions.point = point;


			// Combine paperOptions and fontOptions
			const fontOptions = font.deserialize(this.whiteboard.fontOptions);
			paperOptions = Object.assign(paperOptions, fontOptions);

			this.currentText = new paper.PointText(paperOptions);
		} else if (this.currentText) {
			this.currentText.point = point;
		}
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
			this.currentText.content = prompt('Enter text here:', this.currentText.content);

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
