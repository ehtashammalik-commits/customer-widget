import { SanitizeHtmlForEmailPipe } from './sanitize-html-for-email.pipe';

describe('SanitizeHtmlForEmailPipe', () => {
  it('create an instance', () => {
    const pipe = new SanitizeHtmlForEmailPipe();
    expect(pipe).toBeTruthy();
  });
});
