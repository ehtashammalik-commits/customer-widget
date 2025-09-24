// chat-transcript.component.spec.ts
import { TranscriptComponent } from './chat-transcript.component';
import { of, throwError } from 'rxjs';
import { DomSanitizer, SafeUrl, SafeResourceUrl } from '@angular/platform-browser';

describe('TranscriptComponent (unit)', () => {
  let component: TranscriptComponent;

  const mockRoute: any = {
    queryParams: { subscribe: jest.fn() },
  };

  const mockTranscriptService: any = {
    getTranscriptData: jest.fn(),
  };

  const mockConfigService: any = {
    appConfig: {
      ENABLE_TRANSCRIPT_NOTIFICATIONS: true,
      CCM_URL: 'https://example.com/some/path',
      FILE_SERVER_URL: 'https://example.com/file-engine',
    },
  };

  const mockSanitizer: Partial<DomSanitizer> = {
    bypassSecurityTrustUrl: jest.fn((v) => v as unknown as SafeUrl),
    bypassSecurityTrustResourceUrl: jest.fn((v) => v as unknown as SafeResourceUrl),
  };

  const mockNgxLoader: any = { start: jest.fn(), stop: jest.fn() };
  const mockTitle: any = { setTitle: jest.fn() };
  const mockTranslate: any = { setDefaultLang: jest.fn(), use: jest.fn() };
  const mockStorageService: any = { getItem: jest.fn() };


  Object.defineProperty(URL, 'createObjectURL', {
    writable: true,
    value: jest.fn(() => 'blob:mock-url'),
  });

  Object.defineProperty(URL, 'revokeObjectURL', {
    writable: true,
    value: jest.fn(),
  });


  beforeEach(() => {
    jest.clearAllMocks();

    component = new TranscriptComponent(
      mockRoute,
      mockTranscriptService,
      mockConfigService,
      mockSanitizer as DomSanitizer,
      mockNgxLoader ,
      mockTitle ,
      mockTranslate,
      mockStorageService,
    );
  });

  // -------------------------------
  // loadChatData tests
  // -------------------------------
  describe('loadChatData', () => {
    it('should process messages, update date and set processedMessages', async () => {
      // prepare a raw timestamp (used to set chatDate)
      const rawTs = new Date(2023, 3, 5, 10, 0, 0).toISOString();

      // original message
      const original = {
        id: 'm1',
        header: { timestamp: rawTs, messageId: 'm1' },
        body: { type: 'PLAIN', markdownText: 'original' },
      };

      // update intent that refers to original
      const updateMsg = {
        id: 'm2',
        header: { originalMessageId: 'm1', intent: 'update', timestamp: rawTs },
        body: { type: 'PLAIN', markdownText: 'updated text' },
      };

      // delivery notification for m1 with status FAILED -> isBlurred true
      const delivery = {
        id: 'm3',
        header: { timestamp: rawTs },
        body: { type: 'DELIVERYNOTIFICATION', messageId: 'm1', status: 'FAILED' },
      };

      mockTranscriptService.getTranscriptData.mockReturnValue(of([original, updateMsg, delivery]));

      await component.loadChatData({ conversationId: 'c1' });

      // processedMessages should contain the original message only (update modifies it)
      expect(component.processedMessages.length).toBe(2);
      expect(component.processedMessages[0].body.markdownText).toBe('updated text');
      expect(component.processedMessages[0].isEdited).toBe(true);
      expect(component.processedMessages[0].isBlurred).toBe(true);

      // chatDate should reflect the timestamp
      expect(component.chatDate).toBe('2023/04/05');
    });

    it('should handle messages without timestamp gracefully and not throw', async () => {
      const msg = { id: 'x', header: {}, body: { type: 'PLAIN', markdownText: 't' } };
      mockTranscriptService.getTranscriptData.mockReturnValue(of([msg]));
      await expect(component.loadChatData({ conversationId: 'c1' })).resolves.not.toThrow();
      expect(component.processedMessages.length).toBe(1);
    });

    it('should log error on failure and not throw', async () => {
      const err = new Error('network');
      mockTranscriptService.getTranscriptData.mockReturnValue(throwError(() => err));
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
      await component.loadChatData({ conversationId: 'c1' });
      expect(spy).toHaveBeenCalledWith('Error loading chat data:', err);
    });
  });

  // -------------------------------
  // loadIcons tests
  // -------------------------------
  describe('loadIcons', () => {
    const fakeBlob = new Blob(['svgdata'], { type: 'image/svg+xml' });
    const createObjectUrlSpy = jest.spyOn(URL, 'createObjectURL').mockImplementation(() => 'blob:mock');

    beforeEach(() => {
      createObjectUrlSpy.mockClear();
    });

    it('should fetch and store safe urls for successful fetches', async () => {
      // mock fetch to succeed and return a blob
      (global as any).fetch = jest.fn().mockResolvedValue({
        ok: true,
        blob: async () => fakeBlob,
      });

      const senderIconMap = { a: 'https://example.com/a.svg' };
      mockStorageService.getItem.mockReturnValue('token-abc');

      await component.loadIcons(senderIconMap, 'token-abc');

      // sanitizer.bypassSecurityTrustUrl should have been used
      expect(mockSanitizer.bypassSecurityTrustUrl).toHaveBeenCalled();
      // senderIconMapSafe should contain blob url (string)
      expect(component.senderIconMapSafe['a']).toBe('blob:mock');
    });

    it('should set empty string and log error on failed fetch', async () => {
      (global as any).fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
      });
      const spyErr = jest.spyOn(console, 'error').mockImplementation(() => {});
      await component.loadIcons({ a: 'u' }, 'token');
      expect(component.senderIconMapSafe['a']).toBe('');
      expect(spyErr).toHaveBeenCalled();
    });

    it('should catch fetch rejection and set empty and log', async () => {
      (global as any).fetch = jest.fn().mockRejectedValue(new Error('network'));
      const spyErr = jest.spyOn(console, 'error').mockImplementation(() => {});
      await component.loadIcons({ a: 'u' }, '');
      expect(component.senderIconMapSafe['a']).toBe('');
      expect(spyErr).toHaveBeenCalled();
    });
  });

  // -------------------------------
  // printChatTranscript tests
  // -------------------------------
  describe('printChatTranscript', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      (window as any).print = jest.fn();
    });

    afterEach(() => {
      jest.useRealTimers();
      (window as any).print = undefined;
    });

    it('should not call window.print when state !== download', () => {
      component.state = 'view';
      component.printChatTranscript();
      jest.advanceTimersByTime(3000);
      expect((window as any).print).not.toHaveBeenCalled();
    });

    it('should call window.print when state === download after timeout', () => {
      component.state = 'download';
      component.printChatTranscript();
      jest.advanceTimersByTime(2000);
      expect((window as any).print).toHaveBeenCalled();
    });
  });

  // -------------------------------
  // getInitialsFromFullName tests
  // -------------------------------
  describe('getInitialsFromFullName', () => {
    it('returns empty for blank input', () => {
      expect(component.getInitialsFromFullName('')).toBe('');
      expect(component.getInitialsFromFullName('   ')).toBe('');
    });

    it('returns two letters from first/last when single word', () => {
      expect(component.getInitialsFromFullName('alice')).toBe('AE'); // a + last char e
      expect(component.getInitialsFromFullName('Bob')).toBe('BB'); // B + B
    });

    it('returns first letters for two+ parts', () => {
      expect(component.getInitialsFromFullName('John Doe')).toBe('JD');
      expect(component.getInitialsFromFullName(' mary ann ')).toBe('MA');
    });
  });

  // -------------------------------
  // getGoogleMapsUrl
  // -------------------------------
  describe('getGoogleMapsUrl', () => {
    it('should call sanitizer.bypassSecurityTrustResourceUrl and return the safe url', () => {
      const spy = jest.spyOn(mockSanitizer, 'bypassSecurityTrustResourceUrl' as any);
      const result = component.getGoogleMapsUrl(10, 20);
      expect(spy).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  // -------------------------------
  // trackByMessageId
  // -------------------------------
  describe('trackByMessageId', () => {
    it('returns header.messageId', () => {
      const msg = { header: { messageId: 'abc123' } };
      expect(component.trackByMessageId(0, msg)).toBe('abc123');
    });
  });

  // -------------------------------
  // getFileExtension
  // -------------------------------
  describe('getFileExtension', () => {
    it('parses common mime type', () => {
      expect(component.getFileExtension('image/png')).toBe('png');
      expect(component.getFileExtension('audio/mpeg')).toBe('mpeg');
    });

    it('maps docx long mime to DOCX', () => {
      const mime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      expect(component.getFileExtension(mime)).toBe('DOCX');
    });

    it('returns undefined part as undefined if bad input', () => {
      // if no slash, split will not have second element
      expect(component.getFileExtension('invalid')).toBeUndefined();
    });
  });

  // -------------------------------
  // getCustomerIcon
  // -------------------------------
  describe('getCustomerIcon', () => {
    it('returns first letters of two words', () => {
      expect(component.getCustomerIcon('John Doe')).toBe('JD');
      expect(component.getCustomerIcon('A B')).toBe('AB');
    });

    it('returns first+last char when single word', () => {
      expect(component.getCustomerIcon('Alice')).toBe('Ae');
      // capitalization is not required by implementation — we assert structure
    });
  });

  // -------------------------------
  // getChannelIconURL
  // -------------------------------
  describe('getChannelIconURL', () => {
    it('prefers senderIconMapSafe by lowercased name then id then default then empty', () => {
      component.senderIconMapSafe = {
        'facebook-connector': 'fb-url',
        'abc': 'by-id',
        default: 'default-url',
      };

      // senderName exact key present in map:
      expect(component.getChannelIconURL('facebook-connector', 'whatever')).toBe('fb-url');

      // fallback to id lowercased:
      expect(component.getChannelIconURL('missing', 'abc')).toBe('by-id');

      // fallback to default:
      expect(component.getChannelIconURL('missing', 'missing')).toBe('default-url');

      // fallback to empty string if nothing available:
      component.senderIconMapSafe = {};
      expect(component.getChannelIconURL('x', 'y')).toBe('');
    });
  });
});
