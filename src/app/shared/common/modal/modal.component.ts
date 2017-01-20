import { Component, AfterViewChecked, ViewChild } from '@angular/core';

declare const dialogPolyfill: any;

@Component({
	selector: 'app-modal',
	templateUrl: './modal.component.html',
	styleUrls: ['./modal.component.scss']
})
export class ModalComponent implements AfterViewChecked {

	@ViewChild('modal') modal;
	modalEl: any;

	// FIXME: this lifecycle hook doesn't fire late enough. it doesn't end up detect the modal element
	ngAfterViewChecked() {
		this.modalEl = this.modal.nativeElement;

		if (!this.modalEl.showModal) {
			dialogPolyfill.registerDialog(this.modalEl);
		}
	}

	show() {
		console.log(this.modalEl);
		this.modalEl.showModal();
	}

	hide() {
		console.log(this.modalEl);
		this.modalEl.close();
	}

}
