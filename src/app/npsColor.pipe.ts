import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'npsColor',
  pure: true
})

export class NpsColorPipe implements PipeTransform {
  transform(
    attributeIndex: number,
    optionIndex: number,
    selectedIndices: any): string {
    const selectedIndex = selectedIndices[attributeIndex];
    if (typeof selectedIndex === 'undefined') {
      return this.getColorByIndex(optionIndex);
    }
    return optionIndex === selectedIndex
      ? this.getColorByIndex(optionIndex)
      : '#DBDBDB';
  }

  private getColorByIndex(index: number): string {
    if (index <= 6) return '#F14949';
    if (index <= 8) return '#FECB2D';
    if (index <= 10) return '#28C591';
    return '#DBDBDB';
  }
}