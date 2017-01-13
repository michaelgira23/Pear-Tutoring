import * as snapRounding from '../utils/snap-rounding';
import { WhiteboardComponent } from './../whiteboard.component';
declare const paper: any;

export class Cursor {

	// General variables

	// mouse coords at original click
	startPoint: any;
	// mouse coords currently at
	currentPoint: any;
	// original bounds at moment transform started
	originalBounds: any;
	// options for hit test
	hitOptions: any;

	// Case-specific variables

	/* RESIZING */
	resizing: boolean;
	// item that was clicked - resizing ignores other selected items
	originalItem: any;
	// original item's corresponding serialized data
	originalItemSerialized: any;
	// Opposite corner of corner being resized
	oppositeCorner: any;
	/* MOVING */
	moving: boolean;
	// mouse coords after the last mousemove() function
	lastPoint: any;
	/* SELECTING */
	selecting: boolean;
	// highlighted box to show current selection area
	selectionPath: any;

	constructor(private whiteboard: WhiteboardComponent) {
		this.hitOptions = {
			fill: true,
			stroke: true,
			bounds: true,
			tolerance: 10,
			match: result => {
				return result.item.id !== this.whiteboard.background.id;
			}
		};
	}

	/**
	 * Event handlers
	 */

	mousedown(event) {
		// If no permissions, deselect all items
		if (!this.whiteboard.shouldWrite) {
			this.whiteboard.deselectAllItems();
			return;
		}

		this.currentPoint = this.whiteboard.cursorPoint(event);
		// set start point to current mouse position
		this.startPoint = this.currentPoint;
		this.lastPoint = this.currentPoint;

		const hit = paper.project.hitTest(this.currentPoint, this.hitOptions);

		if (hit) {
			let item = hit.item;
			item.bringToFront();
			this.originalBounds = item.bounds;
			// shift key allows you to add more items to existing selection
			// otherwise, clicking an unselected item unselects everything else
			if (!item.selected && !this.whiteboard.shiftKey) {
				paper.project.deselectAll();
			}
			// if holding shift, toggles the selected state rather than always setting it to true
			item.selected = this.whiteboard.shiftKey ? !item.selected : true;

			if (hit.type === 'bounds') {
				this.resizing = true;
				this.originalItem = item;
				this.originalItemSerialized = this.whiteboard.paperIdToSerializedObject(item.id);
				this.oppositeCorner = snapRounding.getFarthestPoint(item.bounds, this.currentPoint);
			} else {
				this.moving = true;
			}
		// if not hit, we're drawing a selection box
		} else {
			this.selecting = true;
			paper.project.deselectAll();
		}
	}

	mousemove(event) {
		this.currentPoint = this.whiteboard.cursorPoint(event);
		this.cursorMove(this.currentPoint);
	}

	mouseup(event) {
		// If no permissions, deselect all items
		if (!this.whiteboard.shouldWrite) {
			this.whiteboard.deselectAllItems();
			return;
		}

		if (!this.selecting) {
			// Edit all items that are selected
			this.whiteboard.editItems(this.whiteboard.selectedItems());
		}

		// Clean everything up
		this.resizing = false;
		this.moving = false;
		this.selecting = false;

		this.clearSelectionPath();
	}

	keyup(event: KeyboardEvent) {
		const key = event.keyCode || event.charCode;

		if (key !== 8 && key !== 46) {
			// Shift key could have changed. Try resizing.
			this.cursorMove(this.currentPoint);
			return;
		}

		// Erase selected markings
		const markingKeys = Object.keys(this.whiteboard.canvasMarkings);
		markingKeys.forEach(markingKey => {
			// If marking is selected, erase
			if (this.whiteboard.canvasMarkings[markingKey].selected) {
				this.whiteboard.whiteboardService.eraseMarking(this.whiteboard.key, markingKey)
					.subscribe(
						data => {
							console.log('Erased marking', data);
						},
						err => {
							console.log('Erase marking error', err);
						}
					);
			}
		});

		// Also erase selected text
		const textKeys = Object.keys(this.whiteboard.canvasText);
		textKeys.forEach(textKey => {
			// If text is selected, erase
			if (this.whiteboard.canvasText[textKey].selected) {
				this.whiteboard.whiteboardService.eraseText(this.whiteboard.key, textKey)
					.subscribe(
						data => {
							console.log('Erased text', data);
						},
						err => {
							console.log('Erase text error', err);
						}
					);
			}
		});

		// Also erase selected image
		const imageKeys = Object.keys(this.whiteboard.canvasImages);
		imageKeys.forEach(imageKey => {
			// If image is selected, erase
			if (this.whiteboard.canvasImages[imageKey].selected) {
				this.whiteboard.whiteboardService.eraseImage(this.whiteboard.key, imageKey)
					.subscribe(
						data => {
							console.log('Erased image', data);
						},
						err => {
							console.log('Erase image error', err);
						}
					);
			}
		});

		// Prevent backspace from going to the previous page
		event.preventDefault();
	}

	changetool() {
		this.whiteboard.deselectAllItems();
	}

	changepermissions(permissions) {
		if (!permissions.write) {
			this.clearSelectionPath();
		}
	}

	/**
	 * Helper functions
	 */

	cursorMove(point) {
		// If no permissions, deselect all items
		if (!this.whiteboard.shouldWrite) {
			this.whiteboard.deselectAllItems();
			return;
		}

		// if mouse is dragged
		if (this.whiteboard.mouseDown) {

			// RESIZING
			if (this.resizing) {

				let ratio: number | false = false;

				if (this.whiteboard.shiftKey) {
					if (this.originalItemSerialized) {
						ratio = this.originalItemSerialized.original.bounds.height / this.originalItemSerialized.original.bounds.width;
					} else {
						ratio = 1;
					}
				}

				const resizeBounds = snapRounding.getRect(this.oppositeCorner, point, ratio);

				// prevents shape from degenerating into a limp ass line
				if (resizeBounds.width > 0 && resizeBounds.height > 0) {
					this.originalItem.bounds = resizeBounds;
				}

			// MOVING
			} else if (this.moving) {
				let offset = new paper.Point(point.x - this.lastPoint.x, point.y - this.lastPoint.y);
				this.whiteboard.selectedItems().forEach(function(item) {
					item.translate(offset);
				});

			// SELECTING
			} else if (this.selecting) {
				let selectionBox = new paper.Rectangle(this.startPoint, point);
				if (selectionBox.height > 0 && selectionBox.width > 0) {
					// creates a selection path if there isn't one
					if (!this.selectionPath) {
						this.selectionPath = new paper.Shape.Rectangle(selectionBox);
					}
					// updates selection path
					this.selectionPath.bounds = selectionBox;

					// selects all items intersecting the selection path
					let allItems = paper.project.getItems({
						overlapping: selectionBox,
						match: result => {
							return result.id !== this.whiteboard.background.id
								&& result.id !== paper.project.activeLayer.id;
						}
					});
					allItems.forEach(function(item) {
						item.selected = true;
					});
				}
			}
			this.lastPoint = point;
		}
	}

	clearSelectionPath() {
		if (this.selectionPath) {
			this.selectionPath.remove();
			this.selectionPath = null;
		}
	}

	// distance formula
	distance(x1: number, y1: number, x2: number, y2: number): number {
		return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
	}

}
