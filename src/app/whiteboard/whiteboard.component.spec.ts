/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { WhiteboardComponent } from './whiteboard.component';

describe('WhiteboardComponent', () => {
	let component: WhiteboardComponent;
	let fixture: ComponentFixture<WhiteboardComponent>;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			declarations: [ WhiteboardComponent ]
		})
		.compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(WhiteboardComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
