// sanitize-html.pipe.spec.ts
import { SanitizeHtmlPipe } from './sanitizeHtml.pipe';
import { DomSanitizer } from '@angular/platform-browser';

describe('SanitizeHtmlPipe', () => {
  let pipe: SanitizeHtmlPipe;
  let mockSanitizer: jest.Mocked<DomSanitizer>;

  beforeEach(() => {
    mockSanitizer = {
      bypassSecurityTrustHtml: jest.fn((value) => value),
    } as any;

    pipe = new SanitizeHtmlPipe(mockSanitizer);
  });

  it('should create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should return empty string if input is null or undefined', () => {
    expect(pipe.transform(null as any)).toBe('');
    expect(pipe.transform(undefined as any)).toBe('');
  });

  it('should escape special characters and call bypassSecurityTrustHtml', () => {
    const input = `<div class="test">Hello & Bye</div>`;
    const expectedEscaped = `&lt;div class=&quot;test&quot;&gt;Hello &amp; Bye&lt;/div&gt;`;

    const result = pipe.transform(input);

    expect(mockSanitizer.bypassSecurityTrustHtml).toHaveBeenCalledWith(
      expectedEscaped,
    );
    expect(result).toBe(expectedEscaped);
  });

  it('should escape single quotes as &#039;', () => {
    const input = `<span data-val='x'>O'Reilly</span>`;
    const expectedEscaped =
      `&lt;span data-val=&#039;x&#039;&gt;O&#039;Reilly&lt;/span&gt;`;

    const result = pipe.transform(input);

    expect(mockSanitizer.bypassSecurityTrustHtml).toHaveBeenCalledWith(
      expectedEscaped,
    );
    expect(result).toBe(expectedEscaped);
  });
});
