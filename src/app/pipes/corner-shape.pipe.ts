import { Pipe, PipeTransform } from '@angular/core';

/**
 * Returns a value appropriate for a `border-radius` style based on a
 * shape indicator coming from the message payload. The widget and
 * transcript both use this pipe to keep their markup clean and
 * declarative.
 *
 * The incoming value is expected to be one of:
 *   * `sharp`      – no rounding (0px)
 *   * `round`      – a moderately rounded corner (8px)
 *   * any other CSS length – passed through so that callers can specify
 *     custom radii like `2px`, `50%`, etc.
 *
 * If the argument is falsy the pipe defaults to `8px` (rounded).
 */
@Pipe({
  name: 'cornerShape'
})
export class CornerShapePipe implements PipeTransform {
  transform(shape?: string): string {
    if (!shape) {
      return '20px';
    }

    const normalized = shape.toLowerCase().trim();
    switch (normalized) {
      case 'sharp':
        return '0px';
      case 'round':
        return '20px';
      case 'soft':
        return '8px';
      default:
        // assume the caller is already supplying a valid CSS length value
        return shape;
    }
  }
}
