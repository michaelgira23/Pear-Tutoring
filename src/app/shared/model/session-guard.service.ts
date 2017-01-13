import { Injectable } from '@angular/core';
import {
	CanActivateChild, Router,
	ActivatedRouteSnapshot,
	RouterStateSnapshot
} from '@angular/router';
import { Observable } from 'rxjs/Rx';
import { SessionService } from './session.service';

@Injectable()
export class SessionGuardService implements CanActivateChild {

	constructor(private router: Router, private sessions: SessionService) { }

	canActivateChild(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
		return this.sessions.findSession(route.params['id']).take(1)
			.map(session => {
				return session.tutees.some(user => this.sessions.uid === user.$key) || session.tutor === this.sessions.uid;
			});
	}
}
