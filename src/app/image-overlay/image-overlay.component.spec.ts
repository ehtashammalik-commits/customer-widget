import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImageOverlayComponent } from './image-overlay.component';

describe('ImageOverlayComponent', () => {
  let component: ImageOverlayComponent;
  let fixture: ComponentFixture<ImageOverlayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ImageOverlayComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ImageOverlayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit closeOverlay when close is called', () => {
    spyOn(component.closeOverlay, 'emit');
    component.close();
    expect(component.closeOverlay.emit).toHaveBeenCalled();
  });

  it('should close when backdrop is clicked', () => {
    spyOn(component.closeOverlay, 'emit');
    const event = new MouseEvent('click');
    Object.defineProperty(event, 'target', { value: event.currentTarget, configurable: true });
    component.onBackdropClick(event);
    expect(component.closeOverlay.emit).toHaveBeenCalled();
  });
});
