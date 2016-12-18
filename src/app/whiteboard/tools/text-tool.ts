import {Point} from '../../shared/model/whiteboard.service';

declare const paper;

export class TextTool {

	whiteboard: any;

	constructor(whiteboard: any) {
		this.whiteboard = whiteboard;
	}

	mousedown(event, point) {
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
			key = this.whiteboard.textIdToPushKey(hit.item.id);

			if (key) {
				console.log('select existing text');
				this.whiteboard.editExisting = true;
				this.whiteboard.selectedText = this.whiteboard.canvasText[key];
			}
		}

		if (!key) {
			// Create new text
			console.log('create new text');
			this.whiteboard.editExisting = false;
			this.whiteboard.selectedText = new paper.PointText({
				content: 'TEXT',
				point: point,
				fillColor: 'black',
				fontSize: '2.5em',
				fontWeight: 600
			});
		}

		console.log(this.whiteboard.selectedText);

		this.whiteboard.deselectAllText();
		this.whiteboard.selectedText.selected = true;
	}
			
	mousemove(event, point) {
		if (this.whiteboard.selectedText && this.whiteboard.mouseDown) {
			// Check if mouse is over any of the manipulation points
			const point = this.whiteboard.cursorPoint(event);
			const hit = this.whiteboard.selectedText.hitTest(point, {
				tolerance: 1000,
				fill: true,
				stroke: true,
				segments: true,
				bounds: true
			});

			console.log(Date.now(), hit);

			if (hit) {
				// If dragging one of the text corners, move selected text
				this.whiteboard.selectedText.point = point;
			}
		}
	}

	mouseup(event, point) {
		if (this.whiteboard.selectedText && this.whiteboard.allowWrite) {
			console.log('mouseup', this.whiteboard.selectedText);

			// Convert points into objects for database
			const anchor = {
				x: this.whiteboard.selectedText.point.x,
				y: this.whiteboard.selectedText.point.y
			};
			const positionPosition = {
				x: this.whiteboard.selectedText.position.x,
				y: this.whiteboard.selectedText.position.y
			};
			const scaling = {
				x: this.whiteboard.selectedText.scaling.x,
				y: this.whiteboard.selectedText.scaling.y
			};

			const position = {
				anchor,
				position: positionPosition,
				rotation: this.whiteboard.selectedText.rotation,
				scaling
			};

			if (this.whiteboard.editExisting) {
				// Modify existing text in database
				const pushKey = this.whiteboard.textIdToPushKey(this.whiteboard.selectedText.id);
				this.whiteboard.whiteboardService.editText(this.whiteboard.key, pushKey, this.whiteboard.selectedText.content, this.whiteboard.textOptions, position)
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
				this.whiteboard.whiteboardService.createText(this.whiteboard.key, this.whiteboard.selectedText.content, this.whiteboard.textOptions, position)
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
		this.whiteboard.deselectAllText();
	}
}