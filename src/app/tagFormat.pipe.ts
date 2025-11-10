import { Pipe, PipeTransform } from '@angular/core';
// @ts-ignore
import { ibsFormat } from 'ibs-format';

@Pipe({
  name: 'tagFormat',
})
export class tagFormatPipe implements PipeTransform {
  transform(value: string | null | undefined, enableDynamicLink: boolean): string {
    if (!value) return '';

    value = value.replace(/&amp;#039;/g, "'")
                .replace(/&amp;quot;/g, '\"');

    return ibsFormat(
      value,
      [
        ['em', '`'],
        ['b', '*'],
        ['i', '_'],
        ['strike', '~'],
        ['mark', '!'],
      ],
      { detectLinks: false, target: "_blank" },
      { allowXssEscaping: false }
    );
  }
}
