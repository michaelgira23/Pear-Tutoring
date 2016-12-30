import { Component, OnInit } from '@angular/core';
import { AngularFire } from 'angularfire2';
import { PermissionsService, PermissionsChatScopes } from '../shared/security/permissions.service';

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

		let scopes = {
			read: true,
			write: false,
			shouldBeDeleted: true
		};

		this.permissionsService.addScope('-KZzCW_RP3Fkz0Kp6KpV', 'chat', new PermissionsChatScopes(scopes), 'anonymous').subscribe(
			data => {
				console.log('Successfully added scope!');
			},
			err => {
				console.log(`Error adding scope: ${err}`);
			}
		);
	}

}
