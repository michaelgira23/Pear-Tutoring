/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { CreateWhiteboardComponent } from './create-whiteboard.component';

describe('CreateWhiteboardComponent', () => {
	let component: CreateWhiteboardComponent;
	let fixture: ComponentFixture<CreateWhiteboardComponent>;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			declarations: [ CreateWhiteboardComponent ]
		})
		.compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(CreateWhiteboardComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
