import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, Subject, BehaviorSubject } from 'rxjs/Rx';
import { AngularFire, FirebaseAuthState } from 'angularfire2';

@Injectable()
export class AuthService {

	auth$: BehaviorSubject<FirebaseAuthState> = new BehaviorSubject(undefined);

	constructor (private af: AngularFire, private router: Router) {
		this.af.auth.subscribe(
			data => {
				this.auth$.next(data);
			},
			err => {
				this.auth$.error(err);
			}
		);
	}

	login(email: string, password: string): Observable<FirebaseAuthState> {
		return this.fromFirebaseAuthPromise(this.af.auth.login({ email, password }));
	}

	register(email: string, password: string): Observable<FirebaseAuthState> {
		return this.fromFirebaseAuthPromise(this.af.auth.createUser({ email, password }));
	}

	fromFirebaseAuthPromise(promise): Observable<any> {

		const subject = new Subject<any>();

		promise
			.then(res => {
				subject.next(res);
				subject.complete();
			})
			.catch(err => {
				subject.error(err);
				subject.complete();
			});

			return subject.asObservable();
	}

	logout() {
		this.af.auth.logout();
		this.router.navigate(['/home']);
	}

}
