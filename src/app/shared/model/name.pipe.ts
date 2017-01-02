import { Pipe, PipeTransform } from '@angular/core';
import { User } from './user';

@Pipe({
	name: 'name'
})
export class NamePipe implements PipeTransform {

	transform(user: User, capitalize?: boolean): string {
		if (user) {
			if (user.name) {
				return user.name;
			} else if (user.email) {
				return user.email;
			}
		}

		// If all else fails, just say anon
		return capitalize ? 'An anonymous user' : 'an anonymous user';
	}

}
