export class User {
	constructor(
		public id: string,
		public username: string,
		public email: string
	) {

	}

	static fromJson({ id, username, email }): User {
		return new User(id, username, email);
	}
}
