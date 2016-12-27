import { Injectable } from '@angular/core';
import { AngularFire } from 'angularfire2';

@Injectable()
export class PermissionsService {

	constructor(private af: AngularFire) { }

	createPermission(type: PermissionsType, permission: Permission) { }

	updatePermission($key: string, permission: Permission) {}

}


export type PermissionsType = 'chat' | 'session' | 'whiteboard';

export interface Permission {
	[$key: string]: {
		anonymous: Partial<PermissionsScopes>;
		loggedIn: Partial<PermissionsScopes>;
		user: {
			[$uid: string]: Partial<PermissionsScopes>;
		}
	};
};

export interface PermissionsScopes {
	read: boolean;
	write: boolean;
	moderator: boolean;
};
