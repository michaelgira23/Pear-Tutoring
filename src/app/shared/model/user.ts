export class User {
	static fromJson({$key, name, email, tutor, tutorSessions, tuteeSessions, status}): User {
		return new User($key, name, email, tutor, tutorSessions, tuteeSessions, status);
	}

	static fromJsonList(list: any[]): User[] {
		return list.map(User.fromJson);
	}
	constructor(
		public $key: string,
		public name: string,
		public email: string,
		public tutor: boolean,
		public tutorSessions: {[uid: string]: boolean},
		public tuteeSessions: {[uid: string]: boolean},
		public status: number
		// public publicSessions: string[],
	) {}
}
