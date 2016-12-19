import { WhiteboardComponent } from './../whiteboard.component';
declare const paper;

export class Cursor {

	// mouse coords at original click
	mouseAnchorX: number;
	mouseAnchorY: number;
	// original bounds at moment transform started
	originalBounds: any;	

	// are we resizing an item horizontally, vertically, or both?
	// depends on what part of its bounding box we drag
	resizingX: boolean;
	resizingY: boolean;
	// or are we moving an item?
	moving: boolean;

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

				// determine if we're resizing in x-direction, y-direction, or both
				this.resizingX = (hit.point.x === item.bounds.left || hit.point.x === item.bounds.right);
				this.resizingY = (hit.point.y === item.bounds.top || hit.point.y === item.bounds.bottom);

			} else if (hit.type === 'fill') {

				this.moving = true;

			}
		}
	}

	mousemove(event) {
		const point = this.whiteboard.cursorPoint(event);

		// if mouse is dragged
		if (this.whiteboard.mouseDown) {
			if (this.resizingX || this.resizingY) {
				// if we aren't resizing x, set that delta to 0. same with y.
				let deltaX = this.resizingX ? point.x - this.mouseAnchorX : 0;
				let deltaY = this.resizingY ? point.y - this.mouseAnchorY : 0;
				let originalBounds = this.originalBounds;

				// it loops thru all objects just cuz, but there should only be one object in this array
				// because other objects are deselected when mousedown() detects a resize
				// although this may actually work with multiple items? idk. we'll keep it for now
				this.whiteboard.selectedItems.forEach(function(item) {

					// see Appendix A for proof that this works
					let xScale = Math.abs(1 + 2 * deltaX / originalBounds.width);
					let yScale = Math.abs(1 + 2 * deltaY / originalBounds.height);

					item.scaling = new paper.Point(xScale, yScale);

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
			}
		}
	}

	mouseup(event) {
		if (this.whiteboard.allowWrite) {
	
			if (this.resizingX || this.resizingY) {
				this.resizingX = false;
				this.resizingY = false;

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

/* APPENDIX (maths :3)

A:

currentWidth - width of item
deltaX - amount mouse has dragged from initial mousedown
newWidth - width that we want to resize the item to (should line up with mouse's current x position)

scale (unknown) - constant we need to find

newWidth = currentWidth + deltaX
currentWidth * scale = newWidth
scale = newWidth / currentWidth = (currentWidth + deltaX) / currentWidth = 1 + (deltaX / currentWidth)
because we scale from the center (both sides increasing), we're going to multiply deltaX by 2
we're going to take the absolute value of the whole thing, so that if it's negative (you start scaling from right,
and shrink it past its center line) it will grow bigger again
so our final value is scale = abs(1 + 2 * deltaX / currentWidth)
QED motherfucker

this extends to the y dimension

*/
