// safe-image.pipe.ts
import { Pipe, PipeTransform } from '@angular/core';
import { SdkService } from './services/sdk.service';
import {
  DomSanitizer,
  SafeResourceUrl,
  SafeUrl,
} from '@angular/platform-browser';

@Pipe({
  name: 'safeFileURL',
  pure: false,
})
export class SafeFileURLPipe implements PipeTransform {
  private cache: { [url: string]: SafeUrl | SafeResourceUrl | null | '' } = {};
  constructor(
    private readonly sdk: SdkService,
    private readonly sanitizer: DomSanitizer,
  ) {}

  transform(imageUrl: string): SafeUrl | SafeResourceUrl | null | undefined {
    if (!imageUrl) return null;

    if (!this.isTrustedUrl(imageUrl)) {
      this.cache[imageUrl] = null;
      return null;
    }

    if (this.cache[imageUrl] && this.cache[imageUrl] !== '') {
      return this.cache[imageUrl]; // blob already fetched
    }
    if (this.cache[imageUrl] === undefined) {
      this.cache[imageUrl] = '';
      this.sdk.getFileURLfromServer(imageUrl, (blobUrl: any) => {
        const safeUrl = this.createTrustedUrl(blobUrl || imageUrl);
        this.cache[imageUrl] = safeUrl;
        return safeUrl;
      });
    }

    return this.cache[imageUrl] === '' ? undefined : this.cache[imageUrl];
  }

  private isTrustedUrl(url: string): boolean {
    try {
      const parsedUrl = new URL(url, globalThis.location.origin);
      return (
        parsedUrl.protocol === 'blob:' ||
        parsedUrl.protocol === 'http:' ||
        parsedUrl.protocol === 'https:'
      );
    } catch {
      return false;
    }
  }

  private createTrustedUrl(url: string): SafeUrl | SafeResourceUrl | null {
    if (!this.isTrustedUrl(url)) {
      return null;
    }

    if (url.startsWith('blob:')) {
      // The SDK only returns blob URLs or file-server URLs that are validated above.
      return this.sanitizer.bypassSecurityTrustUrl(url); // NOSONAR
    }

    // The SDK only returns blob URLs or file-server URLs that are validated above.
    return this.sanitizer.bypassSecurityTrustResourceUrl(url); // NOSONAR
  }
}
