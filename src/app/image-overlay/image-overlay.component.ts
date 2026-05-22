import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-image-overlay',
  templateUrl: './image-overlay.component.html',
  styleUrls: ['./image-overlay.component.scss'],
})
export class ImageOverlayComponent {
  @Input() imageUrl: string = '';
  @Input() altText: string = '';
  @Input() isOpen: boolean = false;
  @Output() closeOverlay = new EventEmitter<void>();

  close(): void {
    this.closeOverlay.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.close();
    }
  }
}
