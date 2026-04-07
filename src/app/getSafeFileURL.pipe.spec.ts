import { SafeFileURLPipe } from './getSafeFileURL.pipe';
import { DomSanitizer } from '@angular/platform-browser';

describe('SafeFileURLPipe', () => {
  let pipe: SafeFileURLPipe;
  let mockSdk: any;
  let mockSanitizer: any;

  beforeEach(() => {
    mockSdk = {
      getFileURLfromServer: jest.fn(),
    };
    mockSanitizer = {
      bypassSecurityTrustUrl: jest.fn((url) => `safe:${url}`),
    };
    pipe = new SafeFileURLPipe(mockSdk, mockSanitizer as DomSanitizer);
  });

  it('should return null if imageUrl is falsy', () => {
    expect(pipe.transform('')).toBeNull();
    expect(pipe.transform(null as any)).toBeNull();
    expect(pipe.transform(undefined as any)).toBeNull();
  });

  it('should return cached SafeUrl if already fetched', () => {
    pipe['cache']['foo'] = 'safe:foo' as any;
    expect(pipe.transform('foo')).toBe('safe:foo');
  });

  it('should call sdk.getFileURLfromServer and cache result if not cached', () => {
    mockSdk.getFileURLfromServer.mockImplementation((url, cb) =>
      cb('blob:bar'),
    );
    pipe['cache'] = {}; // clear cache

    pipe.transform('bar'); // <-- Call transform to trigger the logic

    expect(mockSdk.getFileURLfromServer).toHaveBeenCalledWith(
      'bar',
      expect.any(Function),
    );
    expect(mockSanitizer.bypassSecurityTrustUrl).toHaveBeenCalledWith(
      'blob:bar',
    );
    expect(pipe['cache']['bar']).toBe('safe:blob:bar');
  });

  it('should not call sdk.getFileURLfromServer again if cache is empty string', () => {
    pipe['cache']['baz'] = '';
    expect(pipe.transform('baz')).toBeUndefined(); // <-- undefined, not ''
    expect(mockSdk.getFileURLfromServer).not.toHaveBeenCalled();
  });
});
