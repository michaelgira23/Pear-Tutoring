/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { ViewChatComponent } from './view-chat.component';

describe('ViewChatComponent', () => {
	let component: ViewChatComponent;
	let fixture: ComponentFixture<ViewChatComponent>;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			declarations: [ ViewChatComponent ]
		})
		.compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(ViewChatComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
