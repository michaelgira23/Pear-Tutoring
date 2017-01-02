import { Component, OnInit } from '@angular/core';
import { AngularFire } from 'angularfire2';
import { PermissionsService, PermissionsWhiteboardScopes } from '../shared/security/permissions.service';

@Component({
	selector: 'app-test',
	templateUrl: './test.component.html',
	styleUrls: ['./test.component.scss']
})
export class TestComponent implements OnInit {

	constructor(private af: AngularFire, private permissionsService: PermissionsService) { }

	ngOnInit() {
		this.permissionsService.getPermission('-KZzCW_RP3Fkz0Kp6KpV', 'chat').subscribe(
			data => {
				console.log(data);
			}
		);

		let permission = {
			anonymous: new PermissionsWhiteboardScopes({
				read: true
			}),
		};

		this.permissionsService.createPermission('-K_ReQRXExIGcsHj7O4e', 'chat', permission).subscribe(
			data => {
				console.log(`Successfully created permission ${permission}`);
			},
			err => {
				console.log(`Error creating permission ${permission}: ${err}`);
			}
		);
	}

}
