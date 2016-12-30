import { Injectable } from '@angular/core';
import { AngularFire, FirebaseObjectObservable } from 'angularfire2';
import { Observable, Subject } from 'rxjs/Rx';

declare global {
	interface Array<T> {
		includes(searchElement: T): boolean;
	}
}

@Injectable()
export class PermissionsService {

	constructor(private af: AngularFire) { }

	// TODO: Restrict the `permission` property to only contain the scopes of its specific type.
	createPermission($key: string, type: PermissionsType, permission: Permission): Observable<any> {
		const permissions = this.af.database.object(`${type}Permissions/${$key}`);
		const permObj = {};
		permObj[$key] = permission;

		return this.promiseToObservable(permissions.set(permObj));
	}

	getPermission($key: string, type: PermissionsType): FirebaseObjectObservable<any> {
		return this.af.database.object(`${type}Permissions/${$key}`);
	}

	// We have to ask for the $key and type again since that's how we organize permissions.
	addScope(
		$key: string,
		type: PermissionsType,
		_scopeObj: PermissionsScopes, // This gets all the different scope classes.
		group: PermissionsGroup,
		$uid?: string
	): Observable<any> {
		const scopes = _scopeObj.scopes;

		const permission = this.af.database.object(`${type}Permissions/${$key}`);
		const subject = new Subject<any>();

		permission.subscribe(permObj => {
			if (permObj.$exists()) {
				if (group === 'user') {
					const users = this.af.database.object(`${type}Permissions/${$key}/user`);
					const scopeObj = {};
					scopeObj[$uid] = scopes;

					subject.next(this.promiseToObservable(users.update(scopeObj)));
					subject.complete();
				} else {
					const permissions = this.af.database.object(`${type}Permissions/${$key}`);
					const scopeObj = {};
					scopeObj[group] = scopes;

					subject.next(this.promiseToObservable(permissions.update(scopeObj)));
					subject.complete();
				}
			} else {
				let newPerm: Permission = {};

				if (group === 'user') {
					newPerm['user'][$uid] = scopes;
				} else {
					newPerm[group] = scopes;
				}

				this.createPermission($key, type, newPerm).subscribe(
					data => {
						subject.next(data);
					},
					err => {
						subject.error(err);
						subject.complete();
					}
				);
			}
		});

		return subject.asObservable();
	}

	// See line 18
	removeScope(
		$key: string,
		type: PermissionsType,
		_scopeObj: PermissionsScopes, // This gets all the different scope classes.
		group: PermissionsGroup,
		$uid?: string
	) {
		const scopes = _scopeObj.scopes;

		const permission = this.af.database.object(`${type}Permissions/${$key}`);
		const subject = new Subject<any>();

		permission.subscribe(permObj => {
			if (permObj.$exists()) {
				if (group === 'user') {
					const userPermissions = this.af.database.object(`${type}Permissions/${$key}/user/${$uid}`);
					const scopeObj = {};
					for (let scope of Object.keys(scopes)) {
						scopeObj[scope] = null;
					}

					subject.next(this.promiseToObservable(userPermissions.update(scopeObj)));
					subject.complete();
				} else {
					const groupPermissions = this.af.database.object(`${type}Permissions/${$key}/${group}`);
					const scopeObj = {};
					for (let scope of Object.keys(scopes)) {
						scopeObj[scope] = null;
					}

					subject.next(this.promiseToObservable(groupPermissions.update(scopeObj)));
					subject.complete();
				}
			}
		});

		return subject.asObservable();
	}

	private promiseToObservable(promise): Observable<any> {

		const subject = new Subject<any>();

		promise
			.then(res => {
					subject.next(res);
					subject.complete();
				},
				err => {
					subject.error(err);
					subject.complete();
				});

		return subject.asObservable();
	}

}


// We use classes here instead of interfaces since we can check them on runtime.
class PermissionsScopes {

	scopes: Object = {};

	constructor(newScopes: Object) {
		for (let scope of Object.keys(newScopes)) {
			// Remove every scope that is false.
			if (!newScopes[scope]) {
				delete newScopes[scope];
			}

			// Remove every scope that is not in the component scopes.
			if (!(<any>this.constructor).componentScopes.includes(scope)) {
				delete newScopes[scope];
			}
		}

		this.scopes = newScopes;
	}
}

export class PermissionsChatScopes extends PermissionsScopes {
	static componentScopes = ['read', 'write', 'moderator'];

	constructor(newScopes: Object) { super(newScopes); }
}

export class PermissionsSessionScopes extends PermissionsScopes {
	static componentScopes = ['read', 'write', 'moderator'];

	constructor(newScopes: Object) { super(newScopes); }
}

export class PermissionsWhiteboardScopes extends PermissionsScopes {
	static componentScopes = ['read', 'write', 'moderator'];

	constructor(newScopes: Object) { super(newScopes); }
}

export type PermissionsType = 'chat' | 'session' | 'whiteboard';

export type PermissionsGroup = 'anonymous' | 'loggedIn' | 'user';

export interface Permission {
	// We can't use [T in PermissionsGroup] here since 'user' is a special case with the extra $uid.
	anonymous?: Object;
	loggedIn?: Object;
	user?: {
		[$uid: string]: Object;
	};
}
