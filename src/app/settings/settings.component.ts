import { Component, OnInit } from '@angular/core';
import { Validators, FormGroup, FormBuilder, FormControl } from '@angular/forms';
import { UserService} from '../shared/model/user.service';

@Component({
	selector: 'app-settings',
	templateUrl: './settings.component.html',
	styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {

	form: FormGroup;
	userPfp: File;
	finished: boolean;

	constructor(private fb: FormBuilder, private userService: UserService) {
		this.form = fb.group({
		});
	}

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
