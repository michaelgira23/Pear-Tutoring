import { WhiteboardComponent } from './../whiteboard.component';
import { WhiteboardShape } from './../../shared/model/whiteboard.service';
declare const paper;

export class Shape {

	shapesSubscription: any;
	shapes: WhiteboardShape[];
	// paper.js shape objects on the whiteboard
	canvasShapes: any = {};

	selectedShape: any;

	constructor(private whiteboard: WhiteboardComponent) { }

	/**
	 * Event handlers
	 */

	mousedown(event) {
		const point = this.whiteboard.cursorPoint(event);
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
				this.selectedShape = this.canvasShapes[key];
			}
		}

		if (!key) {
			// Create new text
			this.selectedShape = new paper.PointText({
				content: 'TEXT',
				point: point,
				fillColor: 'black',
				fontSize: '2.5em',
				fontWeight: 600
			});
		}

		this.deselectAllShapes();
		this.selectedShape.selected = true;
	}

	mousemove(event) {
		if (this.selectedShape && this.whiteboard.mouseDown) {
			// Check if mouse is over any of the manipulation points
			const point = this.whiteboard.cursorPoint(event);
			const hit = this.selectedShape.hitTest(point, {
				tolerance: 1000,
				fill: true,
				stroke: true,
				segments: true,
				bounds: true
			});

			console.log(Date.now(), hit);

			if (hit) {
				// If dragging one of the text corners, move selected text
				this.selectedShape.point = point;
			}
		}
	}

	mouseup(event) {
		if (this.selectedShape) {
			// @TODO Insert properly formatted shape data into whiteboard service

			// this.whiteboard.whiteboardService.createShape(this.whiteboard.key, this.whiteboard.shapeOptions)
			// 	.subscribe(
			// 		data => {
			// 			console.log('successfully added text', data);
			// 		},
			// 		err => {
			// 			console.log('add text error', err);
			// 		}
			// 	);
		}
	}

	toolchange(nextTool) {
		this.deselectAllShapes();
	}

	/**
	 * Helper functions
	 */

	shapesToCanvas(shapes) {
		console.log('shapes to canvas', shapes);
		this.clearShapes();

		// Loop through shapes and add to canvas
		shapes.forEach(shape => {

			// Make sure shape isn't erased
			if (!shape.erased) {

				const shadowOffsetPoint = new paper.Point(shape.options.shadowOffset.x, shape.options.shadowOffset.y);
				const shapeOptions = {
					// Stroke Style
					strokeColor  : shape.options.strokeColor,
					strokeWidth  : shape.options.strokeWidth,
					strokeCap    : shape.options.strokeCap,
					strokeJoin   : shape.options.strokeJoin,
					dashOffset   : shape.options.dashOffset,
					strokeScaling: shape.options.strokeScaling,
					dashArray    : shape.options.dashArray,
					miterLimit   : shape.options.miterLimit,
					// Fill Style
					fillColor    : shape.options.fillColor,
					// Shadow Style
					shadowColor  : shape.options.shadowColor,
					shadowBlur   : shape.options.shadowBlur,
					shadowOffset : shadowOffsetPoint
				};

				switch (shape.type) {
					case 'circle':
						this.canvasShapes[shape.$key] = new paper.Shape.Circle(shapeOptions);
						break;
					case 'rectangle':
						this.canvasShapes[shape.$key] = new paper.Shape.Rectangle(shapeOptions);
						break;
					case 'ellipse':
						this.canvasShapes[shape.$key] = new paper.Shape.Ellipse(shapeOptions);
						break;
					default:
						console.log('Unrecognized shape!', shape.type);
				}
			}
		});
	}

	clearShapes() {
		// Erase current canvas markings if they exist
		if (this.shapes) {
			const shapeKeys = Object.keys(this.canvasShapes);
			shapeKeys.forEach(key => {
				this.canvasShapes[key].remove();
				delete this.canvasShapes[key];
			});
		}
	}

	deselectAllShapes() {
		const shapeKeys = Object.keys(this.canvasShapes);
		shapeKeys.forEach(key => {
			this.canvasShapes[key].selected = false;
		});
	}

	shapeIdToPushKey(id) {
		const shapeKeys = Object.keys(this.canvasShapes);
		for (let i = 0; i < shapeKeys.length; i++) {
			const shape = this.canvasShapes[shapeKeys[i]];
			if (shape.id === id) {
				return shapeKeys[i];
			}
		}
		return null;
	}
}
