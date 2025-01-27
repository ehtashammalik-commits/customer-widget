import { Pipe, PipeTransform } from '@angular/core';
// @ts-ignore
import { ibsFormat } from '../lib/ibs-format.js';
@Pipe({
  name: 'tagFormat',
})
export class tagFormatPipe implements PipeTransform {
  transform(value: string): string {
    console.log(value);
    value = ibsFormat(value,
      [
        ["em", "`"],
        ["b", "*"],
        ["i", "_"],
        ["strike", "~"],
        ["mark", "!"]
      ],
      { detectLinks: false, target: "_blank" },
      { allowXssEscaping: false }
    );
    return value;
  }
}
