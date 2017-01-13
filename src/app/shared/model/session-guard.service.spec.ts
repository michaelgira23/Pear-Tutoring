/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { SessionGuardService } from './session-guard.service';

describe('SessionGuardService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SessionGuardService]
    });
  });

  it('should ...', inject([SessionGuardService], (service: SessionGuardService) => {
    expect(service).toBeTruthy();
  }));
});
