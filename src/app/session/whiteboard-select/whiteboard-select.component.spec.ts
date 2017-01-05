/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { WhiteboardSelectComponent } from './whiteboard-select.component';

describe('WhiteboardSelectComponent', () => {
	let component: WhiteboardSelectComponent;
	let fixture: ComponentFixture<WhiteboardSelectComponent>;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			declarations: [ WhiteboardSelectComponent ]
		})
		.compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(WhiteboardSelectComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
