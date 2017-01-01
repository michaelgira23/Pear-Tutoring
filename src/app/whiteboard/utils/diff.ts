import _ from 'lodash';

/**
 * Takes two objects and returns an object with properties that have been added or updated.
 * This is used so we don't store redundant properties in the database when we edit things
 *
 * Ex.
 *
 * { a: 'same', b: 'different', c: { d: 4, e: 2, f: 0 }, f: { g: 6, e: 9 }}
 * combines with:
 * { a: 'same', b: 'very diff', c: { d: 4, e: 2, f: 0 }, f: { g: 0 }}
 *
 * to make:
 * { b: 'very diff', f: { g: 0 } }
 *
 */

export function removeRedundant(oldObject: any, newObject: any, oldUndefinedEqualsNewEmptyArray = true): any {
	// Make sure both parameters are objects.
	if (typeof newObject !== 'object' || typeof oldObject !== 'object') {
		// This means one of the values must be a string, number, boolean, or function.
		// Whatever the newObject is, it will either be different or same. In both cases, returning newObject would be just fine.
		return newObject;
	}

	// Final object with compiled properties that aren't redundant. Returned at the end.
	let changedObject = {};

	const newObjectKeys = Object.keys(newObject);

	// Go through all the keys and see if they exist in the old object
	for (let i = 0; i < newObjectKeys.length; i++) {
		const newObjectKey = newObjectKeys[i];
		const newObjectValue = newObject[newObjectKey];

		// If new object keys are exactly the same, we don't need to add
		if (_.isEqual(oldObject[newObjectKey], newObject[newObjectKey])) {
			continue;
		}

		// If new key doesn't exist in old object, immediately add
		if (typeof oldObject[newObjectKey] === 'undefined') {
			// If old value is undefined and new value is an empty array, skip they are the same
			// (but only if oldUndefinedEqualsNewEmptyArray)
			if (oldUndefinedEqualsNewEmptyArray && newObjectValue.length === 0) {
				continue;
			}
			changedObject[newObjectKey] = newObjectValue;
			continue;
		}

		// If values are both objects, then RECURSE!
		if (typeof oldObject[newObjectKey] === 'object' && typeof newObject[newObjectKey] === 'object') {
			const changed = removeRedundant(oldObject[newObjectKey], newObject[newObjectKey]);
			if (changed !== null) {
				changedObject[newObjectKey] = changed;
			}
			continue;
		}

		// This means oldObject property and newObject property are different, but only one of them is an object.
		// Since object !== anything that isn't an object, we can set this new property to changedObject
		changedObject[newObjectKey] = newObjectValue;
	}

	// If changedObject is empty, return null
	const changedObjectKeys = Object.keys(changedObject);
	if (changedObjectKeys.length > 0) {
		return changedObject;
	} else {
		return null;
	}

}
