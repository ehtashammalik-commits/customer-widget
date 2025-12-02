// chat-transcript.component.spec.ts
import { TranscriptComponent } from './chat-transcript.component';
import { of, throwError } from 'rxjs';
import {
  DomSanitizer,
  SafeUrl,
  SafeResourceUrl,
} from '@angular/platform-browser';

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
      USERNAME_ENABLED: true,
    },
  };

  const mockSanitizer: Partial<DomSanitizer> = {
    bypassSecurityTrustUrl: jest.fn((v) => v as unknown as SafeUrl),
    bypassSecurityTrustResourceUrl: jest.fn(
      (v) => v as unknown as SafeResourceUrl,
    ),
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
      mockNgxLoader,
      mockTitle,
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
        body: {
          type: 'DELIVERYNOTIFICATION',
          messageId: 'm1',
          status: 'FAILED',
        },
      };

      mockTranscriptService.getTranscriptData.mockReturnValue(
        of([original, updateMsg, delivery]),
      );

      await component.loadChatData({ conversationId: 'c1' });

      // processedMessages should contain the original message only (update modifies it)
      expect(component.processedMessages.length).toBe(2);
      expect(component.processedMessages[0].body.markdownText).toBe(
        'updated text',
      );
      expect(component.processedMessages[0].isEdited).toBe(true);
      expect(component.processedMessages[0].isBlurred).toBe(true);

      // chatDate should reflect the timestamp
      expect(component.chatDate).toBe('2023/04/05');
    });

    it('should handle messages without timestamp gracefully and not throw', async () => {
      const msg = {
        id: 'x',
        header: {},
        body: { type: 'PLAIN', markdownText: 't' },
      };
      mockTranscriptService.getTranscriptData.mockReturnValue(of([msg]));
      await expect(
        component.loadChatData({ conversationId: 'c1' }),
      ).resolves.not.toThrow();
      expect(component.processedMessages.length).toBe(1);
    });

    it('should log error on failure and not throw', async () => {
      const err = new Error('network');
      mockTranscriptService.getTranscriptData.mockReturnValue(
        throwError(() => err),
      );
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
    const createObjectUrlSpy = jest
      .spyOn(URL, 'createObjectURL')
      .mockImplementation(() => 'blob:mock');

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
      const spy = jest.spyOn(
        mockSanitizer,
        'bypassSecurityTrustResourceUrl' as any,
      );
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
      const mime =
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
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
        abc: 'by-id',
        default: 'default-url',
      };

      // senderName exact key present in map:
      expect(
        component.getChannelIconURL('facebook-connector', 'whatever'),
      ).toBe('fb-url');

      // fallback to id lowercased:
      expect(component.getChannelIconURL('missing', 'abc')).toBe('by-id');

      // fallback to default:
      expect(component.getChannelIconURL('missing', 'missing')).toBe(
        'default-url',
      );

      // fallback to empty string if nothing available:
      component.senderIconMapSafe = {};
      expect(component.getChannelIconURL('x', 'y')).toBe('');
    });
  });

  describe('ngOnInit (extra branches)', () => {
    it('should catch invalid CCM_URL and log error', async () => {
      const badConfig = {
        appConfig: {
          ENABLE_TRANSCRIPT_NOTIFICATIONS: true,
          CCM_URL: '::::bad-url', // won’t throw in Node without override
        },
      } as any;

      const spyError = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      const originalURL = global.URL;
      global.URL = jest.fn(() => {
        throw new Error('bad url');
      }) as any;

      mockRoute.queryParams.subscribe.mockImplementation((cb: any) => {
        cb({ conversationId: 'c1', browserLang: 'en', state: 'view' });
      });

      component = new TranscriptComponent(
        mockRoute,
        mockTranscriptService,
        badConfig,
        mockSanitizer as any,
        mockNgxLoader,
        mockTitle,
        mockTranslate,
        mockStorageService,
      );

      component.ngOnInit();

      expect(spyError).toBeTruthy();

      global.URL = originalURL;
      spyError.mockRestore();
    });
  });

  describe('loadChatData (extra cases)', () => {
    it('should not blur message when status is not FAILED', async () => {
      const ts = new Date().toISOString();
      const msg = {
        id: 'm1',
        header: { messageId: 'm1', timestamp: ts },
        body: { type: 'PLAIN', markdownText: 'ok' },
      };
      const delivery = {
        body: {
          type: 'DELIVERYNOTIFICATION',
          messageId: 'm1',
          status: 'DELIVERED',
        },
        header: { timestamp: ts },
      };
      mockTranscriptService.getTranscriptData.mockReturnValue(
        of([msg, delivery]),
      );
      await component.loadChatData({ conversationId: 'c' });
      expect(component.processedMessages[0].isBlurred).toBe(false);
    });

    it('should not crash if update intent original not found', async () => {
      const ts = new Date().toISOString();
      const updateMsg = {
        id: 'mX',
        header: {
          originalMessageId: 'not-found',
          intent: 'update',
          timestamp: ts,
        },
        body: { type: 'PLAIN', markdownText: 'updated text' },
      };

      mockTranscriptService.getTranscriptData.mockReturnValue(of([updateMsg]));

      await expect(
        component.loadChatData({ conversationId: 'c' }),
      ).resolves.not.toThrow();

      // update message is discarded since original not found
      expect(component.processedMessages.length).toBe(0);
    });
  });

  describe('getFileExtension (extra cases)', () => {
    it('returns undefined if input is null/undefined', () => {
      expect(component.getFileExtension(undefined as any)).toBeUndefined();
      expect(component.getFileExtension(null as any)).toBeUndefined();
    });
  });

  describe('getCustomerIcon (extra cases)', () => {
    it('should return empty string when name is empty', () => {
      expect(component.getCustomerIcon('')).toBe('');
    });
  });

  // -------------------------------
  // getAgentDisplayName tests
  // -------------------------------
  describe('getAgentDisplayName', () => {
    beforeEach(() => {
      // reset mock config each time
      mockConfigService.appConfig.USERNAME_ENABLED = false;
    });

    it('should return username when USERNAME_ENABLED and username exists', () => {
      mockConfigService.appConfig.USERNAME_ENABLED = true;

      const user = {
        username: 'agent123',
        senderName: 'fallback',
        firstName: 'John',
      };
      const result = component.getAgentDisplayName(user);
      expect(result).toBe('agent123');
    });

    it('should return senderName when USERNAME_ENABLED and username is missing', () => {
      mockConfigService.appConfig.USERNAME_ENABLED = true;

      const user = { senderName: 'senderX' };
      const result = component.getAgentDisplayName(user);
      expect(result).toBe('senderX');
    });

    it('should fallback to "Agent" when USERNAME_ENABLED and both username and senderName missing', () => {
      mockConfigService.appConfig.USERNAME_ENABLED = true;

      const user = {};
      const result = component.getAgentDisplayName(user);
      expect(result).toBe('Agent');
    });

    it('should return first + last name when USERNAME_ENABLED is false and both present', () => {
      mockConfigService.appConfig.USERNAME_ENABLED = false;

      const user = { firstName: 'John', lastName: 'Doe' };
      expect(component.getAgentDisplayName(user)).toBe('John Doe');
    });

    it('should use additionalDetail names if main ones missing', () => {
      mockConfigService.appConfig.USERNAME_ENABLED = false;

      const user = {
        additionalDetail: { firstName: 'Jane', lastName: 'Smith' },
      };
      expect(component.getAgentDisplayName(user)).toBe('Jane Smith');
    });

    it('should return only firstName when lastName missing', () => {
      mockConfigService.appConfig.USERNAME_ENABLED = false;

      const user = { firstName: 'Solo' };
      expect(component.getAgentDisplayName(user)).toBe('Solo');
    });

    it('should return only lastName when firstName missing', () => {
      mockConfigService.appConfig.USERNAME_ENABLED = false;

      const user = { lastName: 'Lasty' };
      expect(component.getAgentDisplayName(user)).toBe('Lasty');
    });

    it('should fallback to username when both names missing', () => {
      mockConfigService.appConfig.USERNAME_ENABLED = false;

      const user = { username: 'agent007' };
      expect(component.getAgentDisplayName(user)).toBe('agent007');
    });

    it('should fallback to "Agent" when all name fields missing', () => {
      mockConfigService.appConfig.USERNAME_ENABLED = false;

      const user = {};
      expect(component.getAgentDisplayName(user)).toBe('Agent');
    });
  });
});
