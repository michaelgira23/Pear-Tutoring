/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { TestAuthComponent } from './test-auth.component';

describe('TestAuthComponent', () => {
	let component: TestAuthComponent;
	let fixture: ComponentFixture<TestAuthComponent>;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			declarations: [ TestAuthComponent ]
		})
		.compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(TestAuthComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
