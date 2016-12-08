import * as moment from 'moment';

export class Session {
	static fromJson({ $key, start, end, tutor, tutees, max, listed }): Session {
		return new Session($key, start, end, tutor, tutees, max, listed);
	}

	static fromJsonArray(json: any[]): Session[] {
		return json.map(Session.fromJson);
	}

	constructor (
		public $key: string,
		public start: number,
		public end: number,
		public tutor: string,
		public tutees: string[],
		public max: number,
		public listed: boolean
	) {

	}


}
