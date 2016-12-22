import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { ChatService } from '../shared/model/chat.service';

@Component({
	selector: 'app-create-chat',
	templateUrl: './create-chat.component.html',
	styleUrls: ['./create-chat.component.scss']
})
export class CreateChatComponent implements OnInit {

	constructor(private router: Router, private chatService: ChatService) { }

	ngOnInit() {
	}

	create() {
		this.chatService.createChat().subscribe(
			data => {
				console.log('New chat room successfully created!');
				console.log(`New chat room key: ${data.getKey()}`);
				this.router.navigate(['chat', data.getKey()]);
			},
			err => {
				console.log(`Error creating chat room: ${err}`);
			}
		);
	}

}
