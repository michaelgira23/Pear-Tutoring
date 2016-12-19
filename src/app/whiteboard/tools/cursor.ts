import { WhiteboardComponent } from './../whiteboard.component';
declare const paper;

export class Cursor {

	// for resizing: these are mouse coords at original click
	mouseAnchorX: number;
	mouseAnchorY: number;
	// are we resizing an item horizontally, vertically, or both?
	// depends on what part of its bounding box we drag
	resizingX: boolean;
	resizingY: boolean;

	hitTestOptions = {
		fill: true,
		stroke: true,
		bounds: true,
		tolerance: 5,
		// ensures that hit test doesn't pick up the background rectangle
		match: function(result) {
			return result.item.id !== this.whiteboard.background.id;
		}
	};

	constructor(private whiteboard: WhiteboardComponent) { }

	/**
	 * Event handlers
	 */

	mousedown(event) {
		const point = this.whiteboard.cursorPoint(event);
		const hit = paper.project.hitTest(point, this.hitTestOptions);

		if (!hit) {
			return;
		} else {
			let item = hit.item;
			console.log(hit);
			item.brintToFront();
			// deselects all other items
			this.whiteboard.selectOnly(item);

			if (hit.type === 'bounds') {
				// set mouse anchor to current mouse position
				this.mouseAnchorX = point.x;
				this.mouseAnchorY = point.y;

				let hitX = hit.point.x;
				let hitY = hit.point.y;
				this.resizingX = (hitX === item.bounds.left || hitX === item.bounds.right);
				this.resizingY = (hitY === item.bounds.top || hitY === item.bounds.bottom);
				
			} else if (hit.type === 'fill') {
				// TODO: move item
			}
		}
	}

	mousemove(event) {
		const point = this.whiteboard.cursorPoint(event);

		// if mouse is dragged
		if (this.whiteboard.mouseDown) {
			if (this.resizingX || this.resizingY) {
				// if we aren't resizing x, set that delta to 0. same with y.
				let deltaX = this.resizingX ? Math.abs(point.x - this.mouseAnchorX) : 0;
				let deltaY = this.resizingY ? Math.abs(point.y - this.mouseAnchorY) : 0;

				// it loops thru all objects just cuz, but there should only be one object in this array
				// because other objects are deselected when mousedown() detects a resize
				this.whiteboard.selectedItems.forEach(function(item) {

					// see Appendix A for proof that this works
					let xScale = 2 * (1 + deltaX / item.width);
					let yScale = 2 * (1 + deltaY / item.height);

					item.scale(xScale, yScale);

				});
			}
		}
	}

	mouseup(event) {
		if (this.whiteboard.allowWrite) {
	
			if (this.resizingX || this.resizingY) {
				this.resizingX = false;
				this.resizingY = false;

				// write to database . . . somehow . . .
				// off-topic example, maybe? 

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

width - width of item
deltaX - amount mouse has dragged from initial mousedown
newWidth - width that we want to resize the item to (should line up with mouse's current x position)

scale (unknown) - constant we need to find

newWidth = width + deltaX
width * scale = newWidth
scale = newWidth / width = (width + deltaX) / width = 1 + (deltaX / width)
because we scale from the center (both sides increasing), we multiply scale by 2
thus scale = 2 * (1 + deltaX / width)
QED motherfucker

this extends to the y dimension

*/
