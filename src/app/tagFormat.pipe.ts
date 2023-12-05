import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'tagFormat'
})
export class tagFormatPipe implements PipeTransform {
  transform(value: string): string {
    // Replace * with <strong> and </strong> for both single and double occurrences
    value = value.replace(/\*\*(.*?)\*\*|\*(.*?)\*/g, (_, group1, group2) => group1 ? `<strong>${group1}</strong>` : `<strong>${group2}</strong>`);

    // Replace _ with <i> and </i> for both single and double occurrences
    value = value.replace(/__(.*?)__|_(.*?)_/g, (_, group1, group2) => group1 ? `<i>${group1}</i>` : `<i>${group2}</i>`);

    // Replace ~ with <strike> and </strike> for both single and double occurrences
    value = value.replace(/~~(.*?)~~|~(.*?)~/g, (_, group1, group2) => group1 ? `<strike>${group1}</strike>` : `<strike>${group2}</strike>`);

    // Replace ! with <mark> and </mark> for both single and double occurrences
    value = value.replace(/!!(.*?)!!|!(.*?)!/g, (_, group1, group2) => group1 ? `<mark>${group1}</mark>` : `<mark>${group2}</mark>`);

    return value;
  }
}
