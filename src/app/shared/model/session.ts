// import * as moment from 'moment';
// Maybe store the start and end values internally in this class as a moment object for use?
// In database, must be stored as int because of Firebase

export class Session {

	static fromJson({ $key, start, end, tutor, tutees, max, listed }): Session {
		return new Session($key, start, end, tutor, tutees, max, listed);
	}

	constructor (
		public $key: string,
		public start: number,
		public end: number,
		public tutor: string,
		public tutees: string[],
		public max: number,
		public listed: boolean
	) { }

}
