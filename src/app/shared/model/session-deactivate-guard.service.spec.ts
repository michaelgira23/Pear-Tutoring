/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { SessionDeactivateGuardService } from './session-deactivate-guard.service';

describe('SessionDeactivateGuardService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SessionDeactivateGuardService]
    });
  });

  it('should ...', inject([SessionDeactivateGuardService], (service: SessionDeactivateGuardService) => {
    expect(service).toBeTruthy();
  }));
});
