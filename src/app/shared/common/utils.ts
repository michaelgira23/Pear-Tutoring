import { Observable } from 'rxjs/Rx';

// Helper function to transform array to object with properties as array's values and values as true
export function arrToObj(arr: string[]): {[key: string]: true} {
	let objTmp = null;
	arr.forEach(val => {
		objTmp[val] = true;
	});
	return objTmp;
}

// Helper function that takes the properties of an object and combine them into an array
export function objToArr(obj: {[key: string]: any}, filter?: (prop) => boolean): any[] {
	if (Array.isArray(obj)) {
		return obj;
	}
	if (!filter) {
		filter = (x) => true;
	}
	let arrTemp = [];
	for (let prop in obj) {
		if (obj[prop] !== undefined) {
			if (filter(obj[prop])) {
				arrTemp.push(prop);
			}
		}
	}
	return arrTemp;
}

export function arraysEqual(a: Array<any>, b: Array<any>) {
	if (a === b) {return true; }
	if (a == null || b == null) {return false; }
	if (a.length !== b.length) {return false; }

	a.sort();
	b.sort();

	for (let i = 0; i < a.length; ++i) {
		if (a[i] !== b[i]) {return false; }
	}
	return true;
}

export function getEditDistance(a, b) {
	if (a.length === 0) {return b.length; }
	if (b.length === 0) {return a.length; }

	let matrix = [];

	// increment along the first column of each row
	let i;
	for (i = 0; i <= b.length; i++) {
	matrix[i] = [i];
	}

	// increment each column in the first row
	let j;
	for (j = 0; j <= a.length; j++) {
	matrix[0][j] = j;
	}

	// Fill in the rest of the matrix
	for (i = 1; i <= b.length; i++) {
	for (j = 1; j <= a.length; j++) {
		if (b.charAt(i - 1) === a.charAt(j - 1)) {
		matrix[i][j] = matrix[i - 1][j - 1];
		} else {
		matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, // substitution
								Math.min(matrix[i][j - 1] + 1, // insertion
										matrix[i - 1][j] + 1)); // deletion
		}
	}
	}

	return matrix[b.length][a.length];
};

export function combineLatestObj(obj) {
	let sources = [];
	let keys = [];
	for (let key in obj) {
	if (obj.hasOwnProperty(key)) {
		keys.push(key.replace(/\$$/, ''));
		sources.push(obj[key]);
	}
	}
	return Observable.combineLatest(sources, function () {
	let argsLength = arguments.length;
	let combination = {};
	for (let i = argsLength - 1; i >= 0; i--) {
		combination[keys[i]] = arguments[i];
	}
	return combination;
	});
}
