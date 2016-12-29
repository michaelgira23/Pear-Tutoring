import { Injectable } from '@angular/core';
import { AngularFire } from 'angularfire2';
import { Observable, Subject } from 'rxjs/Rx';

@Injectable()
export class PermissionsService {

	constructor(private af: AngularFire) { }

	createPermission($key: string, type: PermissionsType, permission: Permission): Observable<any> {
		const permissions = this.af.database.list(`${type}Permissions`);
		const permObj = {};
		permObj[$key] = permission;

		return this.observableToPromise(permissions.push(permObj));
	}

	// We have to ask for the $key and type again since that's how we organize permissions.
	addScope(
		$key: string,
		type: PermissionsType,
		scopes: PermissionsScopes,
		group: PermissionsGroup,
		$uid?: string
	): Observable<any> {
		if (group === 'user') {
			const users = this.af.database.list(`${type}Permissions/${$key}/user`);
			const scopeObj = {};
			scopeObj[$uid] = scopes;

			return this.observableToPromise(users.push(scopeObj));
		} else {
			const permissions = this.af.database.list(`${type}Permissions/${$key}`);
			const scopeObj = {};
			scopeObj[group] = scopes;

			return this.observableToPromise(permissions.push(scopeObj));
		}
	}

	// See line 18
	removeScope(
		$key: string,
		type: PermissionsType,
		scopes: PermissionsScopes,
		group: PermissionsGroup,
		$uid?: string
	) {
		// TODO: figure out how to remove multiple scopes at once
		if (group === 'user') {
			// remove scope with $uid handling
		} else {
			// add scope normally
		}
	}

	private observableToPromise(promise): Observable<any> {

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
	anonymous: PermissionsScopes;
	loggedIn: PermissionsScopes;
	user: {
		[$uid: string]: PermissionsScopes;
	};
};

export interface PermissionsScopes {
	read?: boolean;
	write?: boolean;
	moderator?: boolean;
};
