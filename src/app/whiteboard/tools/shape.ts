import { WhiteboardComponent } from '../whiteboard.component';
import { WhiteboardAnyShape,
	WhiteboardLine,
	WhiteboardArc,
	WhiteboardEllipse,
	WhiteboardPolygon,
	WhiteboardStar } from '../../shared/model/whiteboard';
declare const paper;

export class Shape {

	shapesSubscription: any;
	shapes: WhiteboardAnyShape[];
	// paper.js shape objects on the whiteboard
	canvasShapes: any = {};

	// Shape currently being drawn
	currentShape: any;
	// Type of shape currently being drawn
	currentShapeType: string;
	// If shape is currently being drawn
	currentShapeFinished: boolean = true;
	// Point upon mousedown
	startPoint: any;
	// Point mouse is currently at
	currentPoint: any;
	// 'through' point of arc
	arcPoint: any;
	// Actual arc point object on canvas
	visualArcPoint: any;
	// Rectangle from mouse down to mouse move/up
	creationRect: any;
	// Ghost rectangle for visualizing shape creation
	visualRect: any;

	constructor(private whiteboard: WhiteboardComponent) { }

	/**
	 * Event handlers
	 */

	mousedown(event) {
		if (this.currentShapeFinished) {
			this.currentShapeFinished = false;
			this.startPoint = this.whiteboard.cursorPoint(event);
			// Create a rectangle for the shape bounds
			this.creationRect = this.getRect(this.startPoint, this.startPoint, this.whiteboard.shiftKey);

			// Create point from shadow offset
			let paperOptions = this.whiteboard.styleObjectToPaperObject(this.whiteboard.styleOptions);

			// Create a shape
			this.currentShapeType = this.whiteboard.shapeType;
			switch (this.currentShapeType) {
				case 'line':
				case 'arc':
					paperOptions.from = [this.startPoint.x, this.startPoint.y];
					paperOptions.to = [this.startPoint.x + 1, this.startPoint.y + 1];
					this.currentShape = new paper.Path.Line(paperOptions);
					break;
				case 'ellipse':
					paperOptions.point = [this.startPoint.x, this.startPoint.y];
					paperOptions.radius = 1;
					this.currentShape = new paper.Path.Ellipse(paperOptions);
					break;
				case 'polygon':
					const polygonSides = parseInt(this.whiteboard.polygonSides, 10);
					paperOptions.sides = polygonSides ? polygonSides : 4;
					paperOptions.radius = 1;
					this.currentShape = new paper.Path.RegularPolygon(paperOptions);
					break;
				case 'star':
					const starPoints = parseInt(this.whiteboard.starPoints, 10);
					paperOptions.points = starPoints ? starPoints : 5;
					paperOptions.radius1 = 1;
					paperOptions.radius2 = (this.whiteboard.starRadiusPercentage / 100) * paperOptions.radius1;
					this.currentShape = new paper.Path.Star(paperOptions);
					break;
				default:
					console.log(`Unrecognized shape! (${this.currentShapeType})`);
			}

			this.currentShape.selected = true;
		}
	}

	mousemove(event) {
		if (!this.currentShapeFinished) {
			this.currentPoint = this.whiteboard.cursorPoint(event);
			this.resizeCurrentShape(this.currentPoint);
		}
	}

	mouseup(event) {
		if ((this.creationRect.width > 0 && this.creationRect.height > 0)
			// If shapeType is line or arc, either width or height can be 0
			|| ((this.currentShapeType === 'line' || this.currentShapeType === 'arc')
				&& (this.creationRect.width > 0 || this.creationRect.height > 0))) {

			// Check if we just finished the first part of the arc
			if (this.currentShapeType === 'arc' && !this.arcPoint) {
				this.arcPoint = this.getFarthestPoint(this.creationRect, this.startPoint);

				// Visualize this arc point on the canvas
				this.visualArcPoint = new paper.Shape.Circle({
					strokeColor: this.whiteboard.styleOptions.stroke.color,
					fillColor  : this.whiteboard.styleOptions.fill.color,
					center: [this.arcPoint.x, this.arcPoint.y],
					radius: 5
				});

				// Create options for arc
				let paperOptions = this.whiteboard.styleObjectToPaperObject(this.whiteboard.styleOptions);
				paperOptions.from = [this.startPoint.x, this.startPoint.y];
				paperOptions.through = [this.arcPoint.x, this.arcPoint.y];
				paperOptions.to = [this.arcPoint.x + 1, this.arcPoint.y + 1];

				// Remove the current line for the first phase of the arc, and add an actual arc for the next mousedown
				this.currentShape.remove();
				this.currentShape = new paper.Path.Arc(paperOptions);

				// We just converted the first phase of an arc into an actual arc. Alas, there is more to be done!
				return;
			}

			// Finish drawing shape
			this.currentShapeFinished = true;
			this.currentShape.selected = false;
			if (this.visualRect) {
				this.visualRect.remove();
			}
			this.visualRect = null;

			// Clean up arc stuff
			this.arcPoint = null;
			if (this.visualArcPoint) {
				this.visualArcPoint.remove();
				this.visualArcPoint = null;
			}

			// Save shape
			// let shape = {
			//
			// };
		}
		/*
		if (this.selectedShape && this.whiteboard.allowWrite) {
			const positionPosition: Point = {
				x: this.selectedShape.position.x,
				y: this.selectedShape.position.y
			};
			const scaling: Point = {
				x: this.selectedShape.scaling.x,
				y: this.selectedShape.scaling.y
			};

			const position: Position = {
				position: positionPosition,
				rotation: this.selectedShape.rotation,
				scaling
			};

			const size: Size = {
				width: this.selectedShape.size.width,
				height: this.selectedShape.size.height
			};

			let radius: number | Size;
			if (typeof this.selectedShape.radius === 'number') {
				radius = this.selectedShape.radius;
			} else {
				radius = {
					width: this.selectedShape.radius.width,
					height: this.selectedShape.radius.height
				};
			}

			this.whiteboard.whiteboardService.createShape(
				this.whiteboard.key,
				this.whiteboard.shapeType,
				this.whiteboard.shapeOptions,
				position,
				size,
				radius)
				.subscribe(
					data => {
						console.log('successfully added text', data);
					},
					err => {
						console.log('add text error', err);
					}
				);
		}*/
	}

	toolchange(nextTool) {
		this.deselectAllShapes();
	}

	modifierKey(event: KeyboardEvent) {
		if (!this.currentShapeFinished) {
			this.resizeCurrentShape(this.currentPoint);
		}
	}

	/**
	 * Helper functions
	 */

	resizeCurrentShape(point) {
		if (this.currentShape) {
			this.creationRect = this.getRect(this.startPoint, point, this.whiteboard.shiftKey);

			// Shapes will not show up anymore if their height and width are zero
			if (this.creationRect.width > 0 && this.creationRect.height > 0) {
				// Resize the shape we are currently drawing
				switch (this.currentShapeType) {
					case 'arc':
						// Check if we are on the second phase of the arc
						if (this.arcPoint) {
							let secondPhaseRect = this.getRect(this.arcPoint, point, this.whiteboard.shiftKey);

							// Calculate the third point on the arc
							let linePoint = null;
							if (this.whiteboard.shiftKey) {
								linePoint = this.roundLinePoint(this.arcPoint, point);
								secondPhaseRect = new paper.Rectangle(this.arcPoint, linePoint);
							} else {
								linePoint = this.getFarthestPoint(secondPhaseRect, this.arcPoint);
							}

							// Check if current point has moved from the second point of arc
							if (secondPhaseRect.width > 0 || secondPhaseRect.height > 0) {
								// Create paper options for the arc
								let paperOptions = this.whiteboard.styleObjectToPaperObject(this.whiteboard.styleOptions);
								paperOptions.from = [this.startPoint.x, this.startPoint.y];
								paperOptions.through = [this.arcPoint.x, this.arcPoint.y];
								paperOptions.to = [linePoint.x, linePoint.y];

								// We must create a new arc for each new set of points, otherwise the curve gets messed up
								this.currentShape.remove();
								this.currentShape = new paper.Path.Arc(paperOptions);
								this.currentShape.selected = true;

								// We need some visuals!
								this.ensureVisualRect(secondPhaseRect);
								// Make sure arc point is showing
								this.visualArcPoint.bringToFront();
							}
							break;
						}

						// We want to fallthrough the 'arc' case because the first phase is treated the exact same as a line
						// tslint:disable-next-line
					case 'line':

						const segmentsLength = this.currentShape.segments.length;
						// Point to send line to
						let linePoint = null;
						if (this.whiteboard.shiftKey) {
							linePoint = this.roundLinePoint(this.startPoint, point);
							this.creationRect = new paper.Rectangle(this.startPoint, linePoint);
						} else {
							linePoint = this.getFarthestPoint(this.creationRect, this.startPoint);
						}
						this.currentShape.insert(segmentsLength - 1, linePoint);
						this.currentShape.removeSegment(segmentsLength - 2);

						// Close your eyes - imagine the rectangle
						this.ensureVisualRect(this.creationRect);
						break;
					default:
						this.currentShape.bounds = this.creationRect;
						this.ensureVisualRect(this.creationRect);
				}
			}
		}
	}

	shapesToCanvas(shapes: WhiteboardAnyShape[]) {
		console.log('shapes to canvas', shapes);
		this.clearShapes();

		// Loop through shapes and add to canvas
		shapes.forEach(shape => {

			// Make sure shape isn't erased
			if (!shape.erased) {

				let paperOptions = this.whiteboard.styleObjectToPaperObject(shape.style);

				switch (shape.type) {
					case 'line':
						// Add shape-specific options
						paperOptions.from = [(<WhiteboardLine>shape).data.from.x, (<WhiteboardLine>shape).data.from.y];
						paperOptions.to = [(<WhiteboardLine>shape).data.to.x, (<WhiteboardLine>shape).data.to.y];
						// Create line
						this.canvasShapes[shape.$key] = new paper.Shape.Line(paperOptions);
						break;
					case 'arc':
						// Add shape-specific options
						paperOptions.from = [(<WhiteboardArc>shape).data.from.x, (<WhiteboardArc>shape).data.from.y];
						paperOptions.through = [(<WhiteboardArc>shape).data.through.x, (<WhiteboardArc>shape).data.through.y];
						paperOptions.to = [(<WhiteboardArc>shape).data.to.x, (<WhiteboardArc>shape).data.to.y];
						// Create arc
						this.canvasShapes[shape.$key] = new paper.Shape.Arc(paperOptions);
						break;
					case 'ellipse':
						// Tell TypeScript we're dealing with an 'ellipse' type
						shape = <WhiteboardEllipse>shape;
						// Add shape-specific options
						paperOptions.point = [(<WhiteboardEllipse>shape).position.anchor.x, (<WhiteboardEllipse>shape).position.anchor.y];
						paperOptions.radius = (<WhiteboardEllipse>shape).data.radius;
						// Create ellipse
						this.canvasShapes[shape.$key] = new paper.Shape.Ellipse(paperOptions);
						break;
					case 'polygon':
						// Add shape-specific options
						paperOptions.sides = (<WhiteboardPolygon>shape).data.sides;
						paperOptions.radius = (<WhiteboardPolygon>shape).data.radius;
						// Create polygon
						this.canvasShapes[shape.$key] = new paper.Shape.RegularPolygon(paperOptions);
						break;
					case 'star':
						// Tell TypeScript we're dealing with a 'star' type
						shape = <WhiteboardStar>shape;
						// Add shape-specific options
						paperOptions.points = (<WhiteboardStar>shape).data.points;
						paperOptions.radius1 = (<WhiteboardStar>shape).data.radius1;
						paperOptions.radius2 = (<WhiteboardStar>shape).data.radius2;
						// Create a star
						this.canvasShapes[shape.$key] = new paper.Shape.Star(paperOptions);
						break;
					default:
						console.log(`Unrecognized shape! (${shape.type})`);
				}
			}
		});
	}

	roundLinePoint(startPoint, currentPoint) {
		// When holding shift, lines may also be rounded to straightly vertical or horizontal
		const vector = new paper.Point(currentPoint.x - startPoint.x, currentPoint.y - startPoint.y);
		const angle = vector.getAngle();

		// Round angle to nearest multiple of 45
		const roundMultiple = 45;
		const roundedAngle = -Math.ceil((angle - (roundMultiple / 2)) / roundMultiple) * roundMultiple;

		// Now find what point is along a squared rectangle with the rounded angle
		const square = this.getRect(startPoint, currentPoint, true);
		// Find the farthest point
		const farthest = this.getFarthestPoint(square, startPoint);
		// Mirror farthest point across startPoint, to get bigger rect surrounding whole startPoint
		const oppositeX = -(farthest.x - startPoint.x) + startPoint.x;
		const oppositeY = -(farthest.y - startPoint.y) + startPoint.y;
		const opposite = new paper.Point(oppositeX, oppositeY);
		// Create big rectangle that surrounds whole center
		const bigSquare = new paper.Rectangle(farthest, opposite);

		return this.edgeOfRect(bigSquare, roundedAngle);
	}

	getRect(fromPoint, toPoint, square = false) {
		// Return a paper.js rectangle with two points.
		// If square is true, will square off the rect using largest side
		const rect = new paper.Rectangle(fromPoint, toPoint);

		if (square) {
			// Find dimensions of square (largest side of two)
			const squareSide = Math.max(rect.width, rect.height);
			// Find x and y of this square point
			const squareX = (squareSide * Math.sign(toPoint.x - fromPoint.x)) + fromPoint.x;
			const squareY = (squareSide * Math.sign(toPoint.y - fromPoint.y)) + fromPoint.y;
			const squareToPoint = new paper.Point(squareX, squareY);

			return new paper.Rectangle(fromPoint, squareToPoint);
		}

		return rect;
	}

	getFarthestPoint(rect, point) {
		// Find the farthest point on a rectangle from a specific point
		const sides = [
			'topLeft',
			'topRight',
			'bottomLeft',
			'bottomRight'
		];

		let lengths = [];
		let farthest = null;

		sides.forEach(corner => {
			const distance = point.getDistance(rect[corner]);

			// Check if distance is farthest distance so far
			let isFarthest = true;
			lengths.forEach(length => {
				if (distance < length) {
					isFarthest = false;
				}
			});
			if (isFarthest) {
				farthest = corner;
			}

			lengths.push(distance);
		});

		return rect[farthest];
	}

	edgeOfRect(rect, deg) {
		// Gets the intersection of perimeter of rectangle, given angle from center
		// http://stackoverflow.com/a/4062485/4594858
		const twoPI = Math.PI * 2;
		let theta = (deg * Math.PI) / 180;

		while (theta < -Math.PI) {
			theta += twoPI;
		}

		while (theta > Math.PI) {
			theta -= twoPI;
		}

		const rectAtan = Math.atan2(rect.height, rect.width);
		const tanTheta = Math.tan(theta);
		let region;

		if ((theta > -rectAtan) && (theta <= rectAtan)) {
			region = 1;
		} else if ((theta > rectAtan) && (theta <= (Math.PI - rectAtan))) {
			region = 2;
		} else if ((theta > (Math.PI - rectAtan)) || (theta <= -(Math.PI - rectAtan))) {
			region = 3;
		} else {
			region = 4;
		}

		const edgePoint = rect.center.clone();
		let xFactor = 1;
		let yFactor = 1;

		switch (region) {
			case 1: yFactor = -1; break;
			case 2: yFactor = -1; break;
			case 3: xFactor = -1; break;
			case 4: xFactor = -1; break;
		}

		if ((region === 1) || (region === 3)) {
			edgePoint.x += xFactor * (rect.width / 2);
			edgePoint.y += yFactor * (rect.width / 2) * tanTheta;
		} else {
			edgePoint.x += xFactor * (rect.height / (2 * tanTheta));
			edgePoint.y += yFactor * (rect.height /  2);
		}

		return edgePoint;
	}

	ensureVisualRect(bounds) {
		// Make sure bounds have dimensions
		if (bounds.width > 0 && bounds.height > 0) {
			// If there isn't already a visual rectangle, create one
			if (!this.visualRect) {
				this.visualRect = new paper.Path.Rectangle(bounds);
				this.visualRect.strokeColor = '#08f';
				this.visualRect.dashArray = [10, 5];
			}
			this.visualRect.bounds = this.creationRect;
		} else if (this.visualRect) {
			// One of the bounds is 0, so remove the current visual rectangle
			this.visualRect.remove();
			this.visualRect = null;
		}
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
