import { Injectable } from '@angular/core';
import { CanDeactivate,
		ActivatedRouteSnapshot, Router,
		RouterStateSnapshot }  from '@angular/router';
import { Observable, Subject } from 'rxjs/Rx';
import { SessionPopup } from '../../session/session-popup';

import { SessionComponent } from '../../session/session.component';

@Injectable()
export class SessionDeactivateGuardService implements CanDeactivate<SessionComponent> {

	constructor(private router: Router) {}

	canDeactivate(component: SessionComponent, route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | Observable<boolean> {
		if (!component.rated) {
			let popupRef$ = new Subject<SessionPopup>();
			component.openPopup('rating', (popup) => {
				popupRef$.next(popup);
			});
			return popupRef$.flatMap(popup => {
				return popup.submitted$.map(submitted => {
					component.closePopup();
					return submitted;
				});
			});
		}
		return true;
	}

}
