declare const paper: any;

const PI = Math.PI;

/**
 * Return a paper.js rectangle with two points.
 * Ratio should be height divided by width. (Ex. ratio = 1 means square)
 * If ratio is false, then rectangle will not be snapped to ratio
 */

export function getRect(fromPoint, toPoint, ratio: number | false = false) {

	const rect = new paper.Rectangle(fromPoint, toPoint);

	if (ratio) {
		const squarePoint = roundLinePoint(fromPoint, toPoint, true, ratio);
		return new paper.Rectangle(fromPoint, squarePoint);
	}

	return rect;
}

/**
 * Returns a paper.js point which rounds the currentPoint either horizontal, vertical, or diagonal to the startPoint.
 * Ratio should be height divided by width. (Ex. ratio = 1 means square)
 */

export function roundLinePoint(startPoint, currentPoint, diagonalOnly = false, ratio = 1) {
	// When holding shift, lines may also be rounded to straightly vertical or horizontal
	const vector = new paper.Point(currentPoint.x - startPoint.x, currentPoint.y - startPoint.y);
	const unroundedAngle = vector.getAngle();

	const ratioAngle = slopeToAngle(ratio);

	// Round angle
	let roundAngles = [
		ratioAngle,
		-ratioAngle,
		180 - ratioAngle,
		-180 + ratioAngle
	];

	if (!diagonalOnly) {
		roundAngles = roundAngles.concat([0, 90, 180, -90]);
	}

	const roundedAngle = roundClosest(roundAngles, unroundedAngle);

	// Now find what point is along a squared rectangle with the rounded angle
	const square = getExpandedRect(startPoint, currentPoint, ratio);

	// Find the farthest point
	const farthest = getFarthestPoint(square, startPoint);
	// Mirror farthest point across startPoint, to get bigger rect surrounding whole startPoint
	const oppositeX = -(farthest.x - startPoint.x) + startPoint.x;
	const oppositeY = -(farthest.y - startPoint.y) + startPoint.y;
	const opposite = new paper.Point(oppositeX, oppositeY);
	// Create big rectangle that surrounds whole center
	const bigSquare = new paper.Rectangle(farthest, opposite);

	return edgeOfRect(bigSquare, -roundedAngle);
}

/**
 * Return a paper.js rectangle with two points. Will expand rectangle to be a square, so toPoint will not necessarily be a corner.
 */

export function getExpandedRect(fromPoint, toPoint, ratio = 1) {

	const currentRect = new paper.Rectangle(fromPoint, toPoint);
	const currentRatio = currentRect.height / currentRect.width;

	// Remember which corner fromPoint is. This is the anchor and this point should not move.
	const corners = [
		'topLeft',
		'topRight',
		'bottomLeft',
		'bottomRight'
	];

	let anchorCorner = null;

	for (let i = 0; i < corners.length; i++) {
		const corner = corners[i];
		if (currentRect[corner].equals(fromPoint)) {
			anchorCorner = corner;
			break;
		}
	}

	// Check if current ratio is greater than target ratio
	if (currentRatio > ratio) {
		// Current ratio is greater than target
		// Width needs to change to fit ratio
		currentRect.width = currentRect.height / ratio;
	} else if (currentRatio < ratio) {
		// Current ratio is less than target
		// Height need to change to fit ratio
		currentRect.height = currentRect.width * ratio;
	}

	// Find how much anchor moved
	const changePos = currentRect[anchorCorner].subtract(fromPoint);
	// Move whole rectangle however much anchor moved
	currentRect.point = currentRect.point.subtract(changePos);

	return currentRect;
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
 * Rounds a value to closest set of numbers in a predetermined array
 */

function roundClosest(roundNumbers: number[], value: number) {
	return roundNumbers.reduce((prev, curr) => {
		return (Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev);
	});
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
