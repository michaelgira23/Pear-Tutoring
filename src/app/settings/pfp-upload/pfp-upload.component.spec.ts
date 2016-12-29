/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { PfpUploadComponent } from './pfp-upload.component';

describe('PfpUploadComponent', () => {
	let component: PfpUploadComponent;
	let fixture: ComponentFixture<PfpUploadComponent>;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			declarations: [ PfpUploadComponent ]
		})
		.compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(PfpUploadComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
