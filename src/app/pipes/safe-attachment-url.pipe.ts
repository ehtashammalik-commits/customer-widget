import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { ConfigService } from '../services/config.service';

@Pipe({
  name: 'safeAttachmentUrl',
  pure: true // can be true since it's a pure transform
})
export class SafeAttachmentUrlPipe implements PipeTransform {
  constructor(
    private sanitizer: DomSanitizer,
    private appConfigService: ConfigService
  ) {}

  transform(mediaUrl: string): SafeUrl | null {
    if (!mediaUrl) return null;

    try {
      const url = new URL(mediaUrl);
      const filename = url.searchParams.get('filename');

      if (!filename) return null;

      const fileServerURL = this.appConfigService.appConfig.FILE_SERVER_URL;
      const fullUrl = `${fileServerURL}/api/downloadFileStream?filename=${filename}`;

      return this.sanitizer.bypassSecurityTrustUrl(fullUrl);
    } catch (e) {
      console.error('Invalid mediaUrl in safeAttachmentUrl pipe:', mediaUrl, e);
      return null;
    }
  }
}
