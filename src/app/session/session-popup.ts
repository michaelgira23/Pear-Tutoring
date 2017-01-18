import { ModalComponent } from '../shared/common/modal/modal.component';
import { ViewChild } from '@angular/core';
import { Subject } from 'rxjs/Rx';

export class SessionPopup {
	@ViewChild(ModalComponent) modal: ModalComponent;

	submitted$ = new Subject<boolean>();

	closeModal(submitted: boolean, e?: Event) {
		if (e) {e.stopPropagation(); };
		this.modal.hide();
		this.submitted$.next(submitted);
	}
}