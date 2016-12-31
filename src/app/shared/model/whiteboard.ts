/**
 * Whiteboard
 */

export interface Whiteboard extends Metadata {
	name: string;
	background: Color;
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
	path: Segment[];
}

export interface WhiteboardMarkingOptions extends WhiteboardItemOptions {
	started: number;
	path: Segment[];
}

export type WhiteboardShapeType = 'line' | 'arc' | 'ellipse' | 'polygon' | 'star' | 'custom';

/**
 * Whiteboard Text
 */

export interface WhiteboardText extends WhiteboardItem {
	rotation: number;
	bounds: Rectangle;
	content: string;
	font: Font;
}

export interface WhiteboardTextOptions extends WhiteboardItemOptions {
	rotation: number;
	bounds: Rectangle;
	content: string;
	font: Font;
}

/**
 * General Types
 */

export interface WhiteboardItem extends Metadata {
	style: Style;
	erased?: number;
}

export interface WhiteboardItemOptions {
	style: StyleOptions;
}

export interface Metadata {
	$key?: string;
	$exists?: () => boolean;
	created: number;
	createdBy: string;
	edits?: Edits;
}

// Key should be timestamp, value should be any property changed
export interface Edits {
	[timestamp: number]: {
		[property: string]: any;
	};
}

/**
 * Styling
 */

export interface Style {
	stroke: Stroke;
	fill: Fill;
	shadow: Shadow;
}

export interface StyleOptions {
	stroke: StrokeOptions;
	fill: FillOptions;
	shadow: ShadowOptions;
}

export interface Stroke {
	color: Color;
	width: number;
	cap: string;
	join: string;
	dashOffset: number;
	scaling: boolean;
	dashArray: number[];
	miterLimit: number;
}

export interface StrokeOptions {
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
	color: Color;
}

export interface FillOptions {
	color: string;
}

export interface Shadow {
	color: Color;
	blur: number;
	offset: Point;
}

export interface ShadowOptions {
	color: string;
	blur: number;
	offset: Point;
}

export interface Font {
	family: string;
	weight: number;
	size: number | string;
}

/**
 * Simple Types
 */

export interface Segment {
	point: Point;
	handleIn?: Point;
	handleOut?: Point;
}

export interface Rectangle {
	x: number;
	y: number;
	width: number;
	height: number;
}

export interface Color {
	red: number;
	green: number;
	blue: number;
	alpha: number;
}

export interface Size {
	width: number;
	height: number;
}

export interface Point {
	x: number;
	y: number;
}
