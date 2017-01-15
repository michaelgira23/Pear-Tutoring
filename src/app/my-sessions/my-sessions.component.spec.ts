/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { MySessionComponent } from './my-sessions.component';

describe('MySessionComponent', () => {
	let component: MySessionComponent;
	let fixture: ComponentFixture<MySessionComponent>;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			declarations: [ MySessionComponent ]
		})
		.compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(MySessionComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
