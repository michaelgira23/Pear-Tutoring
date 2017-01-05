import { Component, OnInit, Output, Input, EventEmitter } from '@angular/core';
import { Whiteboard } from '../../shared/model/whiteboard';

@Component({
	selector: 'app-whiteboard-select',
	templateUrl: './whiteboard-select.component.html',
	styleUrls: ['./whiteboard-select.component.scss']
})
export class WhiteboardSelectComponent implements OnInit {

	onChangeCallback: any;

	selectedWbIndex: number;

	@Input() whiteboards: Whiteboard[];

	@Output() onSelect  = new EventEmitter<number>();

	constructor() { }

	ngOnInit() {
	}

	selectWb(i: number) {
		this.onSelect.emit(i);
	}
}
