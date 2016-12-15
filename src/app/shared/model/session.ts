// import * as moment from 'moment';
// Maybe store the start and end values internally in this class as a moment object for use?
// In database, must be stored as int because of Firebase

export class Session {
	static fromJson({ $key, start, end, tutor, max, listed, whiteboard, chat, title, desc, canceled}): Session {
		return new Session($key, start, end, tutor, max, listed, whiteboard, chat, title, desc, canceled);
	}

	static fromJsonArray(json: any[]): Session[] {
		return json.map(Session.fromJson);
	}

	constructor (
		public $key: string,
		public start: number,
		public end: number,
		public tutor: string,
		public max: number,
		public listed: boolean,
		public whiteboard: string,
		public chat: string,
		public title: string,
		public desc: string,
		public canceled: boolean
	) { }
}
