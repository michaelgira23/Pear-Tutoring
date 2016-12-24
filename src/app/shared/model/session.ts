// import * as moment from 'moment';
// Maybe store the start and end values internally in this class as a moment object for use?
// In database, must be stored as int because of Firebase
import { User } from './user';
import { Whiteboard } from './whiteboard.service';
import { objToArr } from './session.service'
import prisma from 'prisma';

export class Session {
	static fromJson({ $key, start, end, subject, tutor, tutees, max, listed, whiteboards, chat, title, desc, canceled, tags}): Session {
		let color = subject ? prisma(subject).hex : '#000' ;
		if (!Array.isArray(tutees)) {
			tutees = objToArr(tutees);
		}
		if (!Array.isArray(tags)) {
			tags = objToArr(tags);
		}
		return new Session($key, start, end, subject, color, tutor, tutees, max, listed, whiteboards, chat, title, desc, canceled, tags);
	}

	static fromJsonArray(json: any[]): Session[] {
		return json.map(Session.fromJson);
	}

	constructor (
		public $key: string,
		public start: number,
		public end: number,
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
		public tags: string[]
	) { }
}
