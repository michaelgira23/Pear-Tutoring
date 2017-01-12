export class User {
	static fromJson({$key, firstName, lastName, grade, email, tutorSessions, tuteeSessions, status, pfp}): User {
		let name = firstName + ' ' + lastName;
		return new User($key, firstName, lastName, name, grade, email, tutorSessions, tuteeSessions, status, pfp);
	}

	static fromJsonList(list: any[]): User[] {
		return list.map(User.fromJson);
	}
	constructor(
		public $key: string,
		public firstName: string,
		public lastName: string,
		public name: string,
		public grade: number,
		public email: string,
		public tutorSessions: {[uid: string]: boolean},
		public tuteeSessions: {[uid: string]: boolean},
		public status: number,
		public pfp: string,
		// public publicSessions: string[],
	) {}
}
