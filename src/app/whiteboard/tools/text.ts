import { WhiteboardComponent } from './../whiteboard.component';
import { WhiteboardText, Position, Point } from './../../shared/model/whiteboard.service';

declare const paper;

export class Text {

	textsSubscription: any;
	texts: WhiteboardText[];
	// paper.js point text objects on the whiteboard
	canvasText: any = {};

	selectedText: any;
	// Whether or not to create or edit text on mouseup
	editExisting: boolean = false;

	constructor(private whiteboard: WhiteboardComponent) { }

	/**
	 * Event handlers
	 */

	mousedown(event) {
		const point = this.whiteboard.cursorPoint(event);
		const hit = paper.project.hitTest(point, {
			class: paper.PointText,
			fill: true,
			stroke: true,
			segments: true,
			bounds: true
		});

		console.log(hit);

		let key = null;

		if (hit) {
			key = this.textIdToPushKey(hit.item.id);

			if (key) {
				console.log('select existing text');
				this.editExisting = true;
				this.selectedText = this.canvasText[key];
			}
		}

		if (!key) {
			// Create new text
			console.log('create new text');
			this.editExisting = false;
			this.selectedText = new paper.PointText({
				content: 'TEXT',
				point: point,
				fillColor: 'black',
				fontSize: '2.5em',
				fontWeight: 600
			});
		}

		console.log(this.selectedText);

		this.deselectAllText();
		this.selectedText.selected = true;
	}

	mousemove(event) {
		if (this.selectedText && this.whiteboard.mouseDown) {
			// Check if mouse is over any of the manipulation points
			const point = this.whiteboard.cursorPoint(event);
			const hit = this.selectedText.hitTest(point, {
				tolerance: 1000,
				fill: true,
				stroke: true,
				segments: true,
				bounds: true
			});

			console.log(Date.now(), hit);

			if (hit) {
				// If dragging one of the text corners, move selected text
				this.selectedText.point = point;
			}
		}
	}

	mouseup(event) {
		if (this.selectedText && this.whiteboard.allowWrite) {
			console.log('mouseup', this.selectedText);

			// Convert points into objects for database
			const anchor: Point = {
				x: this.selectedText.point.x,
				y: this.selectedText.point.y
			};
			const positionPosition: Point = {
				x: this.selectedText.position.x,
				y: this.selectedText.position.y
			};
			const scaling: Point = {
				x: this.selectedText.scaling.x,
				y: this.selectedText.scaling.y
			};

			const position: Position = {
				anchor,
				position: positionPosition,
				rotation: this.selectedText.rotation,
				scaling
			};

			if (this.editExisting) {
				// Modify existing text in database
				const pushKey = this.textIdToPushKey(this.selectedText.id);
				this.whiteboard.whiteboardService.editText(
					this.whiteboard.key, pushKey, this.selectedText.content, this.whiteboard.textOptions, position)
					.subscribe(
						data => {
							console.log('successfully editted text', data);
						},
						err => {
							console.log('edit text error', err);
						}
					);
			} else {
				// Create new text in database
				this.whiteboard.whiteboardService.createText(
					this.whiteboard.key, this.selectedText.content, this.whiteboard.textOptions, position)
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

				const shadowOffsetPoint = new paper.Point(text.options.shadowOffset.x, text.options.shadowOffset.y);
				const path = new paper.PointText({
					content: text.content,
					// Stroke Style
					strokeColor  : text.options.strokeColor,
					strokeWidth  : text.options.strokeWidth,
					strokeCap    : text.options.strokeCap,
					strokeJoin   : text.options.strokeJoin,
					dashOffset   : text.options.dashOffset,
					strokeScaling: text.options.strokeScaling,
					dashArray    : text.options.dashArray,
					miterLimit   : text.options.miterLimit,
					// Fill Style
					fillColor    : text.options.fillColor,
					// Shadow Style
					shadowColor  : text.options.shadowColor,
					shadowBlur   : text.options.shadowBlur,
					shadowOffset : shadowOffsetPoint,
					// Character Style
					fontFamily   : text.options.fontFamily,
					fontWeight   : text.options.fontWeight,
					fontSize     : text.options.fontSize,
					// Position
					point        : new paper.Point(text.position.anchor.x, text.position.anchor.y),
					position     : new paper.Point(text.position.position.x, text.position.position.y),
					rotation     : text.position.rotation,
					scaling      : new paper.Point(text.position.scaling.x, text.position.scaling.y),
				});

				this.canvasText[text.$key] = path;
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
