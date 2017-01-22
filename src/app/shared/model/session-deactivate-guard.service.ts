import { Injectable } from '@angular/core';
import { CanDeactivate,
		ActivatedRouteSnapshot, Router,
		RouterStateSnapshot }  from '@angular/router';
import { Observable } from 'rxjs/Rx';

import { SessionComponent } from '../../session/session.component';

@Injectable()
export class SessionDeactivateGuardService implements CanDeactivate<SessionComponent> {

	constructor(private router: Router) {}

	canDeactivate(component: SessionComponent, route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | Observable<boolean> {
		if (!component.rated) {
			return component.openPopup('rating')
			.flatMap(popup => {
				return popup.submitted$.map(submitted => {
					return submitted;
				});
			});
		}
		return true;
	}

}
