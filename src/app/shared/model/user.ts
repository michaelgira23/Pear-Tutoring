export class User {
	static fromJson({$key, name, email, tutor}): User {
		return new User($key, name, email, tutor, {}, {});
	}

	static fromJsonList(list: any[]): User[] {
		return list.map(User.fromJson);
	}
	constructor(
		public uid: string,
		public name: string,
		public email: string,
		public tutor: boolean,
		public tutorSessions: {[uid: string]: boolean},
		public tuteeSessions: {[uid: string]: boolean}
		// public publicSessions: string[],
	) {}
}
