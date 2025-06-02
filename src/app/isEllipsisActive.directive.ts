import { AfterViewInit, Directive, ElementRef, EventEmitter, HostListener, Output } from '@angular/core';

@Directive({
    selector: '[isEllipsisActive]'
})
export class IsEllipsisActiveDirective {

    constructor(private elementRef: ElementRef) { }

    @HostListener('mouseenter')
    onMouseEnter(): void {
        // console.log("mouse enter ")
        setTimeout(() => {
            const element = this.elementRef.nativeElement;
            if (element.offsetWidth < element.scrollWidth) {
                element.title = element.textContent;
            }
            else if (element.title) element.removeAttribute('title');
        });
    }
}
