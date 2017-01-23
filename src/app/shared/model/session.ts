// import * as moment from 'moment';
// Maybe store the start and end values internally in this class as a moment object for use?
// In database, must be stored as int because of Firebase
import { User } from './user';
import { Whiteboard } from './whiteboard';
import { objToArr } from '../common/utils';
import * as moment from 'moment';

export const SessionColors = {
	Math: '#05999B',
	Art: '#FF5C5C',
	English: '#86F243'
};

export class Session {
	static fromJson({ $key, start, end, subject, tutor, tutees, max, listed,
					whiteboards, chat, title, desc, canceled, tags, ywd, grade, classStr, pending, rating}): Session {
		let color = subject ? SessionColors[subject] : '#000' ;
		if (!Array.isArray(tutees)) {
			tutees = objToArr(tutees);
		}
		if (!Array.isArray(tags)) {
			tags = objToArr(tags);
		}
		if (!Array.isArray(pending)) {
			pending = objToArr(pending);
		}
		start = moment(start, 'X');
		end = moment(end, 'X');
		rating.map(r => {
			r.time = moment(r.time, 'x');
			return r;
		});
		return new Session($key, start, end, subject, color, tutor, tutees, max, listed,
							whiteboards, chat, title, desc, canceled, tags, ywd, grade, classStr, pending, rating);
	}

	static fromJsonArray(json: any[]): Session[] {
		return json.map(Session.fromJson);
	}

	constructor (
		public $key: string,
		public start: moment.Moment,
		public end: moment.Moment,
		public subject: string,
		public color: string,
		public tutor: User,
		public tutees: User[],
		public max: number,
		public listed: boolean,
		public whiteboards: Whiteboard[],
		public chat: string,
		public title: string,
		public desc: string,
		public canceled: boolean,
		public tags: string[],
		public ywd: string,
		public grade: number,
		public classStr: string,
		public pending: string[],
		public rating: SessionRating[]
	) { }
}

export interface SessionRating {
	user: string;
	rating: number;
	comment: string;
	time: moment.Moment;
}
