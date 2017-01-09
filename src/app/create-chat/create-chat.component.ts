import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { ChatService } from '../shared/model/chat.service';
import { Permission, PermissionsService } from '../shared/security/permissions.service';

@Component({
	selector: 'app-create-chat',
	templateUrl: './create-chat.component.html',
	styleUrls: ['./create-chat.component.scss']
})
export class CreateChatComponent implements OnInit {

	permissions: Permission = {
		anonymous: {
			read: true,
			write: false
		},
		loggedIn: {
			read: true,
			write: true
		}
	};

	constructor(private router: Router, private chatService: ChatService, private permissionsService: PermissionsService) { }

	ngOnInit() {
	}

	create() {
		this.chatService.createChat().subscribe(
			data => {
				let chatKey = data.getKey();

				console.log('New chat room successfully created!');
				console.log(`New chat room key: ${chatKey}`);

				this.permissionsService.createPermission(chatKey, 'chat', this.permissions).subscribe(
					data => {
						console.log(`Created chat permissions: ${data}`);
						this.router.navigate(['chat', chatKey]);
					},
					err => {
						console.log(`Error creating permissions for new chat room: ${err}`);
					}
				);
			},
			err => {
				console.log(`Error creating chat room: ${err}`);
			}
		);
	}

}
