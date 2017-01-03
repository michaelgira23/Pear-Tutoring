import { Component, OnInit } from '@angular/core';
import { AngularFire } from 'angularfire2';
import { PermissionsService, PermissionsChatScopes, PermissionsWhiteboardScopes } from '../shared/security/permissions.service';

@Component({
	selector: 'app-test',
	templateUrl: './test.component.html',
	styleUrls: ['./test.component.scss']
})
export class TestComponent implements OnInit {

	constructor(private af: AngularFire, private permissionsService: PermissionsService) { }

	ngOnInit() {
		this.permissionsService.getUserPermission('-K_ReQRXExIGcsHj7O4e', 'chat').subscribe(
			data => {
				console.log('Successfully got user permission', data);
			},
			err => {
				console.log(`Error getting current user permission: ${err}`);
			}
		);

		let scopes = {
			read: true,
			write: false,
			testingIsFun: true
		};

		this.permissionsService.addScope('-K_ReQRXExIGcsHj7O4e', 'chat', new PermissionsChatScopes(scopes), 'anonymous').subscribe(
			data => {
				console.log('Successfully added scope');
			},
			err => {
				console.log(`Error adding scope: ${err}`);
			}
		);

		this.permissionsService.removeScope('-K_ReQRXExIGcsHj7O4e', 'chat', new PermissionsWhiteboardScopes(scopes), 'anonymous').subscribe(
			data => {
				console.log('Successfully added scope');
			},
			err => {
				console.log(`Error adding scope: ${err}`);
			}
		);
	}

}
