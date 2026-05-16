// safe-image.pipe.ts
import { Pipe, PipeTransform } from '@angular/core';
import { SdkService } from './services/sdk.service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

@Pipe({
  name: 'safeFileURL',
  pure: false,
})
export class SafeFileURLPipe implements PipeTransform {
  private cache: { [url: string]: SafeUrl } = {};
  constructor(
    private readonly sdk: SdkService,
    private readonly sanitizer: DomSanitizer,
  ) {}

  transform(imageUrl: string): any {
    if (!imageUrl) return null;
    if (this.cache[imageUrl] && this.cache[imageUrl] !== '') {
      return this.cache[imageUrl]; // blob already fetched
    }
    if (this.cache[imageUrl] === undefined) {
      this.cache[imageUrl] = '';
      this.sdk.getFileURLfromServer(imageUrl, (blobUrl: any) => {
        const safeUrl = blobUrl
          ? this.sanitizer.bypassSecurityTrustUrl(blobUrl)
          : this.sanitizer.bypassSecurityTrustResourceUrl(imageUrl);
        this.cache[imageUrl] = safeUrl;
        return safeUrl;
      });
    }
  }
}
