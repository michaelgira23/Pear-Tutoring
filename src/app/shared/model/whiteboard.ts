/**
 * Whiteboard
 */

export interface Whiteboard extends Metadata {
	name: string;
	background: string;
}

export interface WhiteboardOptions {
	background?: string;
}

/**
 * Whiteboard Markings
 */

export interface WhiteboardMarking extends WhiteboardItem {
	started: number;
	path: Point[];
}

export interface WhiteboardMarkingOptions { }

/**
 * Whiteboard Text
 */

export interface WhiteboardText extends WhiteboardItem {
	content: string;
	font: Font;
}

export interface Font {
	fontFamily?: string;
	fontWeight?: string | number;
	fontSize?: number | string;
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
		radius?: number | Size;
	};
}

export interface WhiteboardPolygon extends WhiteboardShape {
	data: {
		sides: number;
		radius?: number | Size;
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
 * General types
 */

export interface WhiteboardItem extends Metadata {
	position: Position;
	color: ColorOptions;
	edits?: Edits;
	erased?: number;
}

export interface Metadata {
	$key?: string;
	created: number;
	createdBy: number;
}

// Key should be timestamp, value should be any property changed
export interface Edits {
	[key: number]: any;
}

export interface ColorOptions {
	// Stroke Style
	strokeColor?: string;
	strokeWidth?: number;
	strokeCap?: string;
	strokeJoin?: string;
	dashOffset?: number;
	strokeScaling?: boolean;
	dashArray?: number[];
	miterLimit?: number;
	// Fill Style
	fillColor?: string;
	// Shadow Style
	shadowColor?: string;
	shadowBlur?: number;
	shadowOffset?: Point;
}

export interface Position {
	anchor?: Point;
	rotation?: number;
	scaling?: Point;
}

export interface Size {
	width: number;
	height: number;
}

export interface Point {
	x: number;
	y: number;
}
