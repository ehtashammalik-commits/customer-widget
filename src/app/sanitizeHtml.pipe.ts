// sanitize-html.pipe.ts
import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({ name: 'sanitizeHtml' })
export class SanitizeHtmlPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(html: string): SafeHtml {
    if (!html) return '';

    html = html.replace(/&(?!amp;|lt;|gt;|quot;|#039;)/g, '&amp;');
    html = html.replace(/</g, '&lt;');
    html = html.replace(/>/g, '&gt;');
    html = html.replace(/"/g, '&quot;');
    html = html.replace(/'/g, '&#039;');

    return this.sanitizer.bypassSecurityTrustHtml(html);
  }
}
