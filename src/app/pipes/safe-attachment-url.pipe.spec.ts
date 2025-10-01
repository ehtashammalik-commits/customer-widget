import { SafeAttachmentUrlPipe } from './safe-attachment-url.pipe';
import { DomSanitizer } from '@angular/platform-browser';
import { ConfigService } from '../services/config.service';

describe('SafeAttachmentUrlPipe', () => {
  let pipe: SafeAttachmentUrlPipe;
  let mockSanitizer: jest.Mocked<DomSanitizer>;
  let mockConfigService: Partial<ConfigService>;

  beforeEach(() => {
    mockSanitizer = {
      bypassSecurityTrustUrl: jest.fn(),
    } as any;

    mockConfigService = {
      appConfig: {
        FILE_SERVER_URL: 'https://fileserver.com',
      },
    };

    pipe = new SafeAttachmentUrlPipe(
      mockSanitizer,
      mockConfigService as ConfigService,
    );
  });

  it('should create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should return null if mediaUrl is falsy', () => {
    expect(pipe.transform(null as any)).toBeNull();
    expect(pipe.transform(undefined as any)).toBeNull();
    expect(pipe.transform('')).toBeNull();
  });

  it('should return null if filename param is missing', () => {
    const urlWithoutFilename = 'https://example.com/file?id=123';
    expect(pipe.transform(urlWithoutFilename)).toBeNull();
  });

  it('should construct full URL and sanitize it', () => {
    const inputUrl = 'https://example.com/media?filename=test.pdf';
    const expectedUrl =
      'https://fileserver.com/api/downloadFileStream?filename=test.pdf';
    const safeUrlMock = { mocked: true } as any;

    mockSanitizer.bypassSecurityTrustUrl.mockReturnValue(safeUrlMock);

    const result = pipe.transform(inputUrl);

    expect(mockSanitizer.bypassSecurityTrustUrl).toHaveBeenCalledWith(
      expectedUrl,
    );
    expect(result).toBe(safeUrlMock);
  });

  it('should return null and log error if mediaUrl is invalid', () => {
    const invalidUrl = 'not a real url';
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    const result = pipe.transform(invalidUrl);

    expect(result).toBeNull();
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});
