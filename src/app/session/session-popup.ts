import { ModalComponent } from '../shared/common/modal/modal.component';
import { ViewChild, Input, Renderer, AfterViewInit } from '@angular/core';
import { Subject } from 'rxjs/Rx';

export abstract class SessionPopup implements AfterViewInit {
	@Input('isModal') isModal: boolean;

	@ViewChild(ModalComponent) modal: ModalComponent;

	submitted$ = new Subject<boolean>();

	constructor(protected renderer: Renderer) {
	}

	closeModal(submitted: boolean, e?: Event) {
		if (e) {e.stopPropagation(); };
		this.modal.hide();
		this.submitted$.next(submitted);
	}

	ngAfterViewInit() {
		if (!this.isModal) {
			this.renderer.attachViewAfter(this.modal.modalEl, [this.modal.header.nativeElement, this.modal.content.nativeElement]);
		}
	}
}
