import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { PermissionsService, Permission } from '../shared/security/permissions.service';
import { WhiteboardService, defaultWhiteboardOptions } from '../shared/model/whiteboard.service';

@Component({
	selector: 'app-create-whiteboard',
	templateUrl: './create-whiteboard.component.html',
	styleUrls: ['./create-whiteboard.component.scss']
})
export class CreateWhiteboardComponent implements OnInit {

	options = defaultWhiteboardOptions;
	permissions: Permission = {
		anonymous: {
			read: true,
			write: true
		},
		loggedIn: {
			read: true,
			write: true
		}
	};

	constructor(private router: Router, private permissionService: PermissionsService, private whiteboardService: WhiteboardService) { }

	ngOnInit() {
	}

	create() {
		// Create whiteboard
		this.whiteboardService.createWhiteboard(this.options)
			.subscribe(
				whiteboard => {
					console.log('create whiteboard successful', whiteboard);
					console.log('new whiteboard key', whiteboard.getKey());

					// Set whiteboard permissions
					this.permissionService.createPermission(whiteboard.getKey(), 'whiteboard', this.permissions)
						.subscribe(
							data => {
								console.log('created permissions', data);
								this.router.navigate(['whiteboard', whiteboard.getKey()]);
							},
							err => {
								console.log('there was an error creating permissions for the whiteboard!');
							}
						);

				},
				err => {
					console.log('there was an error creating the whiteboard!');
				}
			);
	}

}
