/**
 * Whiteboard
 */

export interface Whiteboard extends Metadata {
	name: string;
	background: string;
}

export interface WhiteboardOptions {
	name: string;
	background: string;
}

/**
 * Whiteboard Markings
 */

export interface WhiteboardMarking extends WhiteboardItem {
	started: number;
	path: Point[];
}

/**
 * Whiteboard Text
 */

export interface WhiteboardText extends WhiteboardItem {
	content: string;
	font: Font;
}

/**
 * Whiteboard Shapes
 */

export interface WhiteboardLine extends WhiteboardShape {
	data: {
		from: Point;
		to: Point;
	};
}

export interface WhiteboardArc extends WhiteboardShape {
	data: {
		from: Point;
		through: Point;
		to: Point;
	};
}

export interface WhiteboardEllipse extends WhiteboardShape {
	data: {
		radius: number | Size;
	};
}

export interface WhiteboardPolygon extends WhiteboardShape {
	data: {
		sides: number;
		radius: number | Size;
	};
}

export interface WhiteboardStar extends WhiteboardShape {
	data: {
		radius1: number;
		radius2: number;
	};
}

export interface WhiteboardShape extends WhiteboardItem {
	type: string;
	data: any;
}

/**
 * General Types
 */

export interface WhiteboardItem extends Metadata {
	position: Position;
	style: StyleOptions;
	erased?: number;
}

export interface Metadata {
	$key?: string;
	created: number;
	createdBy: number;
	edits?: Edits;
}

// Key should be timestamp, value should be any property changed
export interface Edits {
	[key: number]: any;
}

export interface Position {
	anchor: Point;
	rotation: number;
	scaling: Point;
}

/**
 * Styling
 */

export interface StyleOptions {
	stroke: Stroke;
	fill: Fill;
	shadow: Shadow;
}

export interface Stroke {
	color: string;
	width: number;
	cap: string;
	join: string;
	dashOffset: number;
	scaling: boolean;
	dashArray: number[];
	miterLimit: number;
}

export interface Fill {
	color: string;
}

export interface Shadow {
	color: string;
	blur: number;
	offset: Point;
}

export interface Font {
	family: string;
	weight: string | number;
	size: number | string;
}

/**
 * Simple Types
 */

export interface Size {
	width: number;
	height: number;
}

export interface Point {
	x: number;
	y: number;
}
