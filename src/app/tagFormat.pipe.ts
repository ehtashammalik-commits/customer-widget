import { Pipe, PipeTransform } from '@angular/core';
// @ts-ignore
import { ibsFormat } from 'ibs-format';

@Pipe({
  name: 'tagFormat',
})
export class tagFormatPipe implements PipeTransform {
  transform(value: string, enableDynamicLink: boolean): string {
    value = ibsFormat(value,
      [
        ["em", "`"],
        ["b", "*"],
        ["i", "_"],
        ["strike", "~"],
        ["mark", "!"]
      ],
      { detectLinks: enableDynamicLink, target: "_blank"},
      { allowXssEscaping: true }
    );
    return value;
  }
}