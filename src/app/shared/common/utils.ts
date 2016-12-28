// Helper function to transform array to object with properties as array's values and values as true
export function arrToObj(arr: string[]): {[key: string]: true} {
	let objTmp = {};
	arr.forEach(val => {
		objTmp[val] = true;
	});
	return objTmp;
}

// Helper function that does the reverse to the above one
export function objToArr(obj: {[key: string]: true}): any[] {
	if (Array.isArray(obj)) {
		return obj;
	}
	let arrTemp = [];
	for (let prop in obj) {
		if (obj[prop]) {
			arrTemp.push(prop);
		}
	}
	return arrTemp;
}