import { Injectable } from '@angular/core';
import { AngularFire } from 'angularfire2';

@Injectable()
export class PermissionsService {

	constructor(private af: AngularFire) { }

}

export type PermissionsOptions = 'chat' | 'session' | 'whiteboard';
