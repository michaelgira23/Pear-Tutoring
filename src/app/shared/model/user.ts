export class User {
	static fromJson({uid, name, email, tutor, inSession, lastOnline}): User {
		return new User(uid, name, email, tutor, inSession, lastOnline);
	}

	static fromJsonList(list: any[]): User[] {
		return list.map(User.fromJson);
	}
	constructor(
		public uid: string,
		public name: string,
		public email: string,
		public tutor: boolean,
//		public publicSessions: string[],
		public inSession: boolean,
//		public institution: string,
		public lastOnline: number
	) {}
}