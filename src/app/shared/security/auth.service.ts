import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, Subject } from 'rxjs/Rx';
import { FirebaseAuth, FirebaseAuthState } from 'angularfire2';

@Injectable()
export class AuthService {

	constructor (private auth: FirebaseAuth, private router: Router) { }

	login(email: string, password: string): Observable<FirebaseAuthState> {
		return this.fromFirebaseAuthPromise(this.auth.login({ email, password }));
	}

	register(email: string, password: string): Observable<FirebaseAuthState> {
		return this.fromFirebaseAuthPromise(this.auth.createUser({ email, password }));
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
		this.auth.logout();
		this.router.navigate(['/home']);
	}

}
