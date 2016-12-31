import {Directive, AfterViewChecked} from '@angular/core';
declare var componentHandler: any;

@Directive({
	selector: '[mdl]'
})
export class MDLUpgradeElementDirective implements AfterViewChecked {
	ngAfterViewChecked() {
		componentHandler.upgradeAllRegistered();
	}
}