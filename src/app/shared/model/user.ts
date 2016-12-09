export class User {
	static fromJson({uid, name, email, tutor}): User {
		return new User(uid, name, email, tutor);
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
	) {}
}