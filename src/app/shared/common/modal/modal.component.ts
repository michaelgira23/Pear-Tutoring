import { Component } from '@angular/core';
import { Subject } from 'rxjs/Rx';

@Component({
	selector: 'app-modal',
	templateUrl: './modal.component.html',
	styleUrls: ['./modal.component.scss']
})
export class ModalComponent {

	public visible: boolean;

	public show(): void {
		this.visible = true;
	}

	public hide(): void {
		this.visible = false;
	}

	public onClick(e: Event): void {
		e.stopPropagation();
	}
}
