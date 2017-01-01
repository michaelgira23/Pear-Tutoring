import parseColor from 'parse-color';
import { Style, StyleOptions, Segment, Rectangle, Font, Color } from '../../shared/model/whiteboard';
declare const paper: any;

/**
 * Serialization and deserialization of paper.js properties
 */

export const segments = {
	serialize: paperObjectToSegmentsArray,
	deserialize: segmentsArrayToPaperObject
};

export const rectangles = {
	serialize: paperObjectToRectangle,
	deserialize: rectangleToPaperObject
};

export const styles = {
	serialize: paperObjectToStyleOptions,
	deserialize: styleObjectToPaperObject,
	serializeOptions: styleOptionsToStyleObject
};

export const font = {
	serialize: paperObjectToFontObject,
	deserialize: fontObjectToPaperObject
};

export const colors = {
	serialize: stringToColorObject,
	deserialize: colorObjectToString
};

// Serialization of segments
function paperObjectToSegmentsArray(paperSegments: any): Segment[] {
	let segmentsArr: Segment[] = [];
	paperSegments.forEach(segment => {
		segmentsArr.push({
			point: {
				x: segment.point.x,
				y: segment.point.y
			},
			handleIn: {
				x: segment.handleIn.x,
				y: segment.handleIn.y
			},
			handleOut: {
				x: segment.handleOut.x,
				y: segment.handleOut.y
			}
		});
	});
	return segmentsArr;
}

// Deserialization of segments
function segmentsArrayToPaperObject(segmentsArr: Segment[]): any {
	let paperSegments = [];
	segmentsArr.forEach(segment => {
		paperSegments.push(new paper.Segment(segment.point, segment.handleIn, segment.handleOut));
	});
	return paperSegments;
}

// Serialization of rectangles
function paperObjectToRectangle(paperRect: any): Rectangle {
	return {
		x     : paperRect.x,
		y     : paperRect.y,
		width : paperRect.width,
		height: paperRect.height
	};
}

// Deserialization of rectangles
function rectangleToPaperObject(rect: Rectangle): any {
	return new paper.Rectangle(rect.x, rect.y, rect.width, rect.height);
}

// Serialization of styles
function paperObjectToStyleOptions(paperObject: any, clearFill = false): StyleOptions {
	let styleObject: StyleOptions = {
		stroke: {
			color     : paperObject.strokeColor.toCSS(),
			width     : paperObject.strokeWidth,
			cap       : paperObject.strokeCap,
			join      : paperObject.strokeJoin,
			dashOffset: paperObject.dashOffset,
			scaling   : paperObject.strokeScaling,
			dashArray : paperObject.dashArray,
			miterLimit: paperObject.miterLimit
		},
		fill: {
			color: paperObject.fillColor.toCSS()
		},
		shadow: {
			color: paperObject.shadowColor.toCSS(),
			blur : paperObject.shadowBlur,
			offset: {
				x: paperObject.shadowOffset.x,
				y: paperObject.shadowOffset.y
			}
		}
	};

	// If clearFill, fill clear
	if (clearFill) {
		styleObject.fill.color = 'rgba(0, 0, 0, 0)';
	}

	return styleObject;
}

// Serialize of style options for database (serialize colors)
function styleOptionsToStyleObject(styleOptions: StyleOptions): Style {
	return {
		stroke: {
			color     : colors.serialize(styleOptions.stroke.color),
			width     : styleOptions.stroke.width,
			cap       : styleOptions.stroke.cap,
			join      : styleOptions.stroke.join,
			dashOffset: styleOptions.stroke.dashOffset,
			scaling   : styleOptions.stroke.scaling,
			dashArray : styleOptions.stroke.dashArray,
			miterLimit: styleOptions.stroke.miterLimit
		},
		fill: {
			color: colors.serialize(styleOptions.fill.color)
		},
		shadow: {
			color: colors.serialize(styleOptions.shadow.color),
			blur : styleOptions.shadow.blur,
			offset: {
				x: styleOptions.shadow.offset.x,
				y: styleOptions.shadow.offset.y
			}
		}
	};
}

// Deserialization of styles
function styleObjectToPaperObject(styleOptions: Style | StyleOptions, clearFill = false): any {
	// Create point from shadow offset
	const shadowOffsetPoint = new paper.Point(styleOptions.shadow.offset.x, styleOptions.shadow.offset.y);
	let paperOptions: any = {
		// Stroke Style
		strokeColor  : colors.deserialize(styleOptions.stroke.color),
		strokeWidth  : styleOptions.stroke.width,
		strokeCap    : styleOptions.stroke.cap,
		strokeJoin   : styleOptions.stroke.join,
		dashOffset   : styleOptions.stroke.dashOffset,
		strokeScaling: styleOptions.stroke.scaling,
		dashArray    : styleOptions.stroke.dashArray,
		miterLimit   : styleOptions.stroke.miterLimit,
		// Fill Style
		fillColor    : colors.deserialize(styleOptions.fill.color),
		// Shadow Style
		shadowColor  : colors.deserialize(styleOptions.shadow.color),
		shadowBlur   : styleOptions.shadow.blur,
		shadowOffset : shadowOffsetPoint,
	};

	// If clearFill, fill clear
	if (clearFill) {
		paperOptions.fillColor = 'rgba(0, 0, 0, 0)';
	}

	return paperOptions;
}

// Serialization of font
function paperObjectToFontObject(paperObject: any): Font {
	return {
		family: paperObject.fontFamily,
		weight: paperObject.fontWeight,
		size  : paperObject.fontSize
	};
}

// Deserialization of font
function fontObjectToPaperObject(fontOptions: Font): any {
	return {
		fontFamily: fontOptions.family,
		fontWeight: fontOptions.weight,
		fontSize  : fontOptions.size
	};
}

// Serialization of color
function stringToColorObject(string: string): Color {
	const color = parseColor(string);
	return {
		red  : color.rgba[0],
		green: color.rgba[1],
		blue : color.rgba[2],
		alpha: color.rgba[3]
	};
}

// Deserialization of color
function colorObjectToString(color: Color | string): string {

	// If color is already a string, return
	if (typeof color === 'string') {
		return <string>color;
	}

	return `rgba(${color.red}, ${color.green}, ${color.blue}, ${color.alpha})`;
}
