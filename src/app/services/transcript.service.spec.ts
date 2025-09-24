import { TranscriptService } from './transcript.service';
import { ConfigService } from './config.service';
import { StorageService } from './storage.service';
import { HttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';

describe('TranscriptService (Jest no TestBed)', () => {
  let service: TranscriptService;
  let mockHttp: jest.Mocked<HttpClient>;
  let mockConfig: Partial<ConfigService>;
  let mockStorage: Partial<StorageService>;

  beforeEach(() => {
    // Mock HttpClient
    mockHttp = {
      get: jest.fn(),
    } as any;

    // Mock ConfigService
    mockConfig = {
      appConfig: { CCM_URL: 'http://mock-ccm-url' },
    };

    // Mock StorageService
    mockStorage = {
      getItem: jest.fn().mockReturnValue('mock-token'),
    };

    service = new TranscriptService(
      mockHttp,
      mockConfig as ConfigService,
      mockStorage as StorageService,
    );
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should call HttpClient.get with correct URL and headers when token exists', () => {
    (mockHttp.get as jest.Mock).mockReturnValue(of({ success: true }));

    service.getTranscriptData({ conversationId: '123' }).subscribe((res) => {
      expect(res).toEqual({ success: true });
    });

    expect(mockHttp.get).toHaveBeenCalledWith(
      'http://mock-ccm-url/message?customerChannelIdentifier=null&serviceIdentifier=null&conversationId=123',
      { headers: { Authorization: 'Bearer mock-token' } },
    );
  });

  it('should call HttpClient.get with "Bearer null" if token is null', () => {
    (mockStorage.getItem as jest.Mock).mockReturnValueOnce(null);
    (mockHttp.get as jest.Mock).mockReturnValue(of({ success: true }));

    service.getTranscriptData({ conversationId: '456' }).subscribe();

    expect(mockHttp.get).toHaveBeenCalledWith(
      'http://mock-ccm-url/message?customerChannelIdentifier=null&serviceIdentifier=null&conversationId=456',
      { headers: { Authorization: 'Bearer null' } },
    );
  });

  it('should propagate error if HttpClient.get fails', (done) => {
    (mockHttp.get as jest.Mock).mockReturnValue(
      throwError(() => ({ status: 500, message: 'Server error' })),
    );

    service.getTranscriptData({ conversationId: '789' }).subscribe({
      next: () => done.fail('Expected error, got success'),
      error: (err) => {
        expect(err.status).toBe(500);
        done();
      },
    });
  });
});
