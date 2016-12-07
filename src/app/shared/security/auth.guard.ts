import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs/Rx';
import { AuthService } from './auth.service';

@Injectable()
export class AuthGuard implements CanActivate {


	constructor(private authService:AuthService, private router:Router) { }

	canActivate(route:ActivatedRouteSnapshot, state:RouterStateSnapshot):Observable<boolean> {
			return this.authService.authInfo$
				.map(authInfo => authInfo.isLoggedIn())
				.first()
				.do(allowed => {
					if(!allowed) {
						this.router.navigate(['/login']);
					}
				});
	}

}
