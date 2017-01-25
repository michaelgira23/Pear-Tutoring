import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/rx';
import { Session } from './session';
import {
	CanActivate, Router,
	ActivatedRouteSnapshot,
	RouterStateSnapshot
} from '@angular/router';
// import { Observable } from 'rxjs/Rx';
import { SessionService } from './session.service';
// import { Session } from './session';
// import * as moment from 'moment';

@Injectable()
export class SessionGuardService implements CanActivate {

	constructor(private router: Router, private sessions: SessionService) { }

	canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | Observable<boolean> {
		let sessionId = route.params['id'] ? route.params['id'] : route.parent.params['id'];
		if (!sessionId) {
			return false;
		}
		return this.sessions.findSession(sessionId).take(1)
			.map((session: Session) => {
				return  (session.tutees.some(user => this.sessions.uid === user.$key) || session.tutor.$key === this.sessions.uid);
						// && (moment().isSameOrAfter(session.start.subtract(15, 'minute')));
			});
	}
}
