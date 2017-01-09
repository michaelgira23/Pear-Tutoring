/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { SessionPermissionsComponent } from './session-permissions.component';

describe('SessionPermissionsComponent', () => {
	let component: SessionPermissionsComponent;
	let fixture: ComponentFixture<SessionPermissionsComponent>;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			declarations: [ SessionPermissionsComponent ]
		})
		.compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(SessionPermissionsComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
