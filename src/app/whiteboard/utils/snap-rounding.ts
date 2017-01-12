declare const paper: any;

const PI = Math.PI;

/**
 * Determines final point from startPoint and currentPoint.
 * Ratio should be height divided by width. (Ex. ratio = 1 means square)
 */

export function snapPoint(startPoint, currentPoint, ratio: number) {
	const angle = slopeToAngle(ratio);
}

/**
 * Returns a paper.js which rounds the currentPoint either horizontal, vertical, or diagonal to the startPoint.
 */

export function roundLinePoint(startPoint, currentPoint, angleInterval = 45) {
	// When holding shift, lines may also be rounded to straightly vertical or horizontal
	const vector = new paper.Point(currentPoint.x - startPoint.x, currentPoint.y - startPoint.y);
	const angle = vector.getAngle();

	// Round angle
	const roundedAngle = -Math.ceil((angle - (angleInterval / 2)) / angleInterval) * angleInterval;

	// Now find what point is along a squared rectangle with the rounded angle
	const square = getRect(startPoint, currentPoint, true);
	// Find the farthest point
	const farthest = getFarthestPoint(square, startPoint);
	// Mirror farthest point across startPoint, to get bigger rect surrounding whole startPoint
	const oppositeX = -(farthest.x - startPoint.x) + startPoint.x;
	const oppositeY = -(farthest.y - startPoint.y) + startPoint.y;
	const opposite = new paper.Point(oppositeX, oppositeY);
	// Create big rectangle that surrounds whole center
	const bigSquare = new paper.Rectangle(farthest, opposite);

	return edgeOfRect(bigSquare, roundedAngle);
}

/**
 * Return a paper.js rectangle with two points.
 * If square is true, will square off the rect using largest side
 */

export function getRect(fromPoint, toPoint, square = false) {

	const rect = new paper.Rectangle(fromPoint, toPoint);

	if (square) {
		// Find dimensions of square (largest side of two)
		const squareSide = Math.max(rect.width, rect.height);
		// Find x and y of this square point
		const squareX = (squareSide * Math.sign(toPoint.x - fromPoint.x)) + fromPoint.x;
		const squareY = (squareSide * Math.sign(toPoint.y - fromPoint.y)) + fromPoint.y;
		const squareToPoint = new paper.Point(squareX, squareY);

		return new paper.Rectangle(fromPoint, squareToPoint);
	}

	return rect;
}

/**
 * Find the farthest corner on a rectangle from a specific point
 */

export function getFarthestPoint(rect, point) {
	const sides = [
		'topLeft',
		'topRight',
		'bottomLeft',
		'bottomRight'
	];

	let lengths = [];
	let farthest = null;

	sides.forEach(corner => {
		const distance = point.getDistance(rect[corner]);

		// Check if distance is farthest distance so far
		let isFarthest = true;
		lengths.forEach(length => {
			if (distance < length) {
				isFarthest = false;
			}
		});
		if (isFarthest) {
			farthest = corner;
		}

		lengths.push(distance);
	});

	return rect[farthest];
}

/**
 * Gets the intersection of perimeter of rectangle, given angle from center
 * http://stackoverflow.com/a/4062485/4594858
 */

export function edgeOfRect(rect, deg) {

	const twoPI = PI * 2;
	let theta = (deg * PI) / 180;

	while (theta < -PI) {
		theta += twoPI;
	}

	while (theta > PI) {
		theta -= twoPI;
	}

	const rectAtan = Math.atan2(rect.height, rect.width);
	const tanTheta = Math.tan(theta);
	let region;

	if ((theta > -rectAtan) && (theta <= rectAtan)) {
		region = 1;
	} else if ((theta > rectAtan) && (theta <= (PI - rectAtan))) {
		region = 2;
	} else if ((theta > (PI - rectAtan)) || (theta <= -(PI - rectAtan))) {
		region = 3;
	} else {
		region = 4;
	}

	const edgePoint = rect.center.clone();
	let xFactor = 1;
	let yFactor = 1;

	switch (region) {
		case 1: yFactor = -1; break;
		case 2: yFactor = -1; break;
		case 3: xFactor = -1; break;
		case 4: xFactor = -1; break;
	}

	if ((region === 1) || (region === 3)) {
		edgePoint.x += xFactor * (rect.width / 2);
		edgePoint.y += yFactor * (rect.width / 2) * tanTheta;
	} else {
		edgePoint.x += xFactor * (rect.height / (2 * tanTheta));
		edgePoint.y += yFactor * (rect.height /  2);
	}

	return edgePoint;
}

/**
 * Converts slope (height divided by width) to angle (degrees)
 */

function slopeToAngle(slope: number) {
	return radiansToDegrees(Math.atan(slope));
}

/**
 * Converts radians to degrees
 */

function radiansToDegrees(radians: number) {
	return radians * (180 / PI);
}
