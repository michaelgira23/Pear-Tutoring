import { segments, styles } from '../utils/serialization';
import * as snapRounding from '../utils/snap-rounding';
import { WhiteboardMarkingOptions, WhiteboardShapeType } from '../../shared/model/whiteboard';
import { WhiteboardComponent } from '../whiteboard.component';
declare const paper;

export class Shape {

	// For toolbar
	toolbarShowStyles = true;
	toolbarShowShapes = true;

	currentShape: any;
	currentShapeType: WhiteboardShapeType;
	currentShapeStarted: number;
	currentShapeFinished: boolean = true;

	// Point upon mousedown
	startPoint: any;
	// Point mouse is currently at
	currentPoint: any;
	// 'through' point of arc
	arcPoint: any;
	// Actual arc point object on canvas
	visualArcPoint: any;

	// Rectangle from mouse down to mouse move/up (not paper.path.Rectangle!)
	creationRect: any;
	// Ghost rectangle path for visualizing shape creation (not paper.Rectangle!)
	visualRect: any;

	constructor(private whiteboard: WhiteboardComponent) { }

	/**
	 * Event handlers
	 */

	mousedown(event) {
		// If no permissions, delete current shape
		if (!this.whiteboard.shouldWrite) {
			this.clearCurrentShape();
			return;
		}

		if (this.currentShapeFinished) {
			this.currentShapeFinished = false;
			this.currentShapeStarted = Date.now();
			this.startPoint = this.whiteboard.cursorPoint(event);

			// Create a rectangle for the shape bounds
			this.creationRect = snapRounding.getRect(this.startPoint, this.startPoint, this.whiteboard.shiftKey ? 1 : false);

			// Create point from shadow offset
			let paperOptions = styles.deserialize(this.whiteboard.styleOptions);

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
					// Default to custom shape
					paperOptions.segments = [this.whiteboard.cursorPoint(event)];
					this.currentShape = new paper.Path(paperOptions);
			}

			this.currentShape.selected = true;
		} else if (this.currentShape) {
			this.currentPoint = this.whiteboard.cursorPoint(event);
			this.resizeCurrentShape(this.currentPoint);
		}
	}

	mousemove(event) {
		if (this.currentShape && !this.currentShapeFinished) {
			this.currentPoint = this.whiteboard.cursorPoint(event);
			this.resizeCurrentShape(this.currentPoint);
		}
	}

	mouseup(event) {
		// If no permissions, delete current shape
		if (!this.whiteboard.shouldWrite) {
			this.clearCurrentShape();
			return;
		}

		if ((this.currentShape && !this.currentShapeFinished
			// Creaction rectangle must have moved. If it's a custom shape, it's alright as long as there's more than one segment
			&& ((this.creationRect.width > 0 && this.creationRect.height > 0)
				|| (this.currentShapeType === 'custom' && this.currentShape.segments.length > 1)
			))
			// If shapeType is line or arc, either width or height can be 0
			|| ((this.currentShapeType === 'line' || this.currentShapeType === 'arc')
				&& (this.creationRect.width > 0 || this.creationRect.height > 0))) {

			// Check if we just finished the first part of the arc
			if (this.currentShapeType === 'arc' && !this.arcPoint) {
				this.arcPoint = snapRounding.getFarthestPoint(this.creationRect, this.startPoint);

				// Visualize this arc point on the canvas
				this.visualArcPoint = new paper.Shape.Circle({
					strokeColor: this.whiteboard.styleOptions.stroke.color,
					fillColor  : this.whiteboard.styleOptions.fill.color,
					center: [this.arcPoint.x, this.arcPoint.y],
					radius: 5
				});

				// Create options for arc
				let paperOptions = styles.deserialize(this.whiteboard.styleOptions);
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
			this.creationRect = null;
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

			// Close shape
			this.currentShape.add(this.currentShape.segments[0]);

			// Simplify path if it's a custom shape
			if (this.currentShapeType === 'custom') {
				this.currentShape.simplify(10);
			}

			// Save shape
			const markingOptions: WhiteboardMarkingOptions = {
				drawTime: Date.now() - this.currentShapeStarted,
				path: segments.serialize(this.currentShape.segments),
				style: this.whiteboard.styleOptions
			};
			this.whiteboard.whiteboardService.createMarking(this.whiteboard.key, markingOptions)
				.subscribe(
					data => {
						// console.log('successfully added shape', data);
					},
					err => {
						console.log('add shape error', err);
					}
				);
		}

		// If we don't have permission to read, erase shape.
		// Otherwise, it will be erased when the database responds with new data.
		if (!this.whiteboard.shouldRead) {
			this.clearCurrentShape();
		}
	}

	keyup(event: KeyboardEvent) {
		if (!this.currentShapeFinished) {
			this.resizeCurrentShape(this.currentPoint);
		}
	}

	/**
	 * Helper functions
	 */

	// Simulates mouse movement while drawing a shape
	resizeCurrentShape(point) {
		// If no permissions, delete current shape
		if (!this.whiteboard.shouldWrite) {
			this.clearCurrentShape();
			return;
		}

		if (this.currentShape && !this.currentShapeFinished) {

			// If custom shape, just add segment to path
			if (this.currentShapeType === 'custom') {
				this.currentShape.add(point);
				return;
			}

			this.creationRect = snapRounding.getRect(this.startPoint, point, this.whiteboard.shiftKey ? 1 : false);

			// Shapes will not show up anymore if their height and width are zero
			if (this.creationRect.width > 0 && this.creationRect.height > 0) {
				// Resize the shape we are currently drawing
				switch (this.currentShapeType) {
					case 'arc':
						// Check if we are on the second phase of the arc
						if (this.arcPoint) {
							let secondPhaseRect = snapRounding.getRect(this.arcPoint, point, this.whiteboard.shiftKey ? 1 : false);

							// Calculate the third point on the arc
							let linePoint = null;
							if (this.whiteboard.shiftKey) {
								linePoint = snapRounding.roundLinePoint(this.arcPoint, point);
								secondPhaseRect = new paper.Rectangle(this.arcPoint, linePoint);
							} else {
								linePoint = snapRounding.getFarthestPoint(secondPhaseRect, this.arcPoint);
							}

							// Check if current point has moved from the second point of arc
							if (secondPhaseRect.width > 0 || secondPhaseRect.height > 0) {
								// Create paper options for the arc
								let paperOptions = styles.deserialize(this.whiteboard.styleOptions);
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
							linePoint = snapRounding.roundLinePoint(this.startPoint, point);
							this.creationRect = new paper.Rectangle(this.startPoint, linePoint);
						} else {
							linePoint = snapRounding.getFarthestPoint(this.creationRect, this.startPoint);
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

	clearCurrentShape() {
		this.currentShapeFinished = true;
		if (this.currentShape) {
			this.currentShape.remove();
		}
		this.currentShape = null;
	}

}
