import { Component, ViewChild } from '@angular/core';
import { Subject } from 'rxjs/Rx';

declare const dialogPolyfill: any;

@Component({
	selector: 'app-modal',
	templateUrl: './modal.component.html',
	styleUrls: ['./modal.component.scss']
})
export class ModalComponent {

	@ViewChild('modal') modal;

	constructor() {
		if (!this.modal.showModal) {
			dialogPolyfill.registerDialog(this.modal);
		}
	}

	show() {
		this.modal.showModal();
	}

	hide() {
		this.modal.close();
	}

}
