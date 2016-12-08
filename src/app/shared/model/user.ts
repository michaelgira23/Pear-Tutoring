import { FirebaseAuth } from 'angularfire2';

export class User {
	constructor(
		public uid: string,
		public name: string,
		public email: string,
		public tutor: boolean,
		public publicSessions: string[],
		private auth: FirebaseAuth
	) {}
}