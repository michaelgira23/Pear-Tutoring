import {Directive, AfterViewChecked} from '@angular/core';
declare var componentHandler: any;

@Directive({
	selector: '[appMdl]'
})
export class MDLUpgradeElementDirective implements AfterViewChecked {
	ngAfterViewChecked() {
		componentHandler.upgradeAllRegistered();
	}
}
