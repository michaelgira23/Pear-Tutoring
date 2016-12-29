import { Component, OnInit } from '@angular/core';
import { AngularFire } from 'angularfire2';
import { PermissionsService } from '../shared/security/permissions.service';

@Component({
	selector: 'app-test',
	templateUrl: './test.component.html',
	styleUrls: ['./test.component.scss']
})
export class TestComponent implements OnInit {

	constructor(private af: AngularFire, private permissionsService: PermissionsService) { }

	ngOnInit() {
		this.permissionsService.addScope('-KZzCW_RP3Fkz0Kp6KpV', 'chat', {read: true}, 'anonymous').subscribe(
			data => {
				console.log(`Successful adding of scope: ${data}`);
			},
			err => {
				console.log(`Error adding scope: ${err}`);
			}
		);
	}

}
