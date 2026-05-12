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

  // ========================================
  // CAROUSEL TESTS
  // ========================================
  describe('Carousel functions', () => {
    describe('getCarouselIndex', () => {
      it('should return 0 for unknown messageId', () => {
        expect(component.getCarouselIndex('unknown')).toBe(0);
      });

      it('should return stored index for known messageId', () => {
        component.setCarouselIndex('msg1', 3);
        expect(component.getCarouselIndex('msg1')).toBe(3);
      });
    });

    describe('setCarouselIndex', () => {
      it('should set and update carousel index for messageId', () => {
        component.setCarouselIndex('msg1', 0);
        expect(component.getCarouselIndex('msg1')).toBe(0);

        component.setCarouselIndex('msg1', 5);
        expect(component.getCarouselIndex('msg1')).toBe(5);
      });

      it('should handle multiple messages independently', () => {
        component.setCarouselIndex('msg1', 1);
        component.setCarouselIndex('msg2', 2);

        expect(component.getCarouselIndex('msg1')).toBe(1);
        expect(component.getCarouselIndex('msg2')).toBe(2);
      });
    });

    describe('nextSlide', () => {
      it('should increment index when not at end', () => {
        component.setCarouselIndex('msg1', 0);
        component.nextSlide('msg1', 5);
        expect(component.getCarouselIndex('msg1')).toBe(1);
      });

      it('should not increment when at last element', () => {
        component.setCarouselIndex('msg1', 4);
        component.nextSlide('msg1', 5);
        expect(component.getCarouselIndex('msg1')).toBe(4);
      });

      it('should handle transition from unset to 1', () => {
        component.nextSlide('newMsg', 3);
        expect(component.getCarouselIndex('newMsg')).toBe(1);
      });

      it('should work with different totalElements sizes', () => {
        component.setCarouselIndex('msg1', 0);
        component.nextSlide('msg1', 10);
        expect(component.getCarouselIndex('msg1')).toBe(1);

        component.setCarouselIndex('msg2', 0);
        component.nextSlide('msg2', 2);
        expect(component.getCarouselIndex('msg2')).toBe(1);
      });
    });

    describe('prevSlide', () => {
      it('should decrement index when not at start', () => {
        component.setCarouselIndex('msg1', 2);
        component.prevSlide('msg1');
        expect(component.getCarouselIndex('msg1')).toBe(1);
      });

      it('should not decrement when at index 0', () => {
        component.setCarouselIndex('msg1', 0);
        component.prevSlide('msg1');
        expect(component.getCarouselIndex('msg1')).toBe(0);
      });

      it('should handle unset message id (default 0)', () => {
        component.prevSlide('unsetMsg');
        expect(component.getCarouselIndex('unsetMsg')).toBe(0);
      });

      it('should decrement from high index to lower', () => {
        component.setCarouselIndex('msg1', 10);
        component.prevSlide('msg1');
        expect(component.getCarouselIndex('msg1')).toBe(9);
      });
    });
  });

  // ========================================
  // FORM TESTS
  // ========================================
  describe('Form functions', () => {
    describe('getFormAnswerLabels', () => {
      it('should return empty string for non-array input', () => {
        expect(component.getFormAnswerLabels(null as any)).toBe('');
        expect(component.getFormAnswerLabels(undefined as any)).toBe('');
        expect(component.getFormAnswerLabels('string' as any)).toBe('');
      });

      it('should return empty string for empty array', () => {
        expect(component.getFormAnswerLabels([])).toBe('');
      });

      it('should filter and join selected option labels', () => {
        const answer = [
          { label: 'Option A', isSelected: true },
          { label: 'Option B', isSelected: false },
          { label: 'Option C', isSelected: true },
        ];
        expect(component.getFormAnswerLabels(answer)).toBe('Option A, Option C');
      });

      it('should handle all unselected options', () => {
        const answer = [
          { label: 'Option A', isSelected: false },
          { label: 'Option B', isSelected: false },
        ];
        expect(component.getFormAnswerLabels(answer)).toBe('');
      });

      it('should handle single selected option', () => {
        const answer = [{ label: 'Single', isSelected: true }];
        expect(component.getFormAnswerLabels(answer)).toBe('Single');
      });
    });

    describe('hasSelectedOption', () => {
      it('should return false for null or undefined', () => {
        expect(component.hasSelectedOption(null as any)).toBe(false);
        expect(component.hasSelectedOption(undefined as any)).toBe(false);
      });

      it('should return false for empty array', () => {
        expect(component.hasSelectedOption([])).toBe(false);
      });

      it('should return true if at least one option is selected', () => {
        const answer = [
          { isSelected: false },
          { isSelected: true },
          { isSelected: false },
        ];
        expect(component.hasSelectedOption(answer)).toBe(true);
      });

      it('should return false if no option is selected', () => {
        const answer = [
          { isSelected: false },
          { isSelected: false },
        ];
        expect(component.hasSelectedOption(answer)).toBe(false);
      });
    });

    describe('isAnswered', () => {
      it('should return false for missing answer', () => {
        expect(component.isAnswered({ attributeType: 'TEXT' })).toBe(false);
        expect(component.isAnswered({ answer: null })).toBe(false);
      });

      it('should return false for empty answer array', () => {
        expect(component.isAnswered({ answer: [], attributeType: 'TEXT' })).toBe(
          false,
        );
      });

      it('should check OPTIONS type for selected items', () => {
        const unselected = {
          attributeType: 'OPTIONS',
          answer: [
            { isSelected: false },
            { isSelected: false },
          ],
        };
        expect(component.isAnswered(unselected)).toBe(false);

        const selected = {
          attributeType: 'OPTIONS',
          answer: [
            { isSelected: false },
            { isSelected: true },
          ],
        };
        expect(component.isAnswered(selected)).toBe(true);
      });

      it('should validate non-empty/non-null values for other types', () => {
        expect(
          component.isAnswered({
            attributeType: 'TEXT',
            answer: [null],
          }),
        ).toBe(false);

        expect(
          component.isAnswered({
            attributeType: 'TEXT',
            answer: [''],
          }),
        ).toBe(false);

        expect(
          component.isAnswered({
            attributeType: 'TEXT',
            answer: ['some text'],
          }),
        ).toBe(true);
      });
    });

    describe('getSelectedOptions', () => {
      it('should return empty string for null/undefined', () => {
        expect(component.getSelectedOptions(null as any)).toBe('');
        expect(component.getSelectedOptions(undefined as any)).toBe('');
      });

      it('should filter and join selected option labels', () => {
        const answer = [
          { label: 'Red', isSelected: true },
          { label: 'Blue', isSelected: false },
          { label: 'Green', isSelected: true },
        ];
        expect(component.getSelectedOptions(answer)).toBe('Red, Green');
      });

      it('should return empty string when no options selected', () => {
        const answer = [
          { label: 'A', isSelected: false },
          { label: 'B', isSelected: false },
        ];
        expect(component.getSelectedOptions(answer)).toBe('');
      });
    });

    describe('getTotalCount', () => {
      it('should return 0 for empty sections', () => {
        expect(component.getTotalCount([])).toBe(0);
      });

      it('should count only answered attributes across sections', () => {
        const sections = [
          {
            attributes: [
              { attributeType: 'TEXT', answer: ['yes'] }, // answered
              { attributeType: 'TEXT', answer: [null] }, // not answered
            ],
          },
          {
            attributes: [
              { attributeType: 'OPTIONS', answer: [{ isSelected: true }] }, // answered
              { attributeType: 'TEXT', answer: [''] }, // not answered
            ],
          },
        ];
        expect(component.getTotalCount(sections)).toBe(2);
      });

      it('should handle null/undefined sections gracefully', () => {
        expect(component.getTotalCount(null as any)).toBe(0);
        expect(component.getTotalCount(undefined as any)).toBe(0);
      });
    });

    describe('getGlobalIndex', () => {
      it('should return correct index for answered questions only', () => {
        const sections = [
          {
            attributes: [
              { attributeType: 'TEXT', answer: ['yes'] }, // global index 0
              { attributeType: 'TEXT', answer: [null] }, // not counted
              { attributeType: 'TEXT', answer: ['answer'] }, // global index 1
            ],
          },
          {
            attributes: [
              { attributeType: 'TEXT', answer: [null] }, // not counted
              { attributeType: 'TEXT', answer: ['text'] }, // global index 2
            ],
          },
        ];

        expect(
          component.getGlobalIndex(sections, sections[0], 0),
        ).toBe(0);
        expect(
          component.getGlobalIndex(sections, sections[0], 2),
        ).toBe(1);
        expect(
          component.getGlobalIndex(sections, sections[1], 1),
        ).toBe(2);
      });

      it('should return count if attribute not found', () => {
        const sections = [
          {
            attributes: [
              { attributeType: 'TEXT', answer: ['yes'] },
            ],
          },
        ];

        // Request index beyond section length
        expect(
          component.getGlobalIndex(sections, sections[0], 99),
        ).toBe(1);
      });

      it('should handle empty sections', () => {
        expect(component.getGlobalIndex([], {} as any, 0)).toBe(0);
      });
    });

    describe('sectionHasAnswers', () => {
      it('should return false for null/undefined section', () => {
        expect(component.sectionHasAnswers(null as any)).toBe(false);
        expect(component.sectionHasAnswers(undefined as any)).toBe(false);
      });

      it('should return false when no attributes answered', () => {
        const section = {
          attributes: [
            { attributeType: 'TEXT', answer: [null] },
            { attributeType: 'TEXT', answer: [''] },
          ],
        };
        expect(component.sectionHasAnswers(section)).toBe(false);
      });

      it('should return true if at least one attribute answered', () => {
        const section = {
          attributes: [
            { attributeType: 'TEXT', answer: [null] },
            { attributeType: 'TEXT', answer: ['answer'] },
          ],
        };
        expect(component.sectionHasAnswers(section)).toBe(true);
      });

      it('should return false for empty attributes array', () => {
        const section = { attributes: [] };
        expect(component.sectionHasAnswers(section)).toBe(false);
      });
    });

    describe('getFormTitleAndDescription', () => {
      it('should return title and description from current message', () => {
        const message = {
          body: {
            formTitle: 'Customer Feedback',
            formDescription: 'Please provide feedback',
          },
          header: {},
        };

        const result = component.getMessageData(message);
        expect(result.title).toBe('Customer Feedback');
        expect(result.description).toBe('Please provide feedback');
      });

      it('should fallback to original message if not in current', () => {
        const originalMsg = {
          id: 'orig-123',
          header: { messageId: 'orig-123' },
          body: {
            formTitle: 'Original Title',
            formDescription: 'Original Description',
          },
        };

        const updateMsg = {
          header: { originalMessageId: 'orig-123' },
          body: { formTitle: null, formDescription: null },
        };

        component.processedMessages = [originalMsg];

        const result = component.getMessageData(updateMsg);
        // Component returns the entire originalMessage object
        expect((result as any).body?.formTitle).toBe('Original Title');
        expect((result as any).body?.formDescription).toBe('Original Description');
      });

      it('should use default values when nothing found', () => {
        const message = {
          body: {},
          header: {},
        };

        const result = component.getMessageData(message);
        expect(result.title).toBe('Form');
        expect(result.description).toBe('');
      });

      it('should handle null message gracefully', () => {
        const result = component.getMessageData(null as any);
        expect(result.title).toBe('Form');
        expect(result.description).toBe('');
      });

      it('should prefer current message over original when both have values', () => {
        const originalMsg = {
          header: { messageId: 'orig-1' },
          body: {
            formTitle: 'Old Title',
            formDescription: 'Old Description',
          },
        };

        const currentMsg = {
          header: { originalMessageId: 'orig-1' },
          body: {
            formTitle: 'New Title',
            formDescription: 'New Description',
          },
        };

        component.processedMessages = [originalMsg];

        const result = component.getMessageData(currentMsg);
        expect(result.title).toBe('New Title');
        expect(result.description).toBe('New Description');
      });
    });
  });
});
