import { ImageOverlayComponent } from './image-overlay.component';

describe('ImageOverlayComponent', () => {
  let component: ImageOverlayComponent;

  beforeEach(() => {
    component = new ImageOverlayComponent();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default values for inputs', () => {
    expect(component.imageUrl).toBe('');
    expect(component.altText).toBe('');
    expect(component.isOpen).toBe(false);
  });

  it('should emit closeOverlay event when close() is called', () => {
    const emitSpy = jest.spyOn(component.closeOverlay, 'emit');

    component.close();

    expect(emitSpy).toHaveBeenCalled();
  });

  describe('onBackdropClick', () => {
    it('should call close() when target matches currentTarget (backdrop clicked)', () => {
      const closeSpy = jest.spyOn(component, 'close');
      const mockElement = document.createElement('div');
      const event = {
        target: mockElement,
        currentTarget: mockElement,
      } as unknown as MouseEvent;

      component.onBackdropClick(event);

      expect(closeSpy).toHaveBeenCalled();
    });

    it('should NOT call close() when target differs from currentTarget (child element clicked)', () => {
      const closeSpy = jest.spyOn(component, 'close');
      const backdrop = document.createElement('div');
      const image = document.createElement('img');
      const event = {
        target: image,
        currentTarget: backdrop,
      } as unknown as MouseEvent;

      component.onBackdropClick(event);

      expect(closeSpy).not.toHaveBeenCalled();
    });
  });

  describe('Input properties', () => {
    it('should accept imageUrl input', () => {
      component.imageUrl = 'https://example.com/image.jpg';
      expect(component.imageUrl).toBe('https://example.com/image.jpg');
    });

    it('should accept altText input', () => {
      component.altText = 'Sample alt text';
      expect(component.altText).toBe('Sample alt text');
    });

    it('should accept isOpen input', () => {
      component.isOpen = true;
      expect(component.isOpen).toBe(true);
    });
  });
});
