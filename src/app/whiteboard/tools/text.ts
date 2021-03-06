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
	// Whether currentText previously existing on whiteboard
	editingCurrentText: boolean = false;

	constructor(private whiteboard: WhiteboardComponent) { }

	/**
	 * Event handlers
	 */

	mousedown(event) {
		// If no permissions, delete current text
		if (!this.whiteboard.shouldWrite) {
			this.clearCurrentText();
			return;
		}

		const point = this.whiteboard.cursorPoint(event);

		if (this.currentTextFinished) {
			this.currentTextFinished = false;

			// Find if text tool hit existing text
			const hit = paper.project.hitTest(point, {
				class: paper.PointText,
				fill: true,
				stroke: true,
				bounds: true,
				tolerance: 5
			});

			if (!hit) {
				// We did not hit any text. Create anotha one.
				let paperOptions = styles.deserialize(this.whiteboard.styleOptions);
				paperOptions.content = 'TEXT';
				paperOptions.point = point;

				// Combine paperOptions and fontOptions
				const fontOptions = font.deserialize(this.whiteboard.fontOptions);
				paperOptions = Object.assign(paperOptions, fontOptions);

				this.currentText = new paper.PointText(paperOptions);
				this.editingCurrentText = false;
			} else {
				// Select hit text
				this.currentText = hit.item;
				this.editingCurrentText = true;
			}
		} else if (this.currentText) {
			this.currentText.point = point;
		}
	}

	mousemove(event) {
		// If no permissions, delete current text
		if (!this.whiteboard.shouldWrite) {
			this.clearCurrentText();
			return;
		}

		if (this.currentText && !this.currentTextFinished) {
			const point = this.whiteboard.cursorPoint(event);
			this.currentText.point = point;
		}
	}

	mouseup(event) {
		// If no permissions, delete current text
		if (!this.whiteboard.shouldWrite) {
			this.clearCurrentText();
			return;
		}

		if (this.currentText && !this.currentTextFinished) {
			this.currentTextFinished = true;

			let promptMessage = '';
			if (!this.editingCurrentText) {
				promptMessage = 'Enter text here:';
			} else {
				promptMessage = 'Edit text here:';
			}

			// Prompt user for text
			const content = prompt(promptMessage, this.currentText.content);

			// If user cancelled prompt, don't change text
			if (content !== null) {
				this.currentText.content = content;
			}

			// Save text
			const textOptions: WhiteboardTextOptions = {
				rotation: this.currentText.rotation,
				bounds: rectangles.serialize(this.currentText.bounds),
				content: this.currentText.content,
				font: font.serialize(this.currentText),
				style: styles.serialize(this.currentText)
			};

			if (this.editingCurrentText) {
				// We are editing existing text. Edit old on.
				const textKey = this.whiteboard.textIdToPushKey(this.currentText.id);
				this.whiteboard.whiteboardService.editText(this.whiteboard.key, textKey, textOptions)
					.subscribe(
						data => {
							// console.log('successfully edited text', data);
						},
						err => {
							console.log('edit text error', err);
						}
					);
			} else {
				// We are not editing existing text. Create new text.
				this.whiteboard.whiteboardService.createText(this.whiteboard.key, textOptions)
					.subscribe(
						data => {
							// console.log('successfully added text', data);
						},
						err => {
							console.log('add text error', err);
						}
					);
			}
		}

		// If we don't have permission to read, erase text.
		// Otherwise, it will be erased when the database responds with new data.
		if (!this.whiteboard.shouldRead) {
			this.clearCurrentText();
		}
	}

	/**
	 * Helper functions
	 */

	clearCurrentText() {
		this.currentTextFinished = true;
		// If we are editing current text, that means it's already on whiteboard and already registered in database.
		// We should not remove then.
		if (this.currentText && !this.editingCurrentText) {
			this.currentText.remove();
		}
		this.currentText = null;
	}

}
