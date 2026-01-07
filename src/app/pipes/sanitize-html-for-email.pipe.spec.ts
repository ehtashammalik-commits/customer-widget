import { SanitizeHtmlForEmail } from './sanitize-html-for-email.pipe';
import { DomSanitizer } from '@angular/platform-browser';

describe('SanitizeHtmlForEmail Pipe', () => {
  let mockSanitizer: jest.Mocked<DomSanitizer>;
  let pipe: SanitizeHtmlForEmail;

  beforeEach(() => {
    mockSanitizer = {
      bypassSecurityTrustHtml: jest.fn(),
    } as any;

    pipe = new SanitizeHtmlForEmail(mockSanitizer);
  });

  it('should create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should return empty string when input is null/undefined/empty', () => {
    expect(pipe.transform(null as any)).toBe('');
    expect(pipe.transform(undefined as any)).toBe('');
    expect(pipe.transform('')).toBe('');
  });

  it('should call bypassSecurityTrustHtml with provided HTML', () => {
    const html = '<p>Hello World</p>';
    const safeHtmlMock = { mocked: true } as any;

    mockSanitizer.bypassSecurityTrustHtml.mockReturnValue(safeHtmlMock);

    const result = pipe.transform(html);

    expect(mockSanitizer.bypassSecurityTrustHtml).toHaveBeenCalledWith(html);
    expect(result).toBe(safeHtmlMock);
  });
});
