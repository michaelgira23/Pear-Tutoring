import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Validators, FormGroup, FormBuilder } from '@angular/forms';

import { WhiteboardService } from '../shared/model/whiteboard.service';

@Component({
	selector: 'app-create-whiteboard',
	templateUrl: './create-whiteboard.component.html',
	styleUrls: ['./create-whiteboard.component.scss']
})
export class CreateWhiteboardComponent implements OnInit {

	form: FormGroup;

	constructor(private router: Router, private fb: FormBuilder, private whiteboardService: WhiteboardService) {
		this.form = this.fb.group({
			anyoneWrite: [true],
			background: ['black', Validators.required]
		});
	}

	ngOnInit() {
	}

	create() {
		const formValue = this.form.value;

		const anyoneWrite = formValue.anyoneWrite;
		const background = formValue.background;

		console.log('create a form with anyone write: ' + anyoneWrite);
		this.whiteboardService.createWhiteboard({ anyoneWrite, background })
			.subscribe(
				data => {
					console.log('create whiteboard successful', data);
					console.log('new whiteboard key', data.getKey());
					this.router.navigate(['whiteboard', data.getKey()]);
				},
				err => {
					console.log('there was an error creating the whiteboard!');
				}
			);
	}

}
