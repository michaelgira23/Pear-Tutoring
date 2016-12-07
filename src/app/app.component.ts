import { Component } from '@angular/core';
import { AngularFire, FirebaseListObservable, FirebaseObjectObservable } from 'angularfire2';

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss']
})
export class AppComponent {

	constructor (private af: AngularFire) {
		const rootList$: FirebaseListObservable<any> = af.database.list('/');
		rootList$.subscribe(
			data => {
				console.log('Firebase db', data);
			}
		);
	}
}
