/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { DisplaySessionComponent } from './session-card.component';

describe('DisplaySessionComponent', () => {
	let component: DisplaySessionComponent;
	let fixture: ComponentFixture<DisplaySessionComponent>;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			declarations: [ DisplaySessionComponent ]
		})
		.compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(DisplaySessionComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
