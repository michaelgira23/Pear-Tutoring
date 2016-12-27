import { WhiteboardComponent } from './../whiteboard.component';
import { WhiteboardText, WhiteboardTextOptions, Position } from './../../shared/model/whiteboard';

declare const paper;

export class Text {

	textsSubscription: any;
	texts: WhiteboardText[];
	// paper.js point text objects on the whiteboard
	canvasText: any = {};

	selectedText: any;
	selectedTextFinished: boolean = true;

	constructor(private whiteboard: WhiteboardComponent) { }

	/**
	 * Event handlers
	 */

	mousedown(event) {
		const point = this.whiteboard.cursorPoint(event);
		this.selectedTextFinished = false;
		this.selectedText = new paper.PointText({
			content: 'TEXT',
			point: point,
			fillColor: 'black',
			fontSize: '2.5em',
			fontWeight: 600
		});
	}

	mousemove(event) {
		if (this.selectedText && !this.selectedTextFinished) {
			const point = this.whiteboard.cursorPoint(event);
			this.selectedText.point = point;
		}
	}

	mouseup(event) {
		if (this.selectedText && this.whiteboard.allowWrite) {
			this.selectedTextFinished = true;
			this.selectedText.content = prompt('Enter text here:', 'TEXT');
			// Create new text in database
			const position: Position = {
				anchor: {
					x: this.selectedText.point.x,
					y: this.selectedText.point.y
				},
				rotation: this.selectedText.rotation,
				scaling: {
					x: this.selectedText.scaling.x,
					y: this.selectedText.scaling.y
				}
			};
			const text: WhiteboardTextOptions = {
				content: this.selectedText.content,
				font: this.whiteboard.fontOptions,
				position,
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

	toolchange(nextTool) {
		this.deselectAllText();
	}

	/**
	 * Helper functions
	 */

	textsToCanvas(texts: WhiteboardText[]) {
		console.log('texts to canvas', texts);
		this.clearText();

		// Loop through texts and add to canvas
		texts.forEach(text => {

			// Make sure text isn't erased
			if (!text.erased) {

				let paperOptions = this.whiteboard.styleObjectToPaperObject(text.style);
				paperOptions.content = text.content;
				// Add font properties
				paperOptions = Object.assign(paperOptions, this.whiteboard.fontObjectToPaperObject(text.font));

				// Position
				paperOptions.point = new paper.Point(text.position.anchor.x, text.position.anchor.y);
				paperOptions.rotation = text.position.rotation;
				paperOptions.scaling = new paper.Point(text.position.scaling.x, text.position.scaling.y);

				this.canvasText[text.$key] = new paper.PointText(paperOptions);
			}
		});
	}

	clearText() {
		// Erase current canvas markings if they exist
		if (this.texts) {
			const textKeys = Object.keys(this.canvasText);
			textKeys.forEach(key => {
				this.canvasText[key].remove();
				delete this.canvasText[key];
			});
		}

		// Erase current text too, if it isn't in the process of being created
		if (this.selectedTextFinished && this.selectedText) {
			this.selectedText.remove();
		}
	}

	deselectAllText() {
		const textKeys = Object.keys(this.canvasText);
		textKeys.forEach(key => {
			this.canvasText[key].selected = false;
		});
	}

	textIdToPushKey(id) {
		const textKeys = Object.keys(this.canvasText);
		for (let i = 0; i < textKeys.length; i++) {
			const text = this.canvasText[textKeys[i]];
			if (text.id === id) {
				return textKeys[i];
			}
		}
		return null;
	}
}
