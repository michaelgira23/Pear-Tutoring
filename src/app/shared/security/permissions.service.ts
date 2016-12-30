import { Injectable } from '@angular/core';
import { AngularFire } from 'angularfire2';
import { Observable, Subject } from 'rxjs/Rx';

@Injectable()
export class PermissionsService {

	constructor(private af: AngularFire) { }

	createPermission($key: string, type: PermissionsType, permission: Permission): Observable<any> {
		const permissions = this.af.database.object(`${type}Permissions/${$key}`);
		const permObj = {};
		permObj[$key] = permission;

		return this.promiseToObservable(permissions.set(permObj));
	}

	// We have to ask for the $key and type again since that's how we organize permissions.
	addScope(
		$key: string,
		type: PermissionsType,
		scopes: PermissionsScopes,
		group: PermissionsGroup,
		$uid?: string
	): Observable<any> {
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
		scopes: PermissionsScopes,
		group: PermissionsGroup,
		$uid?: string
	) {
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


export type PermissionsType = 'chat' | 'session' | 'whiteboard';

export type PermissionsGroup = 'anonymous' | 'loggedIn' | 'user';

export interface Permission {
	// We can't use [T in PermissionsGroup] here since 'user' is a special case with the extra $uid.
	anonymous?: PermissionsScopes;
	loggedIn?: PermissionsScopes;
	user?: {
		[$uid: string]: PermissionsScopes;
	};
};

export interface PermissionsScopes {
	read?: boolean;
	write?: boolean;
	moderator?: boolean;
};
