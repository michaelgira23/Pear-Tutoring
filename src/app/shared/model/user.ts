import * as moment from 'moment';

export class User {
	static fromJson({$key, firstName, lastName, grade, email, tutorSessions, tuteeSessions, status, pfp, registerTime}): User {
		let name = firstName + ' ' + lastName;
		if (tutorSessions) {tutorSessions = Object.keys(tutorSessions); }
		if (tuteeSessions) {tuteeSessions = Object.keys(tuteeSessions); }
		if (registerTime) {registerTime = moment(registerTime, 'x'); } else {registerTime = moment(); }
		return new User($key, firstName, lastName, name, grade, email, tutorSessions, tuteeSessions, status, pfp, registerTime);
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
		public tutorSessions: string[],
		public tuteeSessions: string[],
		public status: number,
		public pfp: string,
		public registerTime: moment.Moment
		// public publicSessions: string[],
	) {}
}
