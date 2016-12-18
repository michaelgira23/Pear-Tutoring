import {Point} from '../../shared/model/whiteboard.service';

declare const paper;

export class Shape {

	whiteboard: any;

	constructor(parentWhiteboard: any) {
		this.whiteboard = parentWhiteboard;
	}

	/**
	* Events
	*/

	mousedown(event, point) {
		const hit = paper.project.hitTest(point, {
			tolerance: 1000,
			class: paper.Shape,
			fill: true,
			stroke: true,
			segments: true,
			bounds: true
		});

		console.log(hit);

		let key = null;

		if (hit) {
			key = this.shapeIdToPushKey(hit.item.id);

			if (key) {
				this.whiteboard.selectedShape = this.whiteboard.canvasShapes[key];
			}
		}

		if (!key) {
			// Create new text
			this.whiteboard.selectedText = new paper.PointText({
				content: 'TEXT',
				point: point,
				fillColor: 'black',
				fontSize: '2.5em',
				fontWeight: 600
			});
		}

		this.deselectAllShapes();
		this.whiteboard.selectedText.selected = true;
	}

	mousemove(event, point) {
		if (this.whiteboard.selectedText && this.whiteboard.mouseDown) {
			// Check if mouse is over any of the manipulation points
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
		if (this.whiteboard.selectedText) {
			this.whiteboard.whiteboardService.createShape(this.whiteboard.key, this.whiteboard.selectedText.content, this.whiteboard.textOptions)
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
		this.deselectAllShapes();
	}

	/**
	* Helper functions
	*/


	deselectAllShapes() {
		const shapeKeys = Object.keys(this.whiteboard.canvasShapes);
		shapeKeys.forEach(key => {
			this.whiteboard.canvasShapes[key].selected = false;
		});
	}

	shapeIdToPushKey(id) {
		const shapeKeys = Object.keys(this.whiteboard.canvasShapes);
		for (let i = 0; i < shapeKeys.length; i++) {
			const shape = this.whiteboard.canvasShapes[shapeKeys[i]];
			if (shape.id === id) {
				return shapeKeys[i];
			}
		}
		return null;
	}
}