// Helper function to transform array to object with properties as array's values and values as true
export function arrToObj(arr: string[]): {[key: string]: true} {
	let objTmp = {};
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
