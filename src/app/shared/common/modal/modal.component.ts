import { Component } from '@angular/core';

@Component({
	selector: 'app-modal',
	templateUrl: './modal.component.html',
	styleUrls: ['./modal.component.scss']
})
export class ModalComponent {

	public visible = false;

	public show(): void {
		this.visible = true;
	}

	public hide(): void {
		this.visible = false;
	}
}