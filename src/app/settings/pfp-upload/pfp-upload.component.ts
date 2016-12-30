import { Component, OnInit } from '@angular/core';
import { UserService} from '../../shared/model/user.service';

@Component({
	selector: 'app-pfp-upload',
	templateUrl: './pfp-upload.component.html',
	styleUrls: ['./pfp-upload.component.scss']
})
export class PfpUploadComponent implements OnInit {

	userPfp: File;
	finished: boolean;

	constructor(private userService: UserService) { }

	ngOnInit() {
	}

	saveSettings() {
		this.userService.uploadPfp(this.userPfp).subscribe(val => {
			this.finished = true;
		},
		console.log);
	}

	onPfpChange($event) {
		this.userPfp = $event.target.files[0];
	}

}
