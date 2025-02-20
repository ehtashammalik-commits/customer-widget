import { HttpClient } from '@angular/common/http';
import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Pipe({
  name: 'svgFormat'
})
export class SvgNpsFormatPipe implements PipeTransform {


  constructor(private sanitizer: DomSanitizer, private http: HttpClient) { }

  transform(value: any, type:'imageSvg', width?: string, height?: string, className?: string, fillColor?: string, inputText?: any): any {
    switch (type) {
      case 'imageSvg':
        return this.imageUrlToSvgTag(value, width || '', height || '', className || '', fillColor || '', inputText || '');
      default:
        return value;
    }
  }


  /** NPS Color Transformation **/
  private getNpsColor(index: number): string {
    console.log(index)
    if (index >= 0 && index <= 6) return '#F14949'; // Red
    if (index >= 7 && index <= 8) return '#FECB2D'; // Yellow
    if (index >= 9 && index <= 10) return '#28C591'; // Green
    return '#DBDBDB';
  }

  /** Convert Image URL to Inline SVG Using HTTP Request **/
  private imageUrlToSvgTag(
    imageUrl: string,
    width: string,
    height: string,
    className: string = '',
    fillColor: string = '',
    inputText: string = ''
  ): Observable<any> {
    return this.http.get(imageUrl, { responseType: 'text' }).pipe(
      map((svgData: any) => {
        const parser = new DOMParser();
        const svgDoc: any = parser.parseFromString(svgData, 'image/svg+xml');
        const svgElement = svgDoc?.documentElement as SVGElement;

        if (width) svgElement.setAttribute('width', width);
        if (height) svgElement.setAttribute('height', height);

        if (fillColor) {
          svgElement.querySelectorAll('path').forEach((path) => {
            path.setAttribute('fill', fillColor);
          });
        }

        if (className) {
          svgElement.setAttribute('class', className);
        }

        if (inputText) {
          const textElement = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          textElement.setAttribute('x', '50%');
          textElement.setAttribute('y', '50%');
          textElement.setAttribute('text-anchor', 'middle');
          textElement.setAttribute('dominant-baseline', 'middle');
          textElement.setAttribute('font-size', '12px');
          textElement.setAttribute('fill', '#FFFFFF');
          textElement.textContent = inputText;
          svgElement.appendChild(textElement);
        }

        return this.sanitizer.bypassSecurityTrustHtml(svgElement.outerHTML);
      }),
      catchError((error) => {
        console.error(`Failed to fetch SVG from ${imageUrl}`, error);
        return of(null);
      })
    );
  }

}
