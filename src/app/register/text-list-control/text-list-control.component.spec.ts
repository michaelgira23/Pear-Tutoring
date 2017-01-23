/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { TextListControlComponent } from './text-list-control.component';

describe('TextListControlComponent', () => {
  let component: TextListControlComponent;
  let fixture: ComponentFixture<TextListControlComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TextListControlComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TextListControlComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
