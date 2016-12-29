/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { PermissionsService } from './permissions.service';

describe('PermissionsService', () => {
	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [PermissionsService]
		});
	});

	it('should ...', inject([PermissionsService], (service: PermissionsService) => {
		expect(service).toBeTruthy();
	}));
});
