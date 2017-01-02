import { Component, ContentChild, AfterContentInit, HostListener, ElementRef, Input} from '@angular/core';
import { SidebarControlDirective } from './sidebar-control.directive';
import { SidebarContentDirective } from './sidebar-content.directive';

@Component({
	selector: 'app-sidebar',
	templateUrl: './sidebar.component.html',
	styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements AfterContentInit {

	@ContentChild(SidebarContentDirective) content: SidebarContentDirective;

	@ContentChild(SidebarControlDirective) control: SidebarControlDirective;

	@Input() orientation: string;

	open() {
		this.content.open = true;
	};

	close() {
		this.content.open = false;
	};

	constructor(private _elementRef: ElementRef) { }

	ngAfterContentInit() {
		this.control.open$.subscribe(val => {
			val ? this.open() : this.close();
		});
	}

	@HostListener('document:click', ['$event'])
	onClick(event: MouseEvent) {
		event.stopPropagation();
		const clickedInside = this._elementRef.nativeElement.contains(event.target);
		if (!clickedInside) {
			this.control.open$.next(false);
			this.control.open = false;
		}
	}

}
