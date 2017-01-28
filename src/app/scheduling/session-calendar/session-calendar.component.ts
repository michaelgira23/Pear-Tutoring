import { Component, OnInit, Input, OnChanges, SimpleChanges, ChangeDetectionStrategy } from '@angular/core';
import { CalendarEvent, EventAction } from 'calendar-utils';
import { Session } from '../../shared/model/session';
import { Subject } from 'rxjs/Rx';
import * as moment from 'moment';

@Component({
	selector: 'app-session-calendar',
	templateUrl: './session-calendar.component.html',
	styleUrls: ['./session-calendar.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})

export class SessionCalendarComponent implements OnInit, OnChanges {

	view: string = 'month';

	@Input()
	sessions: Session[];

	momentViewDate = moment();
	get viewDate(): Date {
		return this.momentViewDate.toDate();
	}

	refresh: Subject<any> = new Subject();

	events: CalendarEvent[] = [];

	activeDayIsOpen: boolean = true;

	dayClicked: boolean;

	actions: EventAction[] = [{
		label: '<i class="fa fa-fw fa-pencil"></i>',
		onClick: ({event}: {event: CalendarEvent}): void => {
			// console.log('Edit event', event);
		}
	}, {
		label: '<i class="fa fa-fw fa-times"></i>',
		onClick: ({event}: {event: CalendarEvent}): void => {
			if (this.events) {
				this.events = this.events.filter(iEvent => iEvent !== event);
			}
		}
	}];

	constructor() {
	}

	ngOnInit() {
	}

	ngOnChanges(changes: SimpleChanges) {
		this.events = this.toCalendarEvents(this.sessions);
	}

	shadeColor(color, percent) {
		if (color) {
			/* tslint:disable:no-bitwise */
			const f = parseInt(color.slice(1), 16);
			const t = percent < 0 ? 0 : 255;
			const p = percent < 0 ? percent * -1 : percent;
			const R = f >> 16;
			const G = f >> 8 & 0x00FF;
			const B = f & 0x0000FF;
			return '#'
				+ (0x1000000 + (Math.round((t - R) * p) + R) * 0x10000
				+ (Math.round((t - G) * p) + G) * 0x100
				+ (Math.round((t - B) * p) + B)).toString(16).slice(1);
			/* tslint:enable:no-bitwise */
		}
	}

	toCalendarEvents(sessions: Session[]): CalendarEvent[] {
		return sessions.map((session: Session) => {
			return {
				start: session.start.toDate(),
				end: session.end.toDate(),
				title: session.title,
				color: {
					primary: session.color,
					secondary: this.shadeColor(session.color, 0.5)
				},
				actions: this.actions
			};
		});
	}

	lastMonth() {
		this.momentViewDate.subtract(1, 'M');
	}
	nextMonth() {
		this.momentViewDate.add(1, 'M');
	}

	onDayClick({date, events}: {date: Date, events: CalendarEvent[]}): void {
		if (moment(date).isSame(this.momentViewDate, 'month')) {
			if (
				(moment(date).isSame(this.momentViewDate, 'day') && this.activeDayIsOpen === true) ||
				events.length === 0
			) {
				this.activeDayIsOpen = false;
			} else {
				this.activeDayIsOpen = true;
				this.momentViewDate = moment(date);
			}
		}
	}
}
