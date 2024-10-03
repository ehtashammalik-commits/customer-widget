import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'tagFormat',
})
export class tagFormatPipe implements PipeTransform {
  transform(value: string): string {
    // Replace ** with <strong> and </strong> only if both are present
    value = value.replace(
      /\*(.*?)\*/g,
      (_, group1) => `<strong>${group1}</strong>`,
    );

    // Replace __ with <i> and </i> only if both are present
    value = value.replace(/_(.*?)_/g, (_, group1) => `<i>${group1}</i>`);

    // Replace ~~ with <strike> and </strike> only if both are present
    value = value.replace(
      /~(.*?)~/g,
      (_, group1) => `<strike>${group1}</strike>`,
    );

    // Replace !! with <mark> and </mark> only if both are present
    value = value.replace(/!(.*?)!/g, (_, group1) => `<mark>${group1}</mark>`);

    return value;
  }
}
