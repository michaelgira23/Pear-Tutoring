import { Directive, HostBinding } from '@angular/core';

@Directive({
	selector: '[appSidebarContent]',
})
export class SidebarContentDirective {
	@HostBinding('class.mdl-shadow--8dp') shadow: boolean = true;
	@HostBinding('class.open') open: boolean = false;

	constructor() { }

}
