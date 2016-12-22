import { Pipe, PipeTransform } from '@angular/core';
import { User } from './user';

@Pipe({
	name: 'name'
})
export class NamePipe implements PipeTransform {

	transform(user: User, capitalize?: boolean): string {
		if(user.name) {
			return user.name;
		} else if (user.email) {
			return user.email;
		} else {
			return capitalize ? 'An anonymous user' : 'an anonymous user';
		}
	}

}
