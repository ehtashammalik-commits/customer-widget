import { SanitizeHtmlForEmail } from './sanitize-html-for-email.pipe';

describe('SanitizeHtmlForEmail', () => {
  it('create an instance', () => {
    const mockSanitizer = { sanitize: jest.fn(), bypassSecurityTrustHtml: jest.fn() } as any;
    const pipe = new SanitizeHtmlForEmail(mockSanitizer);
    expect(pipe).toBeTruthy();
  });
});
