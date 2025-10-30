// svg-nps-format.pipe.spec.ts
import { SvgNpsFormatPipe } from './svgFormat.pipe';
import { DomSanitizer } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';

describe('SvgNpsFormatPipe', () => {
  let pipe: SvgNpsFormatPipe;
  let mockSanitizer: jest.Mocked<DomSanitizer>;
  let mockHttp: jest.Mocked<HttpClient>;

  const sampleSvg = `<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0h10v10z"/></svg>`;

  beforeEach(() => {
    mockSanitizer = {
      bypassSecurityTrustHtml: jest.fn((html) => html),
    } as any;

    mockHttp = {
      get: jest.fn(),
    } as any;

    pipe = new SvgNpsFormatPipe(mockSanitizer, mockHttp);
  });

  it('should create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should return value directly if type is not imageSvg', () => {
    const result = pipe.transform('abc', 'otherType' as any);
    expect(result).toBe('abc');
  });

  it('should fetch SVG and sanitize it with attributes applied', (done) => {
    mockHttp.get.mockReturnValue(of(sampleSvg));

    pipe
      .transform('http://test.com/icon.svg', 'imageSvg', '100', '200', 'my-class', '#FF0000', 'Hello')
      .subscribe((result) => {
        expect(mockHttp.get).toHaveBeenCalledWith('http://test.com/icon.svg', { responseType: 'text' });

        // Ensure sanitizer was called with modified SVG
        expect(mockSanitizer.bypassSecurityTrustHtml).toHaveBeenCalled();
        const sanitizedSvg = mockSanitizer.bypassSecurityTrustHtml.mock.calls[0][0];

        expect(sanitizedSvg).toContain('width="100"');
        expect(sanitizedSvg).toContain('height="200"');
        expect(sanitizedSvg).toContain('class="my-class"');
        expect(sanitizedSvg).toContain('fill="#FF0000"');
        expect(sanitizedSvg).toContain('Hello');

        done();
      });
  });

  it('should return null when http.get fails', (done) => {
    mockHttp.get.mockReturnValue(throwError(() => new Error('Network error')));

    pipe.transform('bad-url', 'imageSvg').subscribe((result) => {
      expect(result).toBeNull();
      done();
    });
  });
});
