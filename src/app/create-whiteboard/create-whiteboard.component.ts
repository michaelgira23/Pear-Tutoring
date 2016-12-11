import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormGroup, FormBuilder } from '@angular/forms';

import { WhiteboardService } from '../shared/model/whiteboard.service';

@Component({
	selector: 'app-create-whiteboard',
	templateUrl: './create-whiteboard.component.html',
	styleUrls: ['./create-whiteboard.component.scss']
})
export class CreateWhiteboardComponent implements OnInit {

	form: FormGroup;

	constructor(private fb: FormBuilder, private whiteboardService: WhiteboardService) {
		this.form = this.fb.group({
			anyoneWrite: [true]
		});
	}

	ngOnInit() {
	}

	create() {
		const formValue = this.form.value;
		const anyoneWrite = formValue.anyoneWrite;
		console.log('create a form with anyone write: ' + anyoneWrite);
		this.whiteboardService.createWhiteboard({ anyoneWrite })
			.subscribe(
				data => {
					console.log('create whiteboard', data);
				},
				err => {
					console.log('there was an error creating the whiteboard!');
				}
			);
	}

}
