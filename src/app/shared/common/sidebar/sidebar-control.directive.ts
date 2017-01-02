import { Directive, HostListener } from '@angular/core';
import { BehaviorSubject } from 'rxjs/Rx';

@Directive({
	selector: '[appSidebarControl]'
})
export class SidebarControlDirective {

	open: boolean;
	open$ = new BehaviorSubject<boolean>(true);

	constructor() { }

	@HostListener('click', ['$event.target']) onClick() {
		this.open = !this.open;
		this.open$.next(this.open);
	}

}
