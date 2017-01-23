import { Component, OnInit, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
	selector: 'app-text-list-control',
	templateUrl: './text-list-control.component.html',
	styleUrls: ['./text-list-control.component.scss'],
	providers: [{
		provide: NG_VALUE_ACCESSOR,
		useExisting: forwardRef(() => TextListControlComponent),
		multi: true
	}]
})
export class TextListControlComponent implements OnInit, ControlValueAccessor {

	private actuallTextList: string[];
	set textlist(list: string[]) {
		if (this.textList.toString() !== list.toString()) {
			this.actuallTextList = list;
		}
	}
	get textList(): string[] {
		return this.actuallTextList;
	}

	onChangeCallback: Function;

	constructor() { }

	ngOnInit() {
	}

	writeValue(val: string[]) {
		this.actuallTextList = val;
	}

	registerOnChange(fn: Function) {
		this.onChangeCallback = fn;
	}

	registerOnTouched() {}

}
