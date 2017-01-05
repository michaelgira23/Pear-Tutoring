import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

/*
 * Bypasses Angular 2's sanitization to display things like URLs for iframes.
 * WARNING: Only use this if you have already sanitized the input!
 * DO NOT USE THIS IF YOU DON'T KNOW WHAT YOU ARE DOING.
 */

@Pipe({
	name: 'safeHtml'
})
export class SafeHtmlPipe implements PipeTransform {
	constructor(private sanitizer: DomSanitizer) { }

	transform(value: any) {
		return this.sanitizer.bypassSecurityTrustHtml(value);
	}
}

@Pipe({
	name: 'safeScript'
})
export class SafeScriptPipe implements PipeTransform {
	constructor(private sanitizer: DomSanitizer) { }

	transform(value: any) {
		return this.sanitizer.bypassSecurityTrustScript(value);
	}
}

@Pipe({
	name: 'safeStyle'
})
export class SafeStylePipe implements PipeTransform {
	constructor(private sanitizer: DomSanitizer) { }

	transform(value: any) {
		return this.sanitizer.bypassSecurityTrustStyle(value);
	}
}

@Pipe({
	name: 'safeUrl'
})
export class SafeUrlPipe implements PipeTransform {
	constructor(private sanitizer: DomSanitizer) { }

	transform(value: any) {
		return this.sanitizer.bypassSecurityTrustUrl(value);
	}
}

@Pipe({
	name: 'safeResourceUrl'
})
export class SafeResourceUrlPipe implements PipeTransform {
	constructor(private sanitizer: DomSanitizer) { }

	transform(value: any) {
		return this.sanitizer.bypassSecurityTrustResourceUrl(value);
	}
}
