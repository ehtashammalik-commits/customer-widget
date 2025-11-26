import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'simplifyOptions',
})
export class SimplifyOptionsPipe implements PipeTransform {
  transform(options: any[]): any[] {
    if (!options) return [];
    return options.map((option) => option.label);
  }
}
