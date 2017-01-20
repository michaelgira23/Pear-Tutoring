import { Component, OnInit, ViewChild } from '@angular/core';

declare const dialogPolyfill: any;

@Component({
	selector: 'app-modal',
	templateUrl: './modal.component.html',
	styleUrls: ['./modal.component.scss']
})
export class ModalComponent implements OnInit {

	@ViewChild('modal') modal;
	modalEl: any;

	// FIXME: this lifecycle hook doesn't fire late enough. it doesn't end up detect the modal element
	ngOnInit() {
		// this.modalEl = this.modal.nativeElement;
		this.initializeModal();
		console.log('modal element', this.modalEl);

		if (!this.modalEl.showModal) {
			dialogPolyfill.registerDialog(this.modalEl);
		}
	}

	initializeModal() {
		this.modalEl = this.modal.nativeElement;
	}

	show() {
		if (!this.modalEl) {
			this.initializeModal();
		}

		console.log('show modal', this.modalEl);
		this.modalEl.showModal();
	}

	hide() {
		if (!this.modalEl) {
			this.initializeModal();
		}

		console.log('hide modal', this.modalEl);
		this.modalEl.close();
	}

}
