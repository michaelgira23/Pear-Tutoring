/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { UserChipComponent } from './user-chip.component';

describe('UserChipComponent', () => {
	let component: UserChipComponent;
	let fixture: ComponentFixture<UserChipComponent>;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			declarations: [ UserChipComponent ]
		})
		.compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(UserChipComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
