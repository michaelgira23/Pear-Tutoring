/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { SessionSettingComponent } from './session-setting.component';

describe('SessionSettingComponent', () => {
	let component: SessionSettingComponent;
	let fixture: ComponentFixture<SessionSettingComponent>;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			declarations: [ SessionSettingComponent ]
		})
		.compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(SessionSettingComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
