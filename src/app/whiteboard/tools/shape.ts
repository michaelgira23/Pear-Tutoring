import { WhiteboardComponent } from './../whiteboard.component';
import { WhiteboardShape } from './../../shared/model/whiteboard.service';
declare const paper;

export class Shape {

	shapesSubscription: any;
	shapes: WhiteboardShape[];
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
			this.creationRect = new paper.Rectangle(this.startPoint, this.startPoint);
			// Create point from shadow offset
			const shadowOffsetPoint = new paper.Point(this.whiteboard.shapeOptions.shadowOffset.x, this.whiteboard.shapeOptions.shadowOffset.y);

			// Create a shape
			this.currentShapeType = this.whiteboard.shapeType;
			switch (this.currentShapeType) {
				case 'line':
				case 'arc':
					this.currentShape = new paper.Path.Line({
						// Stroke Style
						strokeColor  : this.whiteboard.shapeOptions.strokeColor,
						strokeWidth  : this.whiteboard.shapeOptions.strokeWidth,
						strokeCap    : this.whiteboard.shapeOptions.strokeCap,
						strokeJoin   : this.whiteboard.shapeOptions.strokeJoin,
						dashOffset   : this.whiteboard.shapeOptions.dashOffset,
						strokeScaling: this.whiteboard.shapeOptions.strokeScaling,
						dashArray    : this.whiteboard.shapeOptions.dashArray,
						miterLimit   : this.whiteboard.shapeOptions.miterLimit,
						// Fill Style
						fillColor    : this.whiteboard.shapeOptions.fillColor,
						// Shadow Style
						shadowColor  : this.whiteboard.shapeOptions.shadowColor,
						shadowBlur   : this.whiteboard.shapeOptions.shadowBlur,
						shadowOffset : shadowOffsetPoint,
						// Shape
						from: [this.startPoint.x, this.startPoint.y],
						to: [this.startPoint.x + 1, this.startPoint.y + 1]
					});
					break;
				case 'ellipse':
					this.currentShape = new paper.Path.Ellipse({
						// Stroke Style
						strokeColor  : this.whiteboard.shapeOptions.strokeColor,
						strokeWidth  : this.whiteboard.shapeOptions.strokeWidth,
						strokeCap    : this.whiteboard.shapeOptions.strokeCap,
						strokeJoin   : this.whiteboard.shapeOptions.strokeJoin,
						dashOffset   : this.whiteboard.shapeOptions.dashOffset,
						strokeScaling: this.whiteboard.shapeOptions.strokeScaling,
						dashArray    : this.whiteboard.shapeOptions.dashArray,
						miterLimit   : this.whiteboard.shapeOptions.miterLimit,
						// Fill Style
						fillColor    : this.whiteboard.shapeOptions.fillColor,
						// Shadow Style
						shadowColor  : this.whiteboard.shapeOptions.shadowColor,
						shadowBlur   : this.whiteboard.shapeOptions.shadowBlur,
						shadowOffset : shadowOffsetPoint,
						// Shape
						point: [this.startPoint.x, this.startPoint.y],
						radius: 1
					});
					break;
				case 'polygon':
					const polygonSides = parseInt(this.whiteboard.polygonSides, 10);
					this.currentShape = new paper.Path.RegularPolygon({
						// Stroke Style
						strokeColor  : this.whiteboard.shapeOptions.strokeColor,
						strokeWidth  : this.whiteboard.shapeOptions.strokeWidth,
						strokeCap    : this.whiteboard.shapeOptions.strokeCap,
						strokeJoin   : this.whiteboard.shapeOptions.strokeJoin,
						dashOffset   : this.whiteboard.shapeOptions.dashOffset,
						strokeScaling: this.whiteboard.shapeOptions.strokeScaling,
						dashArray    : this.whiteboard.shapeOptions.dashArray,
						miterLimit   : this.whiteboard.shapeOptions.miterLimit,
						// Fill Style
						fillColor    : this.whiteboard.shapeOptions.fillColor,
						// Shadow Style
						shadowColor  : this.whiteboard.shapeOptions.shadowColor,
						shadowBlur   : this.whiteboard.shapeOptions.shadowBlur,
						shadowOffset : shadowOffsetPoint,
						// Shape
						sides: polygonSides ? polygonSides : 4,
						radius: 1
					});
					break;
				case 'star':
					const starSides = parseInt(this.whiteboard.starSides, 10);
					const radius1 = 1;
					const radius2 = (this.whiteboard.starRadiusPercentage / 100) * radius1;
					this.currentShape = new paper.Path.Star({
						// Stroke Style
						strokeColor  : this.whiteboard.shapeOptions.strokeColor,
						strokeWidth  : this.whiteboard.shapeOptions.strokeWidth,
						strokeCap    : this.whiteboard.shapeOptions.strokeCap,
						strokeJoin   : this.whiteboard.shapeOptions.strokeJoin,
						dashOffset   : this.whiteboard.shapeOptions.dashOffset,
						strokeScaling: this.whiteboard.shapeOptions.strokeScaling,
						dashArray    : this.whiteboard.shapeOptions.dashArray,
						miterLimit   : this.whiteboard.shapeOptions.miterLimit,
						// Fill Style
						fillColor    : this.whiteboard.shapeOptions.fillColor,
						// Shadow Style
						shadowColor  : this.whiteboard.shapeOptions.shadowColor,
						shadowBlur   : this.whiteboard.shapeOptions.shadowBlur,
						shadowOffset : shadowOffsetPoint,
						// Shape
						points: starSides ? starSides : 5,
						radius1,
						radius2
					});
					break;
				default:
					console.log(`Unrecognized shape! (${this.currentShapeType})`);
			}

			this.currentShape.selected = true;
		}
	}

	mousemove(event) {
		if (this.currentShape && !this.currentShapeFinished) {
			// Check if mouse is over any of the manipulation points
			const point = this.whiteboard.cursorPoint(event);
			this.creationRect = new paper.Rectangle(this.startPoint, point);

			// Shapes will not show up anymore if their height and width are zero
			if (this.creationRect.width > 0 && this.creationRect.height > 0) {
				// Resize the shape we are currently drawing
				switch (this.currentShapeType) {
					case 'arc':
						if (this.arcPoint) {
							const secondPhaseRect = new paper.Rectangle(this.arcPoint, point);

							if (secondPhaseRect.width > 0 && secondPhaseRect.height > 0) {
								// We must create a new arc for each new set of points, otherwise the curve gets messed up
								this.currentShape.remove();
								// Create point from shadow offset
								const shadowOffsetPoint = new paper.Point(this.whiteboard.shapeOptions.shadowOffset.x, this.whiteboard.shapeOptions.shadowOffset.y);
								this.currentShape = new paper.Path.Arc({
									// Stroke Style
									strokeColor  : this.whiteboard.shapeOptions.strokeColor,
									strokeWidth  : this.whiteboard.shapeOptions.strokeWidth,
									strokeCap    : this.whiteboard.shapeOptions.strokeCap,
									strokeJoin   : this.whiteboard.shapeOptions.strokeJoin,
									dashOffset   : this.whiteboard.shapeOptions.dashOffset,
									strokeScaling: this.whiteboard.shapeOptions.strokeScaling,
									dashArray    : this.whiteboard.shapeOptions.dashArray,
									miterLimit   : this.whiteboard.shapeOptions.miterLimit,
									// Fill Style
									fillColor    : this.whiteboard.shapeOptions.fillColor,
									// Shadow Style
									shadowColor  : this.whiteboard.shapeOptions.shadowColor,
									shadowBlur   : this.whiteboard.shapeOptions.shadowBlur,
									shadowOffset : shadowOffsetPoint,
									// Shape
									from: [this.startPoint.x, this.startPoint.y],
									through: [this.arcPoint.x, this.arcPoint.y],
									to: [point.x, point.y]
								});
								this.currentShape.selected = true;
								this.visualArcPoint.bringToFront();
							}
							break;
						}

						// We want to fallthrough the 'arc' case because the first phase is treated the exact same as a line
						// tslint:disable-next-line
					case 'line':

						const segmentsLength = this.currentShape.segments.length;

						this.currentShape.insert(segmentsLength - 1, point);
						this.currentShape.removeSegment(segmentsLength - 2);
						break;
					default:
						// If holding shift key, maintain aspect ratio
						console.log('move shape bounds');
						if (this.whiteboard.shiftKey) {
							this.currentShape.fitBounds(this.creationRect, true);
						} else {
							this.currentShape.bounds = this.creationRect;
						}
				}

				// If there isn't a visual box, create one
				if (!this.visualRect) {
					this.visualRect = new paper.Path.Rectangle(this.creationRect);
					this.visualRect.strokeColor = '#08f';
					this.visualRect.dashArray = [10, 5];
				}
				this.visualRect.bounds = this.creationRect;
			}
		}
	}

	mouseup(event) {
		if (this.creationRect.width > 0 && this.creationRect.height > 0) {
			// Check if we just finished the first part of the arc
			if (this.currentShapeType === 'arc' && !this.arcPoint) {
				this.arcPoint = this.whiteboard.cursorPoint(event);

				// Visualize this arc point on the canvas
				this.visualArcPoint = new paper.Shape.Circle({
					strokeColor: this.whiteboard.shapeOptions.strokeColor,
					fillColor  : this.whiteboard.shapeOptions.fillColor,
					center: [this.arcPoint.x, this.arcPoint.y],
					radius: 5
				});

				// Create point from shadow offset
				const shadowOffsetPoint = new paper.Point(this.whiteboard.shapeOptions.shadowOffset.x, this.whiteboard.shapeOptions.shadowOffset.y);

				// Remove the current line for the first phase of the arc, and add an actual arc for the next mousedown
				this.currentShape.remove();
				this.currentShape = new paper.Path.Arc({
					// Stroke Style
					strokeColor  : this.whiteboard.shapeOptions.strokeColor,
					strokeWidth  : this.whiteboard.shapeOptions.strokeWidth,
					strokeCap    : this.whiteboard.shapeOptions.strokeCap,
					strokeJoin   : this.whiteboard.shapeOptions.strokeJoin,
					dashOffset   : this.whiteboard.shapeOptions.dashOffset,
					strokeScaling: this.whiteboard.shapeOptions.strokeScaling,
					dashArray    : this.whiteboard.shapeOptions.dashArray,
					miterLimit   : this.whiteboard.shapeOptions.miterLimit,
					// Fill Style
					fillColor    : this.whiteboard.shapeOptions.fillColor,
					// Shadow Style
					shadowColor  : this.whiteboard.shapeOptions.shadowColor,
					shadowBlur   : this.whiteboard.shapeOptions.shadowBlur,
					shadowOffset : shadowOffsetPoint,
					// Shape
					from: [this.startPoint.x, this.startPoint.y],
					through: [this.arcPoint.x, this.arcPoint.y],
					to: [this.arcPoint.x + 1, this.arcPoint.y + 1]
				});
				return;
			}

			// Finish drawing shape
			this.currentShapeFinished = true;
			this.currentShape.selected = false;
			this.visualRect.remove();
			this.visualRect = null;

			// Clean up arc stuff
			this.arcPoint = null;
			if (this.visualArcPoint) {
				this.visualArcPoint.remove();
				this.visualArcPoint = null;
			}
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
