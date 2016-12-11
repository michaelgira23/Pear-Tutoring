import { Component, Input, OnInit, OnDestroy, ViewChild, HostListener } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { WhiteboardService, Whiteboard, WhiteboardMarking, WhiteboardMarkingOptions, defaultMarkingOptions } from '../shared/model/whiteboard.service';

declare const paper;

@Component({
	selector: 'app-whiteboard',
	templateUrl: './whiteboard.component.html',
	styleUrls: ['./whiteboard.component.scss']
})
export class WhiteboardComponent implements OnInit, OnDestroy {

	// Key of whiteboard
	@Input()
	key: string;

	// Whiteboard <canvas>
	@ViewChild('whiteboard')
	canvas;
	// Actual canvas DOM reference
	canvasEl: any;

	// paper.js paths on the whiteboard canvas
	paths: any;
	// Options for drawing the path that are currently selected
	pathOptions: WhiteboardMarkingOptions = defaultMarkingOptions;
	// Current path being drawn
	currentPath: any;
	// Rectangle on canvas to set background
	background: any;

	// Whether or not mouse is clicked; used for drawing
	mouseDown: boolean = false;

	// Observable subscriptions
	whiteboardSubscription: any;
	markingsSubscription: any;

	// Data from database
	whiteboard: Whiteboard;
	markings: any;

	constructor(private route: ActivatedRoute, private whiteboardService: WhiteboardService) { }

	ngOnInit() {
		this.canvasEl = this.canvas.nativeElement;
		// Setup Canvas with paper.js
		paper.setup(this.canvasEl);

		// Listen to route parameters until we get session component up
		this.route.params.subscribe(
			params => {
				this.key = params['key'];
				this.whiteboardService.getWhiteboard(this.key).subscribe(
					data => {
						console.log('whiteboard data', data);
						this.whiteboard = data;
						this.setBackgroundColor(this.whiteboard.background);
					},
					err => {
						console.log('create whiteboard error!', err);
					}
				);

				this.whiteboardService.getMarkings(this.key).subscribe(
					data => {
						console.log('new marking', data);
						this.markings = data;
						this.markingsToCanvas(this.markings);
					},
					err => {
						console.log('whiteboard markings error!', err);
					}
				);
			}
		);
	}

	ngOnDestroy() {
		this.whiteboardSubscription.unsubscribe();
		this.markingsSubscription.unsubscribe();
	}

	@HostListener('mousedown', ['$event'])
	onMouseDown(event) {
		console.log('mousedown', event);
		this.mouseDown = true;

		// Create a new path
		this.currentPath = new paper.Path({
			segments: [this.cursorPoint(event)],
			strokeColor  : this.pathOptions.strokeColor,
			strokeWidth  : this.pathOptions.strokeWidth,
			strokeCap    : this.pathOptions.strokeCap,
			strokeJoin   : this.pathOptions.strokeJoin,
			dashOffset   : this.pathOptions.dashOffset,
			strokeScaling: this.pathOptions.strokeScaling,
			dashArray    : this.pathOptions.dashArray,
			miterLimit   : this.pathOptions.miterLimit
		});
	}

	@HostListener('mousemove', ['$event'])
	onMouseMove(event) {
		// Only care if mouse is being dragged
		if(this.mouseDown) {
			console.log('mousemove', event);
			// Add point to the current line
			this.currentPath.add(this.cursorPoint(event));
		}
	}

	@HostListener('mouseup', ['$event'])
	onMouseUp(event) {
		console.log('mouseup', event);
		this.mouseDown = false;

		// Add point to the current line
		this.currentPath.add(this.cursorPoint(event));
		// Simplify path to make it smoother and less data
		this.currentPath.simplify();
		console.log('add this point to db');
	}

	cursorPoint(event) {
		// Return a paper.js point where the mouse is at relative to the canvas
		const canvasPos = this.canvasEl.getBoundingClientRect();
		const cursorX = event.clientX - canvasPos.left;
		const cursorY = event.clientY - canvasPos.top;

		return new paper.Point(cursorX, cursorY);
	}

	setBackgroundColor(color: string) {
		// If there is currently a background, remove it
		if(this.background) {
			this.background.remove();
		}

		// Create new points for the background
		const topLeft = new paper.Point(0, 0);
		const bottomRight = new paper.Point(this.canvasEl.width, this.canvasEl.height);

		// Create a new rectangle that spans the whole canvas
		this.background = new paper.Path.Rectangle(topLeft, bottomRight);

		// Send the canvas to the back
		this.background.sendToBack();
		this.background.fillColor = color;
	}

	markingsToCanvas(markings: WhiteboardMarking[]) {
		console.log(markings);
		// this.paths = {};
		//
		// markings.forEach((value, index) => {
		// 	const path = new paper.Path();
		// 	path.strokeColor   = value.strokeColor;
		// 	path.strokeWidth   = value.strokeWidth;
		// 	path.strokeCap     = value.strokeCap;
		// 	path.strokeJoin    = value.strokeJoin;
		// 	path.dashOffset    = value.dashOffset;
		// 	path.strokeScaling = value.strokeScaling;
		// 	path.dashArray     = value.dashArray;
		// 	path.miterLimit    = value.miterLimit;
		// });
	}

}
