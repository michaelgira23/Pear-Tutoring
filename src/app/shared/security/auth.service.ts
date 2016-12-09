import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, Subject } from 'rxjs/Rx';
import { FirebaseAuth, FirebaseAuthState } from 'angularfire2';
import { UserService } from '../model/user.service';

@Injectable()
export class AuthService {

	constructor (private auth: FirebaseAuth, private router: Router, private userService: UserService) { }

	login(email: string, password: string): Observable<FirebaseAuthState> {
		return this.fromFirebaseAuthPromise(this.auth.login({ email, password }));
	}

	register(email: string, password: string): Observable<FirebaseAuthState> {
		return this.fromFirebaseAuthPromise(this.auth.createUser({ email, password }))
		.flatMap(val => {
			let userUid = this.auth.getAuth().uid;
			return this.userService.saveUser({email}, userUid);
		})
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
