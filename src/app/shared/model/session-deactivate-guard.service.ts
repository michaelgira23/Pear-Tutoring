import { Injectable } from '@angular/core';
import { CanDeactivate,
		ActivatedRouteSnapshot, Router,
		RouterStateSnapshot }  from '@angular/router';

import { SessionComponent } from '../../session/session.component';

@Injectable()
export class SessionDeactivateGuardService implements CanDeactivate<SessionComponent> {

	constructor(private router: Router) {}

	canDeactivate(component: SessionComponent, route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
		if (component.rated) {
			return true;
		}
		this.router.navigate(['session', component.sessionId, { outlets: { 'popup': ['rating'] } }]);
		return false;
	}

}
