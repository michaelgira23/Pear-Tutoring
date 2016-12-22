/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { CreateChatComponent } from './create-chat.component';

describe('CreateChatComponent', () => {
	let component: CreateChatComponent;
	let fixture: ComponentFixture<CreateChatComponent>;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			declarations: [ CreateChatComponent ]
		})
		.compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(CreateChatComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
