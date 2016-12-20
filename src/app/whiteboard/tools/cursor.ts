import { WhiteboardComponent } from './../whiteboard.component';
declare const paper;

export class Cursor {

	// mouse coords at original click
	mouseAnchorX: number;
	mouseAnchorY: number;
	// original bounds at moment transform started
	originalBounds: any;	

	resizing: boolean;
	// are we resizing an item horizontally, vertically, or both? depends on what part of its bounding box we drag
	// implicit in hitTop is hitBottom, since you can only get the top or bottom of a bounding rectangle
	// so if hitTop is true, hitBottom is false, and vice versa. same with hitLeft and hitRight
	hitTop: boolean;
	hitBottom: boolean;
	hitLeft: boolean;
	hitRight: boolean;
	// or are we moving an item?
	moving: boolean;
	// or are we drawing a selection box?
	selecting: boolean;

	hitOptions: any;

	constructor(private whiteboard: WhiteboardComponent) {
		var self = this;
		this.hitOptions = {
			fill: true,
			stroke: true,
			bounds: true,
			tolerance: 5,
			// ensures that hit test doesn't pick up the background rectangle
			match: function(result) {
				return result.item.id !== self.whiteboard.background.id;
			}
		}
	}

	/**
	 * Event handlers
	 */

	mousedown(event) {
		const point = this.whiteboard.cursorPoint(event);
		const hit = paper.project.hitTest(point, this.hitOptions);

		if (!hit) {
			this.whiteboard.deselectAllItems();
			return;
		} else {

			let item = hit.item;

			// not working for some weird reason:
			// item.brintToFront();

			// deselects all other items
			// TEMPORARY: later, may implement selecting (to move) multiple items
			this.whiteboard.selectOnly(item);
			// set mouse anchor to current mouse position
			this.mouseAnchorX = point.x;
			this.mouseAnchorY = point.y;
			// set original bounds
			this.originalBounds = item.bounds;

			if (hit.type === 'bounds') {

				// which anchor point is being dragged?
				this.hitTop = hit.point.y === item.bounds.top;
				this.hitBottom = hit.point.y === item.bounds.bottom;
				this.hitLeft = hit.point.x === item.bounds.left;
				this.hitRight = hit.point.x === item.bounds.right;
				this.resizing = true;

			} else if (hit.type === 'fill') {

				this.moving = true;
				console.log("here");

			} else {
				this.selecting = true;
			}
		}
	}

	mousemove(event) {
		// if mouse is dragged
		if (this.whiteboard.mouseDown) {
			const point = this.whiteboard.cursorPoint(event);
		
			if (this.resizing) {

				// In order to edit the item's bounds, we must pick a point that is diagonal
				// from where the mouse started dragging. However, if the mouse dragged the side
				// of the bounding box, we have to change the mouse's "position" so that only
				// the right dimension is scaled.
				// addX and addY = 0, width, or height of originalBounds
				// if addX = width, the point we pick is on the right side of originalBounds,
				// because originalBounds.x + originalBounds.width = x coordinate of its right side
				// and vice versa. also applies to y.

				// if mouse drags on right, we want the left side point, which means addX = 0
				let addX = 0;
				if (this.hitRight) {}
				// if mouse drags on left, we want the right side point, which means addX = width
				else if (this.hitLeft) addX = this.originalBounds.width;
				// if mouse drags neither, we use the left side point, and set the mouse x coordinate
				// to a constant: the originalBound's right side (so the x-scale doesn't change)
				else point.x = this.originalBounds.x + this.originalBounds.width;
				// same with Y
				let addY = 0;
				if (this.hitBottom) {}
				else if (this.hitTop) addY = this.originalBounds.height;
				else point.y = this.originalBounds.y + this.originalBounds.height;

				let scalePoint = new paper.Point(this.originalBounds.x + addX, this.originalBounds.y + addY);

				this.whiteboard.selectedItems.forEach(function(item) {
					item.bounds = new paper.Rectangle(scalePoint, point);
				});

			} else if (this.moving) {
				let deltaX = point.x - this.mouseAnchorX;
				let deltaY = point.y - this.mouseAnchorY;
				// because Rectangle bounds' position is their top left corner:
				let ob = this.originalBounds;
				let originalCenter = new paper.Point(ob.x + ob.width / 2, ob.y + ob.height / 2);

				this.whiteboard.selectedItems.forEach(function(item) {
					item.position = new paper.Point(originalCenter.x + deltaX, originalCenter.y + deltaY);
				});
			} else if (this.selecting) {

				let selectionBox = new paper.Rectangle(new paper.Point(this.mouseAnchorX, this.mouseAnchorY), point);
				let self = this;

				let items = paper.project.getItems({
					recursive: true,
					overlapping: selectionBox,
					// don't highlight the background
					match: function(result) {
						return result.item.id !== self.whiteboard.background.id;
					}
				});
				console.log(selectionBox);
				console.log(items);
				items.forEach(function(item) {
					self.whiteboard.selectItem(item);
				});
			}
		}
	}

	mouseup(event) {
		if (this.whiteboard.allowWrite) {
	
			if (this.resizing) {
				this.resizing = false;

				// write to database
				// some reference code:

				// this.whiteboard.whiteboardService.editText(
				// 	this.whiteboard.key, pushKey, this.selectedText.content, this.whiteboard.textOptions, position)
				// 	.subscribe(
				// 		data => {
				// 			console.log('successfully editted text', data);
				// 		},
				// 		err => {
				// 			console.log('edit text error', err);
				// 		}
				// 	);

				// editText(whiteboardKey: string, textKey: string, content: string, options: WhiteboardTextOptions, position: Position): Observable<any> {
				// 	const textObject = this.af.database.object(`whiteboardText/${whiteboardKey}/${textKey}`);
				// 	return Observable.from([textObject.update({
				// 		content,
				// 		options,
				// 		position
				// 	})]);
				// }
			} else if (this.moving) {
				this.moving = false;
			} else if (this.selecting) {
				this.selecting = false;
			}
		}
	}

	/**
	* Helper functions
	*/

	// distance formula
	distance(x1: number, y1: number, x2: number, y2: number): number {
		return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
	}


}
