import { Pipe, PipeTransform } from '@angular/core';
// @ts-ignore
import { ibsFormat } from 'ibs-format';

@Pipe({
  name: 'tagFormat',
})
export class tagFormatPipe implements PipeTransform {
  transform(value: string | null | undefined, enableDynamicLink: boolean): string {
    if (!value) return '';

    return ibsFormat(
      value,
      [
        ['em', '`'],
        ['b', '*'],
        ['i', '_'],
        ['strike', '~'],
        ['mark', '!'],
      ],
      { detectLinks: /\bhttps?:\/\/|www\./i.test(value), target: "_blank" },
      { allowXssEscaping: true }
    );
  }
}
