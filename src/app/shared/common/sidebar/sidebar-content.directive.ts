import { Directive, ElementRef, HostBinding } from '@angular/core';

@Directive({
	selector: '[appSidebarContent]',
})
export class SidebarContentDirective {
	@HostBinding('class') shadow = 'mdl-shadow--8dp';

	constructor(public el: ElementRef) { }

}
