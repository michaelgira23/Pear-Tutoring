import { Component } from '@angular/core';
import { UserService } from './shared/model/user.service';

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss']
})
export class AppComponent {

	constructor (private userService: UserService) { }

}
