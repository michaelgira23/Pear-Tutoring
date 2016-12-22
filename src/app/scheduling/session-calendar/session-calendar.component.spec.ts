/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { SessionCalendarComponent } from './session-calendar.component';

describe('SessionCalendarComponent', () => {
	let component: SessionCalendarComponent;
	let fixture: ComponentFixture<SessionCalendarComponent>;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			declarations: [ SessionCalendarComponent ]
		})
		.compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(SessionCalendarComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
