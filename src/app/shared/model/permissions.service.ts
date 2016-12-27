import { Injectable } from '@angular/core';
import { AngularFire } from 'angularfire2';

@Injectable()
export class PermissionsService {

	constructor(private af: AngularFire) { }

	createPermission(type: PermissionsType, permission: Permission) { }

	addScope($key: string, scope: PermissionsScopes, group: PermissionsGroups, $uid?: string) {
		if (group === 'user') {
			// add scope, with $uid handling
		} else {
			// add scope normally
		}
	}

	removeScope($key: string, scope: PermissionsScopes, group: PermissionsGroups, $uid?: string) {
		if (group === 'user') {
			// add scope, with $uid handling
		} else {
			// add scope normally
		}
	}

}


export type PermissionsType = 'chat' | 'session' | 'whiteboard';

export type PermissionsGroups = 'anonymous' | 'loggedIn' | 'user';

export interface Permission {
	// We can't use [T in keyof PermissionsGroups] here since 'user' is a special case with the extra $uid.
	anonymous: Partial<PermissionsScopes>;
	loggedIn: Partial<PermissionsScopes>;
	user: {
		[$uid: string]: Partial<PermissionsScopes>;
	};
};

export interface PermissionsScopes {
	read: boolean;
	write: boolean;
	moderator: boolean;
};
