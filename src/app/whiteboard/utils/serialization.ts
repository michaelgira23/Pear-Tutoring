import { StyleOptions, Segment, Rectangle, Font } from '../../shared/model/whiteboard';
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
	serialize: paperObjectToStyleObject,
	deserialize: styleObjectToPaperObject
};

export const font = {
	serialize: paperObjectToFontObject,
	deserialize: fontObjectToPaperObject
};

// Serialization of segments
function paperObjectToSegmentsArray(paperSegments: any, connectLast = false): Segment[] {
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
	// Connect last point to the first point
	if (connectLast) {
		segmentsArr.push(segmentsArr[0]);
	}
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
function paperObjectToStyleObject(paperObject: any, clearFill = false): StyleOptions {
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

	console.log('serialize styles', styleObject);

	return styleObject;
}

// Deserialization of styles
function styleObjectToPaperObject(styleOptions: StyleOptions, clearFill = false): any {
	// Create point from shadow offset
	const shadowOffsetPoint = new paper.Point(styleOptions.shadow.offset.x, styleOptions.shadow.offset.y);
	let paperOptions = {
		// Stroke Style
		strokeColor  : styleOptions.stroke.color,
		strokeWidth  : styleOptions.stroke.width,
		strokeCap    : styleOptions.stroke.cap,
		strokeJoin   : styleOptions.stroke.join,
		dashOffset   : styleOptions.stroke.dashOffset,
		strokeScaling: styleOptions.stroke.scaling,
		dashArray    : styleOptions.stroke.dashArray,
		miterLimit   : styleOptions.stroke.miterLimit,
		// Fill Style
		fillColor    : styleOptions.fill.color,
		// Shadow Style
		shadowColor  : styleOptions.shadow.color,
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
