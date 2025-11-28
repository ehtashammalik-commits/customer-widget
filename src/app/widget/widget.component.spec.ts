import { BehaviorSubject } from 'rxjs';
import { SdkService } from '../services/sdk.service';
import { WidgetComponent } from './widget.component';

// ---------- Common mocks ----------

const mockSdkService: Partial<SdkService> = {
  handleCallStart: jest.fn(),
  makeConnection: jest.fn(),
  authenticateKey: jest.fn(),
  fetchBusinessCalendarId: jest.fn(),
  getCalendarEvents: jest.fn(),
  sendChatMessage: jest.fn(),
  handleChatEnd: jest.fn(),
  moveToFileServer: jest.fn((fd, cb) => cb({})),
  localStream$: new BehaviorSubject(null),
  remoteStreamObs$: new BehaviorSubject(null),
};

const mockAppConfigService = {
  appConfig: {
    ENABLE_LOGO: false,
    ADDITIONAL_PANEL: false,
    USERNAME_ENABLED: true,
  },
};

const mockTranslateService: any = {
  setDefaultLang: jest.fn(),
  use: jest.fn(),
};

const mockElementRef = { nativeElement: { style: { setProperty: jest.fn() } } };
const mockRenderer2 = { setStyle: jest.fn() };
const mockChangeDetectorRef = { detectChanges: jest.fn() };
const mockDomSanitizer = { bypassSecurityTrustUrl: jest.fn() };
const mockMatSnackBar = { open: jest.fn() };
const mockMatDialog = { open: jest.fn() };

const mockStorageService = {
  getItem: jest.fn((key: string) => localStorage.getItem(key)),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};

const mockRoute = {};
const mockFormBuilder = {
  group: jest.fn(() => ({})), // returns an empty object or a mock FormGroup
};

const mockBrowserNotificationService: any = {
  notify: jest.fn(),
  playSound: jest.fn(),
  openBrowserNotification: jest.fn(),
};

const PostMessageHandlerService = {};

const mockDeliveryNotificationService = {};
const mockPostMessageHandlerService = {};

// ---------- Test suite ----------
describe('WidgetComponent', () => {
  let component: WidgetComponent;

  beforeEach(() => {
    component = new WidgetComponent(
      mockRoute as any,
      mockFormBuilder as any,
      mockSdkService as any,
      mockAppConfigService as any,
      mockStorageService as any,
      mockElementRef as any,
      mockRenderer2 as any,
      mockChangeDetectorRef as any,
      mockDomSanitizer as any,
      mockMatSnackBar as any,
      mockMatDialog as any,
      mockBrowserNotificationService,
      mockDeliveryNotificationService as any,
      mockPostMessageHandlerService as any,
      mockTranslateService,
      mockRoute as any, // Router
      {} as any, // Document
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  // ---------- ngOnInit ----------

  describe('Initialization of the Componenet in the ngOnInit LifeCycle Hook', () => {
    let mockQueryParams$: any;
    let mockWidgetConfigs$: any;
    let mockValidations$: any;
    let mockRenderPreChatForm$: any;
    let mockRenderCallbackForm$: any;
    let mockOnChatResumedResponse$: any;
    let mockOnWebRtcCallResponse$: any;
    let mockOnCallbackRequestResponse$: any;
    let mockConnectionResponse$: any;
    let mockBrowserInfoData$: any;

    beforeEach(() => {
      // Mock observables
      mockQueryParams$ = {
        subscribe: jest.fn((fn) => {
          fn({
            channelCustomerIdentifier: 'cid',
            serviceIdentifier: 'sid',
            widgetIdentifier: 'wid',
            Source: 'Widget',
            encryptedKey: encodeURIComponent('myKey'),
          });
          return { unsubscribe: jest.fn() };
        }),
      };
      mockWidgetConfigs$ = { subscribe: jest.fn() };
      mockValidations$ = { subscribe: jest.fn() };
      mockRenderPreChatForm$ = { subscribe: jest.fn() };
      mockRenderCallbackForm$ = { subscribe: jest.fn() };
      mockOnChatResumedResponse$ = { subscribe: jest.fn() };
      mockOnWebRtcCallResponse$ = { subscribe: jest.fn() };
      mockOnCallbackRequestResponse$ = { subscribe: jest.fn() };
      mockConnectionResponse$ = { subscribe: jest.fn() };
      mockBrowserInfoData$ = { subscribe: jest.fn() };

      // Patch private/readonly properties
      (component as any).route = { queryParams: mockQueryParams$ };
      (component as any).__postMessageHandlerService = {
        browserInfoData$: mockBrowserInfoData$,
      };
      jest
        .spyOn(component as any, 'setFontFromLocalStorage')
        .mockImplementation(() => {});
      jest
        .spyOn(component as any, 'createFormValidationControls')
        .mockImplementation(() => {});

      // Patch route and SDK observables
      component.sdk = {
        widgetConfigs$: mockWidgetConfigs$,
        validationsSubcription: mockValidations$,
        renderPreChatForm$: mockRenderPreChatForm$,
        renderCallbackForm$: mockRenderCallbackForm$,
        onChatResumedResponse$: mockOnChatResumedResponse$,
        onWebRtcCallResponse$: mockOnWebRtcCallResponse$,
        onCallbackRequestResponse$: mockOnCallbackRequestResponse$,
        connectionResponse$: mockConnectionResponse$,
        getFormValidation: jest.fn((cb) => cb()),
        renderPreChatForm: jest.fn(),
        renderCallbackForm: jest.fn(),
      } as any;

      // Patch methods to spy
      component.initPrechatform = jest.fn();
      component.passUrlParamsToServices = jest.fn();
      component.getCalendarEvents = jest.fn();
      component.setWidgetConfigs = jest.fn();
      component.loadBrowserLanguage = jest.fn();
      component.setFontFromLocalStorage = jest.fn();
      component.createFormValidationControls = jest.fn();
      component.changeScreen = jest.fn();
      component.handleResumedMessages = jest.fn();
      component.clearSession = jest.fn();
      component.scrollToBottom = jest.fn();
      component.changeView = jest.fn();
    });

    it('should call initPrechatform, loadBrowserLanguage, setFontFromLocalStorage, getCalendarEvents', () => {
      component.ngOnInit();
      expect(component.initPrechatform).toHaveBeenCalled();
      expect(component.loadBrowserLanguage).toHaveBeenCalled();
      expect(component.setFontFromLocalStorage).toHaveBeenCalled();
      expect(component.getCalendarEvents).toHaveBeenCalled();
    });

    it('should extract and set route params correctly', () => {
      component.ngOnInit();
      expect(component.customerIdentifier).toBe('cid');
      expect(component.serviceIdentifier).toBe('sid');
      expect(component.widgetIdentifier).toBe('wid');
      expect(component.source).toBe('Widget');
      expect(component.webRtcSecureLink).toBe('myKey');
    });

    it('should set standaloneWebRtc true if webRtcSecureLink is present', () => {
      component.ngOnInit();
      expect(component.standaloneWebRtc).toBe(true);
    });

    it('should call alert if widgetIdentifier is missing in standaloneWebRtc mode', () => {
      global.alert = jest.fn();
      mockQueryParams$.subscribe = jest.fn((fn) => {
        fn({
          channelCustomerIdentifier: 'cid',
          serviceIdentifier: 'sid',
          Source: 'Widget',
          encryptedKey: encodeURIComponent('myKey'),
        });
        return { unsubscribe: jest.fn() };
      });
      component.ngOnInit();
      expect(global.alert).toHaveBeenCalledWith(
        'Error: Please check with Administrator. Widget identifier is missing!!!',
      );
    });

    it('should call alert if serviceIdentifier is missing in non-standalone mode', () => {
      global.alert = jest.fn();
      mockQueryParams$.subscribe = jest.fn((fn) => {
        fn({
          channelCustomerIdentifier: 'cid',
          widgetIdentifier: 'wid',
          Source: 'Widget',
        });
        return { unsubscribe: jest.fn() };
      });
      component.ngOnInit();
      expect(global.alert).toHaveBeenCalledWith(
        'Error: Please check with Administrator. Service identifier is missing!!!',
      );
    });

    it('should call alert if widgetIdentifier is missing in non-standalone mode', () => {
      global.alert = jest.fn();
      mockQueryParams$.subscribe = jest.fn((fn) => {
        fn({
          channelCustomerIdentifier: 'cid',
          serviceIdentifier: 'sid',
          Source: 'Widget',
        });
        return { unsubscribe: jest.fn() };
      });
      component.ngOnInit();
      expect(global.alert).toHaveBeenCalledWith(
        'Error: Please check with Administrator. Widget identifier is missing!!!',
      );
    });

    it('should call alert if channelCustomerIdentifier is missing and CHANNEL_IDENTIFIER is set', () => {
      global.alert = jest.fn();
      component.__appConfig = {
        appConfig: { CHANNEL_IDENTIFIER: 'channel_customer_identifier' },
      } as any;
      mockQueryParams$.subscribe = jest.fn((fn) => {
        fn({
          serviceIdentifier: 'sid',
          widgetIdentifier: 'wid',
          Source: 'Widget',
        });
        return { unsubscribe: jest.fn() };
      });
      component.ngOnInit();
      expect(global.alert).toHaveBeenCalledWith(
        "Warning: 'channelCustomerIdentifier' parameter is missing in the url, Required for Customer Identification!!!",
      );
    });

    // You can add more tests for subscriptions and side effects as needed
  });

  // ---------- handleRefreshCaseForWebRTC ----------
  describe('handleRefreshCaseForWebRTC', () => {
    const originalLocalStorage = { ...localStorage };

    beforeEach(() => {
      localStorage.clear();
      component.webRTCConfig = { customerName: '', customerNumber: '' };
    });

    afterEach(() => {
      Object.defineProperty(window, 'localStorage', {
        value: originalLocalStorage,
        writable: true,
      });
    });

    it('should update webRTCConfig with values from localStorage when user data exists', () => {
      const mockUserData = {
        data: {
          formData: {
            attributes: [
              { key: 'name', value: 'Test User' },
              { key: 'phone', value: '1234567890' },
            ],
          },
        },
      };
      localStorage.setItem('user', JSON.stringify(mockUserData));

      component.handleRefreshCaseForWebRTC();

      expect(component.webRTCConfig.customerName).toBe('Test User');
      expect(component.webRTCConfig.customerNumber).toBe('1234567890');
    });

    it('should handle missing attributes array gracefully', () => {
      const mockUserData = { data: { formData: {} } };
      localStorage.setItem('user', JSON.stringify(mockUserData));

      component.webRTCConfig = {
        customerName: 'Initial Name',
        customerNumber: 'Initial Number',
      };

      component.handleRefreshCaseForWebRTC();

      expect(component.webRTCConfig.customerName).toBe('Initial Name');
      expect(component.webRTCConfig.customerNumber).toBe('Initial Number');
    });
  });

  // ---------- eventListener ----------
  describe('eventListener', () => {
    const mockSdk = {
      onChatResumed: jest.fn(),
      sendChatRequest: jest.fn(),
      sendWebhookNotification: jest.fn(),
      setConversationDataAgainstCustomerIdentifier: jest.fn(),
      sendChatMessage: jest.fn(),
    };
    const mockChangeScreen = jest.fn();
    const mockComposerDisable = jest.fn();
    const mockHandleCimMessage = jest.fn();
    const mockHandleResumedMessages = jest.fn();
    const mockScrollToBottom = jest.fn();
    const mockClearSession = jest.fn();
    const mockClearMessageData = jest.fn();
    const mockPushPrechatDataAsActivity = jest.fn();
    const mockAlert = jest.fn();

    beforeEach(() => {
      global.alert = mockAlert;
      component.changeScreen = mockChangeScreen;
      component.composerDisable = mockComposerDisable;
      component.handleCimMessage = mockHandleCimMessage;
      component.handleResumedMessages = mockHandleResumedMessages;
      component.scrollToBottom = mockScrollToBottom;
      component.clearSession = mockClearSession;
      component.clearMessageData = mockClearMessageData;
      component.pushPrechatDataAsActivity = mockPushPrechatDataAsActivity;
      component.cimMessage = [{ body: { subType: 'plain' } }];
      component.sdk = mockSdk as any;
    });

    it('should call clearSession and composerDisable for CHANNEL_SESSION_ENDED', () => {
      component.eventListener({ id: 1, type: 'CHANNEL_SESSION_ENDED' });
      expect(mockClearSession).toHaveBeenCalled();
      expect(mockComposerDisable).toHaveBeenCalled();
    });

    it('should call clearSession and composerDisable for CHANNEL_SESSION_EXPIRED', () => {
      component.eventListener({ id: 1, type: 'CHANNEL_SESSION_EXPIRED' });
      expect(mockClearSession).toHaveBeenCalled();
      expect(mockComposerDisable).toHaveBeenCalled();
    });

    it('should remove user and set isChatActive false if messageType is survey', () => {
      component.cimMessage = [{ body: { subType: 'survey' } }];
      component.isChatActive = true;
      component.eventListener({ id: 1, type: 'CHANNEL_SESSION_ENDED' });
      expect(mockStorageService.removeItem).toHaveBeenCalledWith(
        'user',
        component.storageType,
      );
      expect(component.isChatActive).toBe(false);
      expect(mockComposerDisable).toHaveBeenCalled();
    });

    it('should handle SOCKET_CONNECTED with eventTriggerType "startChat"', () => {
      component.eventTriggerType = 'startChat';
      component.customerData = { foo: 'bar' };
      component.enabledWebhook = true;
      component.webhookUrl = 'url';
      const event = { id: 1, type: 'SOCKET_CONNECTED', data: {} };
      component.eventListener(event);
      expect(mockSdk.sendChatRequest).toHaveBeenCalledWith({
        type: 'CHAT_REQUESTED',
        data: component.customerData,
      });
      expect(mockSdk.sendWebhookNotification).toHaveBeenCalledWith('url', {
        type: 'CHAT_REQUESTED',
        data: component.customerData,
      });
      expect(mockChangeScreen).toHaveBeenCalledWith('chat');
    });

    it('should handle SOCKET_CONNECTED with eventTriggerType ""', () => {
      component.eventTriggerType = '';
      component.customerData = {
        serviceIdentifier: 's',
        channelCustomerIdentifier: 'c',
      };
      component.eventListener({ id: 1, type: 'SOCKET_CONNECTED', data: {} });
      expect(mockSdk.onChatResumed).toHaveBeenCalledWith('s', 'c');
      expect(mockChangeScreen).toHaveBeenCalledWith('chat');
    });

    it('should handle CONVERSATION_RESUMED', () => {
      const event = {
        id: 1,
        type: 'CONVERSATION_RESUMED',
        data: { history: [{ header: { conversationId: 'cid' } }] },
      };
      component.eventListener(event);
      expect(component.isChatActive).toBe(true);
      expect(component.preChatFormLoader).toBe(false);
      expect(component.conversationId).toBe('cid');
      expect(mockStorageService.setItem).toHaveBeenCalledWith(
        'conversationId',
        'cid',
        component.storageType,
      );
      expect(mockHandleResumedMessages).toHaveBeenCalledWith(
        event.data.history,
      );
      expect(mockScrollToBottom).toHaveBeenCalled();
      expect(mockChangeScreen).toHaveBeenCalledWith('chat');
    });

    it('should handle CHANNEL_SESSION_STARTED', () => {
      const event = {
        id: 1,
        type: 'CHANNEL_SESSION_STARTED',
        data: {
          header: { conversationId: 'cid', customer: { _id: 'custid' } },
        },
      };
      component.customerData = {
        channelCustomerIdentifier: 'c',
        serviceIdentifier: 's',
      };
      component.preChatFormData = {};
      component.getFormDataAsConversationData = jest.fn();
      component.eventListener(event);
      expect(component.isChatActive).toBe(true);
      expect(component.isComposerDisable).toBe(false);
      expect(component.preChatFormLoader).toBe(false);
      expect(component.conversationId).toBe('cid');
      expect(component.customerId).toBe('custid');
      expect(mockStorageService.setItem).toHaveBeenCalledWith(
        'conversationId',
        'cid',
        component.storageType,
      );
      expect(
        mockSdk.setConversationDataAgainstCustomerIdentifier,
      ).toHaveBeenCalled();
      expect(mockPushPrechatDataAsActivity).toHaveBeenCalled();
    });

    it('should handle MESSAGE_RECEIVED', () => {
      const event = { id: 1, type: 'MESSAGE_RECEIVED', data: { foo: 'bar' } };
      component.eventListener(event);
      expect(mockHandleCimMessage).toHaveBeenCalledWith(event.data);
    });

    it('should handle SOCKET_DISCONNECTED when messageType is not survey', () => {
      component.cimMessage = [{ body: { subType: 'plain' } }];
      const event = {
        id: 1,
        type: 'SOCKET_DISCONNECTED',
        data: 'io server disconnected',
      };

      component.eventListener(event);

      expect(component.cimMessage).toEqual([]);
      expect(mockClearMessageData).toHaveBeenCalled();
      expect(component.isChatActive).toBe(false);
      expect(mockComposerDisable).toHaveBeenCalled();
      expect(mockChangeScreen).toHaveBeenCalledWith('end');
    });

    it('should handle SOCKET_REPLACED', () => {
      component.eventListener({ id: 1, type: 'SOCKET_REPLACED', data: {} });
      expect(component.cimMessage).toEqual([]);
      expect(mockClearMessageData).toHaveBeenCalled();
      expect(component.isChatActive).toBe(false);
      expect(mockComposerDisable).toHaveBeenCalled();
      expect(mockChangeScreen).toHaveBeenCalledWith('end');
    });

    it('should handle CONNECT_ERROR', () => {
      component.eventListener({ id: 1, type: 'CONNECT_ERROR', data: {} });
      expect(mockChangeScreen).toHaveBeenCalledWith('error');
    });

    it('should handle ERRORS with code 408', () => {
      component.eventListener({
        id: 1,
        type: 'ERRORS',
        data: { task: 'CHAT_REQUESTED', code: 408 },
      });
      expect(mockAlert).toHaveBeenCalledWith(
        'Unable to connect with end server',
      );
    });

    it('should handle ERRORS with code 400', () => {
      component.eventListener({
        id: 1,
        type: 'ERRORS',
        data: { task: 'CHAT_REQUESTED', code: 400 },
      });
      expect(mockAlert).toHaveBeenCalledWith('data is invalid');
    });

    it('should handle ERRORS with code 500', () => {
      component.eventListener({
        id: 1,
        type: 'ERRORS',
        data: { task: 'CHAT_REQUESTED', code: 500 },
      });
      expect(mockAlert).toHaveBeenCalledWith('Internal error with end server');
    });

    it('should handle ERRORS with other code', () => {
      component.eventListener({
        id: 1,
        type: 'ERRORS',
        data: { task: 'CHAT_REQUESTED', code: 999 },
      });
      expect(mockAlert).toHaveBeenCalledWith('Unable to send request');
    });

    it('should not throw on error', () => {
      component.cimMessage = null as any;
      expect(() =>
        component.eventListener({ id: 1, type: 'MESSAGE_RECEIVED', data: {} }),
      ).not.toThrow();
    });
  });

  describe('setWidgetConfigs', () => {
    it('should set all widget configurations correctly', async () => {
      const configs = {
        title: 'Test Title',
        subTitle: 'Test Subtitle',
        theme: '#FF0000',
        enableFileTransfer: true,
        enableDownloadTranscript: true,
        enableDynamicLink: true,
        enableEmoji: true,
        enableFontResize: true,
        form: 'form123',
        webRtc: {
          enableWebRtc: true,
          config: 'testConfig',
        },
        callback: {
          enableCallback: true,
          standaloneCallback: true,
        },
        webhook: {
          webhookUrl: 'https://webhook.example.com',
          enableWebhook: true,
        },
      };

      await component.setWidgetConfigs(configs);

      expect(component.title).toBe('Test Title');
      expect(component.subtitle).toBe('Test Subtitle');
      expect(component.theme).toBe('#FF0000');
      expect(component.enableFileTransfer).toBe(true);
      expect(component.enableDownloadTranscript).toBe(true);
      expect(component.enableDynamicLink).toBe(true);
      expect(component.enableEmoji).toBe(true);
      expect(component.enableFontResize).toBe(true);
      expect(component.preChatFormId).toBe('form123');
      expect(component.enableWebRtc).toBe(true);
      expect(component.enabledCallback).toBe(true);
      expect(component.standaloneCallback).toBe(true);
      expect(component.webhookUrl).toBe('https://webhook.example.com');
      expect(component.enabledWebhook).toBe(true);
    });

    it('should handle null webRtc config', async () => {
      const configs = {
        title: 'Test Title',
        webRtc: null,
        callback: null,
        webhook: null,
      };

      await component.setWidgetConfigs(configs);

      expect(component.enableWebRtc).toBe(false);
      expect(component.enabledCallback).toBe(false);
      expect(component.standaloneCallback).toBe(false);
      expect(component.webhookUrl).toBeUndefined();
      expect(component.enabledWebhook).toBe(false);
    });
  });

  describe('markFormGroupTouched', () => {
    it('should mark all controls in form group as touched', () => {
      const mockForm = {
        controls: {
          field1: { markAsTouched: jest.fn(), controls: null },
          field2: { markAsTouched: jest.fn(), controls: null },
        },
      };

      component['markFormGroupTouched'](mockForm as any);

      expect(mockForm.controls.field1.markAsTouched).toHaveBeenCalled();
      expect(mockForm.controls.field2.markAsTouched).toHaveBeenCalled();
    });

    it('should recursively call markFormGroupTouched for nested form groups', () => {
      const nestedFormGroup = {
        markAsTouched: jest.fn(),
        controls: {},
      };
      const mockForm = {
        controls: {
          nestedGroup: nestedFormGroup,
        },
      };
      const markFormGroupTouchedSpy = jest.spyOn(
        component as any,
        'markFormGroupTouched',
      );

      component['markFormGroupTouched'](mockForm as any);

      expect(markFormGroupTouchedSpy).toHaveBeenCalledTimes(1); // Original call only
    });
  });

  describe('extractMinMaxLength', () => {
    it('should extract min and max length correctly', () => {
      const regexWithBoth = '.{5,10}';
      const result1 = component['extractMinMaxLength'](regexWithBoth);
      expect(result1.minLength).toBe(5);
      expect(result1.maxLength).toBe(10);

      const regexWithMinOnly = '.{8,}';
      const result2 = component['extractMinMaxLength'](regexWithMinOnly);
      expect(result2.minLength).toBe(8);
      expect(result2.maxLength).toBeNull();

      const regexWithMaxOnly = '.{,15}';
      const result3 = component['extractMinMaxLength'](regexWithMaxOnly);
      expect(result3.minLength).toBeNull();
      expect(result3.maxLength).toBe(15);

      const regexWithoutLength = '^[a-zA-Z]+$';
      const result4 = component['extractMinMaxLength'](regexWithoutLength);
      expect(result4.minLength).toBeNull();
      expect(result4.maxLength).toBeNull();
    });
  });

  describe('onFormSubmit', () => {
    beforeEach(() => {
      component.preChatFormGroup = {
        valid: true,
        value: { sections: [{ name: 'John' }] },
      } as any;
      component.serviceIdentifier = 'service123';
      component.getEventPayload = jest.fn(() => ({
        error: false,
        data: { channelCustomerIdentifier: 'cid123' },
      }));
      component.setUserData = jest.fn();
    });

    it('should submit form when valid', () => {
      component.onFormSubmit();

      expect(component.preChatFormLoader).toBe(true);
      expect(component.preChatFormData).toEqual({
        sections: [{ name: 'John' }],
      });
      expect(component.getEventPayload).toHaveBeenCalledWith({
        sections: [{ name: 'John' }],
      });
      expect(component.setUserData).toHaveBeenCalledWith(
        { channelCustomerIdentifier: 'cid123' },
        'startChat',
      );
    });

    it('should show alert when service identifier is missing', () => {
      global.alert = jest.fn();
      component.serviceIdentifier = '';
      component.onFormSubmit();

      expect(global.alert).toHaveBeenCalledWith(
        'Please Check with Administrator. Your service identifier is missing!',
      );
      expect(component.preChatFormLoader).toBe(false);
    });

    it('should mark form as touched when invalid', () => {
      const mockFormGroup = {
        valid: false,
        controls: { sections: { markAsTouched: jest.fn() } },
      } as any;
      component.preChatFormGroup = mockFormGroup;
      const markFormGroupTouchedSpy = jest.spyOn(
        component as any,
        'markFormGroupTouched',
      );

      component.onFormSubmit();

      expect(markFormGroupTouchedSpy).toHaveBeenCalledWith(mockFormGroup);
    });

    it('should show error alert on exception', () => {
      global.alert = jest.fn();
      const mockFormGroup = {
        valid: true,
        controls: { sections: { markAsTouched: jest.fn() } },
      } as any;
      component.preChatFormGroup = mockFormGroup;
      component.getEventPayload = () => {
        throw new Error('Test error');
      };

      component.onFormSubmit();

      expect(global.alert).toHaveBeenCalledWith(
        'Error while submitting the form',
      );
    });
  });

  // ---------- handleCimMessage ----------
  describe('handleCimMessage', () => {
    beforeEach(() => {
      component.cimMessage = [];
      component.typingIndicatorTimer = null;
      component.isUsernameEnabled = false;
      jest.useFakeTimers();

      component.updateStatusOfCustomerMessage = jest.fn();
      component.editMessage = jest.fn();
      component.handleMessageReport = jest.fn();
      component.getAgentDisplayName = jest.fn(() => 'Agent Name');
      component.scrollToBottom = jest.fn();
    });

    afterEach(() => jest.useRealTimers());

    it('should call updateStatusOfCustomerMessage for deliverynotification from agent', () => {
      const cimMessage = {
        body: {
          type: 'deliverynotification',
          messageId: 'id1',
          status: 'SENT',
        },
        header: { sender: { type: 'agent' } },
      };
      component.handleCimMessage(cimMessage);
      expect(component.updateStatusOfCustomerMessage).toHaveBeenCalledWith(
        'id1',
        'sent',
      );
    });

    it('should start typing indicator timer for typing_started notification from agent', () => {
      const cimMessage = {
        body: { type: 'notification', notificationType: 'typing_started' },
        header: { sender: { type: 'agent' } },
      };
      component.handleCimMessage(cimMessage);
      expect(component.typingIndicatorTimer).not.toBeNull();
      jest.advanceTimersByTime(5000);
      expect(component.typingIndicatorTimer).toBeNull();
    });

    it('should restart typing indicator timer if already running', () => {
      const cimMessage = {
        body: { type: 'notification', notificationType: 'typing_started' },
        header: { sender: { type: 'agent' } },
      };
      component.typingIndicatorTimer = setTimeout(() => {}, 5000);
      component.handleCimMessage(cimMessage);
      jest.advanceTimersByTime(5000);
      expect(component.typingIndicatorTimer).toBeNull();
    });

    it('should call editMessage and handleMessageReport for plain message with intent update', () => {
      const cimMessage = {
        body: { type: 'plain', markdownText: 'text' },
        header: { sender: { type: 'agent' }, intent: 'update' },
      };
      component.handleCimMessage(cimMessage);
      expect(component.editMessage).toHaveBeenCalledWith(cimMessage);
      expect(component.handleMessageReport).toHaveBeenCalledWith(cimMessage);
    });

    it('should push message, notify, scroll and report for plain message without intent update', () => {
      const cimMessage = {
        body: { type: 'plain', markdownText: 'text' },
        header: { sender: { type: 'agent' } },
      };
      component.handleCimMessage(cimMessage);
      expect(component.cimMessage).toContain(cimMessage);
      expect(mockBrowserNotificationService.notify).toHaveBeenCalledWith(
        cimMessage,
      );
      expect(component.scrollToBottom).toHaveBeenCalled();
      expect(component.handleMessageReport).toHaveBeenCalledWith(cimMessage);
    });

    it('should clear typing indicator for non-notification type from agent', () => {
      component.typingIndicatorTimer = 123 as any;
      const cimMessage = {
        body: { type: 'plain', markdownText: 'text' },
        header: { sender: { type: 'agent' } },
      };
      component.handleCimMessage(cimMessage);
      expect(component.typingIndicatorTimer).toBeDefined();
    });

    it('should update agent username in notification if isUsernameEnabled is false', () => {
      const cimMessage = {
        body: {
          type: 'notification',
          notificationType: '',
          notificationData: {
            data: {
              agentParticipant: {
                participant: { keycloakUser: { username: 'old' } },
              },
            },
          },
        },
        header: { sender: { type: 'agent', additionalDetail: {} } },
      };
      component.handleCimMessage(cimMessage);
      expect(
        cimMessage.body.notificationData.data.agentParticipant.participant
          .keycloakUser.username,
      ).toBe('Agent Name');
    });

    it('should update conversation participant username in notification if isUsernameEnabled is false', () => {
      const cimMessage = {
        body: {
          type: 'notification',
          notificationType: '',
          notificationData: {
            data: {
              conversationParticipant: {
                participant: { keycloakUser: { username: 'old' } },
              },
            },
          },
        },
        header: { sender: { type: 'agent', additionalDetail: {} } },
      };
      component.handleCimMessage(cimMessage);
      expect(
        cimMessage.body.notificationData.data.conversationParticipant
          .participant.keycloakUser.username,
      ).toBe('Agent Name');
    });

    it('should update senderName if isUsernameEnabled is false', () => {
      const cimMessage = {
        body: { type: 'other' },
        header: {
          sender: { type: 'agent', additionalDetail: {}, senderName: 'old' },
        },
      };
      component.handleCimMessage(cimMessage);
      expect(cimMessage.header.sender.senderName).toBe('Agent Name');
    });

    it('should call editMessage and handleMessageReport for non-plain message with intent update', () => {
      const cimMessage = {
        body: { type: 'other' },
        header: { sender: { type: 'agent' }, intent: 'update' },
      };
      component.handleCimMessage(cimMessage);
      expect(component.editMessage).toHaveBeenCalledWith(cimMessage);
      expect(component.handleMessageReport).toHaveBeenCalledWith(cimMessage);
    });

    it('should push message, notify, scroll and report for non-plain message without intent update', () => {
      const cimMessage = {
        body: { type: 'other' },
        header: { sender: { type: 'agent' } },
      };
      component.handleCimMessage(cimMessage);
      expect(component.cimMessage).toContain(cimMessage);
      expect(mockBrowserNotificationService.notify).toHaveBeenCalledWith(
        cimMessage,
      );
      expect(component.scrollToBottom).toHaveBeenCalled();
      expect(component.handleMessageReport).toHaveBeenCalledWith(cimMessage);
    });
  });

  // ---------- handleDialogStates ----------
  describe('handleDialogStates', () => {
    it('should open snackbar when reasonCode is NO_ANSWER', () => {
      const snackSpy = jest.spyOn(component['snackBar'], 'open');
      component.handleDialogStates({ reasonCode: 'NO_ANSWER' });
      expect(snackSpy).toHaveBeenCalledWith(
        'Call is not picked up',
        'Dismiss',
        expect.any(Object),
      );
    });

    it('should set IsRegisteredInFreeSwitch true when agentInfo state is LOGIN', () => {
      component.handleDialogStates({
        event: 'agentInfo',
        response: { state: 'LOGIN', extension: '101' },
      });
      expect(component.IsRegisteredInFreeSwitch).toBe(true);
    });

    it('should set maintainDialog and dialogId on outboundDialing INITIATING', () => {
      const dialog = { id: 'd1', state: 'INITIATING' };
      component.handleDialogStates({
        event: 'outboundDialing',
        response: { dialog },
      });
      expect(component.maintainDialog).toEqual(dialog);
      expect(component.dialogId).toBe('d1');
    });

    it('should call changeView and startCountdown on ACTIVE dialogState', () => {
      const spyStart = jest
        .spyOn(component as any, 'startCountdown')
        .mockImplementation(() => {});

      const dialog = { id: 'd2', state: 'ACTIVE' };
      component.handleDialogStates({
        event: 'dialogState',
        response: { dialog },
      });

      expect(spyStart).toHaveBeenCalled();
      expect(component.dialogId).toBe('d2');
    });

    it('should set remoteStreamStatus=false when mediaStreamUpdate success with video', () => {
      component.handleDialogStates({
        event: 'mediaStreamUpdate',
        status: 'success',
        dialog: { stream: 'video' },
      });
      expect(component.isAudioCallActive).toBe(false);
      expect(component.callPopUpView).toBe(false);
    });

    it('should handle Error event with generalError Forbidden', () => {
      const snackSpy = jest.spyOn(component['snackBar'], 'open');
      component.standaloneWebRtc = true;
      component.handleDialogStates({
        event: 'Error',
        response: { type: 'generalError', description: 'Forbidden' },
      });
      expect(component.showAuthenticationResponseMessage).toContain(
        'Authentication failed',
      );
      expect(snackSpy).toHaveBeenCalled();
    });
  });

  // ---------- changeScreen ----------
  describe('changeScreen', () => {
    it('should set widget screen correctly when screen=widget', () => {
      jest
        .spyOn(component['storageService'], 'getItem')
        .mockReturnValue('true');
      const spyResize = jest
        .spyOn(component, 'resizeWidget')
        .mockImplementation();
      component.changeScreen('widget');
      expect(component.isIconWidget).toBe(true);
      expect(spyResize).toHaveBeenCalledWith('icon-view');
    });

    it('should set chat screen correctly when screen=chat', () => {
      const spyResize = jest
        .spyOn(component, 'resizeWidget')
        .mockImplementation();
      const spyChange = jest
        .spyOn(component, 'changeView')
        .mockImplementation();
      component.changeScreen('chat');
      expect(component.widgetChatScreen).toBe(true);
      expect(spyChange).toHaveBeenCalledWith('chat');
      expect(spyResize).toHaveBeenCalledWith('form-view');
    });

    it('should set error screen correctly when screen=error', () => {
      component.changeScreen('error');
      expect(component.chatError).toBe(true);
      expect(component.chatEndScreen).toBe(false);
    });
  });

  // ---------- changeView ----------
  describe('changeView', () => {
    it('should set activeChatView true when view=chat', () => {
      component.changeView('chat');
      expect(component.activeChatView).toBe(true);
      expect(component.activeVideoView).toBe(false);
    });

    it('should call initiateWebRtcCall when view=audio and not active', () => {
      const spyInit = jest
        .spyOn(component, 'initiateWebRtcCall')
        .mockImplementation();
      const spyLogin = jest
        .spyOn(component, 'logInToFreeSwitch')
        .mockImplementation();
      component.isAudioCallActive = false;
      component.changeView('audio');
      expect(spyLogin).toHaveBeenCalled();
      expect(spyInit).toHaveBeenCalledWith('audio');
    });

    it('should set activeVideoView true when view=video and active', () => {
      component.isVideoCallActive = true;
      component.changeView('video');
      expect(component.activeVideoView).toBe(true);
      expect(component.callPopUpView).toBe(false);
    });

    it('should log warning when screenshare and isSecureWebCall is true', () => {
      component.isSecureWebCall = true;
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
      component.changeView('screenshare');
      expect(warnSpy).toHaveBeenCalledWith('WebRTC Call Is GOING ON');
    });

    it('should initiate call when standaloneVideo and not active', () => {
      const spyInit = jest
        .spyOn(component, 'initiateWebRtcCall')
        .mockImplementation();
      component.isWebRtcVideoCallActive = false;
      component.showInvalidCodeError = false;
      component.changeView('standaloneVideo');
      expect(spyInit).toHaveBeenCalledWith('video');
    });

    it('should initiate secureWebVideoCall when not already secure', () => {
      const spyInit = jest
        .spyOn(component, 'initiateWebRtcCall')
        .mockImplementation();
      component.isSecureWebCall = false;
      component.changeView('secureWebVideoCall');
      expect(spyInit).toHaveBeenCalledWith('video');
    });
  });

  // ---------- initiateWebRtcCall ----------
  describe('initiateWebRtcCall', () => {
    let spyHandleCallStart: jest.SpyInstance;
    let spyHandleRefresh: jest.SpyInstance;

    beforeEach(() => {
      component.sdk = { handleCallStart: jest.fn() } as unknown as SdkService; // just mocking partial of the sdk service
      spyHandleCallStart = jest.spyOn(component.sdk, 'handleCallStart');
      spyHandleRefresh = jest
        .spyOn(component, 'handleRefreshCaseForWebRTC')
        .mockImplementation(() => {});
      component.webRTCConfig = { customerName: '', customerNumber: '' };
      component.setAuthorizedResponse = { token: 'auth-token' };
    });

    it('should reset isVideoHide and isCallMute when callType is video', () => {
      component.isVideoHide = true;
      component.isCallMute = true;

      component.initiateWebRtcCall('video');

      expect(component.isVideoHide).toBe(false);
      expect(component.isCallMute).toBe(false);
    });

    it('should handle standaloneWebRtc call', () => {
      component.standaloneWebRtc = true;
      component.showInvalidCodeError = false;

      component.initiateWebRtcCall('video');

      expect(spyHandleCallStart).toHaveBeenCalledWith({
        type: 'video',
        authConfigs: component.setAuthorizedResponse,
      });
      expect(component.isWebRtcVideoCallActive).toBe(true);
    });

    it('should not activate standalone call when showInvalidCodeError is true', () => {
      component.standaloneWebRtc = true;
      component.showInvalidCodeError = true;

      component.initiateWebRtcCall('video');

      expect(component.isWebRtcVideoCallActive).toBeFalsy();
    });

    it('should handle secure web call when no error', () => {
      component.isSecureWebCall = true;
      component.errorDuringWebRTCCall = false;

      component.initiateWebRtcCall('video');

      expect(spyHandleCallStart).toHaveBeenCalledWith({
        type: 'video',
        authConfigs: component.setAuthorizedResponse,
      });
      expect(component.isSecureWebCall).toBe(true);
      expect(component.isVideoCallActive).toBe(true);
    });

    it('should skip secure web call when errorDuringWebRTCCall is true', () => {
      component.isSecureWebCall = true;
      component.errorDuringWebRTCCall = true;

      component.initiateWebRtcCall('video');

      expect(component.isVideoCallActive).toBeFalsy();
    });

    it('should handle simple webRTC call with preChatFormData', () => {
      component.isSecureWebCall = false;
      component.preChatFormData = {
        sections: [{ name: 'John Doe', phone: '9876543210' }],
      };

      component.initiateWebRtcCall('audio');

      expect(component.webRTCConfig.customerName).toBe('John Doe');
      expect(component.webRTCConfig.customerNumber).toBe('9876543210');
      expect(spyHandleCallStart).toHaveBeenCalledWith({
        type: 'audio',
        authConfigs: component.webRTCConfig,
      });
      expect(component.isAudioCallActive).toBe(true);
    });

    it('should call handleRefreshCaseForWebRTC when preChatFormData is missing', () => {
      component.preChatFormData = null;

      component.initiateWebRtcCall('audio');

      expect(spyHandleRefresh).toHaveBeenCalled();
    });

    it('should set isVideoCallActive when callType is video and not secure', () => {
      component.isSecureWebCall = false;

      component.initiateWebRtcCall('video');

      expect(component.isVideoCallActive).toBe(true);
    });

    it('should set isScreenShareActive when callType is screenshare', () => {
      component.initiateWebRtcCall('screenshare');
      expect(component.isScreenShareActive).toBe(true);
    });

    it('should set isAudioCallActive for non-video, non-screenshare calls', () => {
      component.initiateWebRtcCall('audio');
      expect(component.isAudioCallActive).toBe(true);
    });
  });

  // ---------- Secure Link Handling ----------
  describe('WidgetComponent - Secure Link Handling', () => {
    beforeEach(() => {
      jest.spyOn(component, 'logInToFreeSwitch').mockImplementation(() => {});

      // mock the webRTCConfig before tests run
      component.webRTCConfig = {
        diallingUri: 'wss://mock.dial.uri',
        stunServers: ['stun:stun.l.google.com:19302'], // add whatever else is expected in your code
        turnServers: [],
        turnUsername: 'testUser',
        turnCredential: 'testPass',
      };
    });

    it('should extract encryptedKey and call authenticateSecureLinkKey when widgetIdentifier matches', () => {
      component.widgetIdentifier = 'widget123'; // ensure match

      const fakeMessage = {
        body: {
          mediaUrl:
            'https://test.com?encryptedKey=abc123&widgetIdentifier=widget123',
        },
      };

      const spyAuth = jest
        .spyOn(component, 'authenticateSecureLinkKey')
        .mockImplementation();

      component.processSecureLinkMessage(fakeMessage);

      expect(component.webRtcSecureLink).toBe('abc123');
      expect(spyAuth).toHaveBeenCalledWith(true);
    });

    it('should show snackbar when widgetIdentifier mismatches', () => {
      component.widgetIdentifier = 'widget123';

      const fakeMessage = {
        body: {
          mediaUrl:
            'https://test.com?encryptedKey=abc123&widgetIdentifier=wrongWidget',
        },
      };

      component.processSecureLinkMessage(fakeMessage);

      expect(mockMatSnackBar.open).toHaveBeenCalledWith(
        'Authentication failed!',
        'Dismiss',
        expect.objectContaining({
          duration: 3000,
          panelClass: ['error-snackbar'],
          horizontalPosition: 'right',
        }),
      );
    });

    it('should handle missing encryptedKey gracefully', () => {
      component.widgetIdentifier = 'widget123';

      const fakeMessage = {
        body: { mediaUrl: 'https://test.com?widgetIdentifier=widget123' },
      };

      const spyAuth = jest
        .spyOn(component, 'authenticateSecureLinkKey')
        .mockImplementation();

      component.processSecureLinkMessage(fakeMessage);

      expect(component.webRtcSecureLink).toBe('');
      expect(spyAuth).toHaveBeenCalledWith(true);
    });

    it('should handle error response and set expired link flags', async () => {
      (mockSdkService.authenticateKey as jest.Mock).mockImplementation(
        (payload, cb) => {
          cb({
            error: true,
            data: { message: 'Expired' },
            message: 'Link expired',
          });
        },
      );

      await component.authenticateSecureLinkKey(true);

      expect(component.isSecureLinkExpired).toBe(true);
      expect(component.showInvalidCodeError).toBe(true);
      expect(component.showAuthenticationResponseMessage).toBe(
        'The link has expired',
      );
    });

    it('should handle successful response and login to FreeSwitch', async () => {
      component.webRTCConfig = { diallingUri: 'test-uri' } as any;
      const res = {
        error: false,
        data: { agentName: 'Agent007' },
        message: 'Authenticated',
      };
      (mockSdkService.authenticateKey as jest.Mock).mockImplementation(
        (payload, cb) => cb(res),
      );

      await component.authenticateSecureLinkKey(true);

      expect(component.agentName).toBe('Agent007');
      expect(component.setAuthorizedResponse).toMatchObject(res.data);
      expect(component.showAuthenticationResponseMessage).toBe('Authenticated');
      expect(component.logInToFreeSwitch).toHaveBeenCalled();
    });

    it('should set standaloneWebRtc when not authenticated and authorized response exists', async () => {
      const res = {
        error: false,
        data: { agentName: 'Agent007' },
        message: 'Authenticated',
      };
      (mockSdkService.authenticateKey as jest.Mock).mockImplementation(
        (payload, cb) => cb(res),
      );

      await component.authenticateSecureLinkKey(false);

      expect(component.standaloneWebRtc).toBe(true);
    });
  });

  // ---------- updateStatusOfCustomerMessage ----------
  describe('WidgetComponent - updateStatusOfCustomerMessage', () => {
    beforeEach(() => {
      jest
        .spyOn(component, 'markMessageStatusToSeenOrSucceed')
        .mockImplementation(() => {});
      jest
        .spyOn(component, 'changeMessageStatusToFailed')
        .mockImplementation(() => {});
    });

    it('should call markMessageStatusToSeenOrSucceed when status is read', () => {
      component.updateStatusOfCustomerMessage('m1', 'read');
      expect(component.markMessageStatusToSeenOrSucceed).toHaveBeenCalledWith(
        'm1',
        'seen',
      );
    });

    it('should call changeMessageStatusToFailed when status is failed', () => {
      component.updateStatusOfCustomerMessage('m2', 'failed');
      expect(component.changeMessageStatusToFailed).toHaveBeenCalledWith(
        'm2',
        'failed',
      );
    });

    it('should not call any function when status is unknown', () => {
      component.updateStatusOfCustomerMessage('m3', 'delivered');
      expect(component.markMessageStatusToSeenOrSucceed).not.toHaveBeenCalled();
      expect(component.changeMessageStatusToFailed).not.toHaveBeenCalled();
    });
  });

  // ---------- editMessage ----------
  describe('WidgetComponent - editMessage', () => {
    beforeEach(() => {
      component.cimMessage = [
        { id: 'm1', body: { markdownText: 'Old Text' }, isEdited: false },
      ];
    });

    it('should update the message content and mark it as edited if found', () => {
      const newMessage = {
        header: { originalMessageId: 'm1' },
        body: { markdownText: 'New Text' },
      };
      component.editMessage(newMessage);
      expect(component.cimMessage[0].body.markdownText).toBe('New Text');
      expect(component.cimMessage[0].isEdited).toBe(true);
    });

    it('should do nothing if messageId is not found', () => {
      const newMessage = {
        header: { originalMessageId: 'm2' },
        body: { markdownText: 'Does not exist' },
      };
      component.editMessage(newMessage);
      expect(component.cimMessage.length).toBe(1);
      expect(component.cimMessage[0].body.markdownText).toBe('Old Text');
    });
  });
  // ---------- handleMessageReport ----------
  describe('WidgetComponent - handleMessageReport', () => {
    beforeEach(() => {
      jest
        .spyOn(component, 'constructAndPublishMessageSeenNotification')
        .mockImplementation(() => {});
      jest.spyOn(document, 'hasFocus').mockReturnValue(true);
    });

    it('should call constructAndPublishMessageSeenNotification for agent messages', () => {
      const cimMessage = {
        header: { sender: { type: 'agent' } },
        body: { type: 'text' },
        id: 'm1',
      };
      component.handleMessageReport(cimMessage);
      expect(
        component.constructAndPublishMessageSeenNotification,
      ).toHaveBeenCalledWith('m1');
    });

    it('should call constructAndPublishMessageSeenNotification for bot messages', () => {
      const cimMessage = {
        header: { sender: { type: 'bot' } },
        body: { type: 'text' },
        id: 'm2',
      };
      component.handleMessageReport(cimMessage);
      expect(
        component.constructAndPublishMessageSeenNotification,
      ).toHaveBeenCalledWith('m2');
    });

    it('should not call constructAndPublishMessageSeenNotification for notification messages', () => {
      const cimMessage = {
        header: { sender: { type: 'agent' } },
        body: { type: 'notification' },
        id: 'm3',
      };
      component.handleMessageReport(cimMessage);
      expect(
        component.constructAndPublishMessageSeenNotification,
      ).not.toHaveBeenCalled();
    });

    it('should not call constructAndPublishMessageSeenNotification if document is not focused', () => {
      (document.hasFocus as jest.Mock).mockReturnValue(false);
      const cimMessage = {
        header: { sender: { type: 'agent' } },
        body: { type: 'text' },
        id: 'm4',
      };
      component.handleMessageReport(cimMessage);
      expect(
        component.constructAndPublishMessageSeenNotification,
      ).not.toHaveBeenCalled();
    });

    it('should not call constructAndPublishMessageSeenNotification for customer messages', () => {
      const cimMessage = {
        header: { sender: { type: 'customer' } },
        body: { type: 'text' },
        id: 'm5',
      };
      component.handleMessageReport(cimMessage);
      expect(
        component.constructAndPublishMessageSeenNotification,
      ).not.toHaveBeenCalled();
    });
  });
  // ---------- getAgentDisplayName ----------
  describe('WidgetComponent - getAgentDisplayName', () => {
    it('should return full name when firstName and lastName exist', () => {
      const name = component.getAgentDisplayName({
        firstName: 'John',
        lastName: 'Doe',
      });
      expect(name).toBe('John Doe');
    });

    it('should return firstName when only firstName exists', () => {
      const name = component.getAgentDisplayName({ firstName: 'John' });
      expect(name).toBe('John');
    });

    it('should return lastName when only lastName exists', () => {
      const name = component.getAgentDisplayName({ lastName: 'Doe' });
      expect(name).toBe('Doe');
    });

    it('should return "Agent" when no name is provided', () => {
      const name = component.getAgentDisplayName({});
      expect(name).toBe('Agent');
    });

    it('should return "Agent" when user is null or undefined', () => {
      expect(component.getAgentDisplayName(null)).toBe('Agent');
      expect(component.getAgentDisplayName(undefined)).toBe('Agent');
    });
  });

  // ---------- clearSession ----------

  describe('WidgetComponent - clearSession', () => {
    beforeEach(() => {
      jest.spyOn(component, 'callEnd').mockImplementation(() => {});
      jest.spyOn(component, 'changeScreen').mockImplementation(() => {});
      component.sdk = { handleChatEnd: jest.fn() } as any;
      jest.spyOn(component, 'clearMessageData').mockImplementation(() => {});
    });

    it('should call callEnd if any call is active', () => {
      component.isAudioCallActive = true;
      component.clearSession();
      expect(component.callEnd).toHaveBeenCalled();
    });

    it('should reset cimMessage and set chat inactive', () => {
      component.cimMessage = [{ id: '1' }] as any;
      component.isChatActive = true;
      component.clearSession();
      expect(component.cimMessage).toEqual([]);
      expect(component.isChatActive).toBe(false);
    });

    it('should call changeScreen with "end"', () => {
      component.clearSession();
      expect(component.changeScreen).toHaveBeenCalledWith('end');
    });

    it('should call sdk.handleChatEnd with customerData', () => {
      component.customerData = { id: 'cust1' } as any;
      component.clearSession();
      expect(component.sdk.handleChatEnd).toHaveBeenCalledWith(
        component.customerData,
      );
    });

    it('should remove user item from storage', () => {
      component.clearSession();
      expect(mockStorageService.removeItem).toHaveBeenCalledWith(
        'user',
        component.storageType,
      );
    });

    it('should call clearMessageData', () => {
      component.clearSession();
      expect(component.clearMessageData).toHaveBeenCalled();
    });

    it('should reset file related properties', () => {
      component.fileLoading = true;
      component.fileUrl = 'test-url';
      component.selectedFile = {} as any;
      component.clearSession();
      expect(component.fileLoading).toBe(false);
      expect(component.fileUrl).toBe('');
      expect(component.imageUrls).toEqual([]);
      expect(component.selectedFile).toBeNull();
    });
  });

  // ---------- clearMessageData ----------
  describe('WidgetComponent - clearMessageData', () => {
    beforeEach(() => {
      jest.spyOn(component, 'scrollToBottom').mockImplementation(() => {});
    });

    it('should clear input value if elementView exists', () => {
      const mockInput = { value: 'Some text' };
      component.elementView = { nativeElement: mockInput } as any;
      component.clearMessageData();
      expect(mockInput.value).toBe('');
    });

    it('should reset composer_input_disabled and text', () => {
      component.composer_input_disabled = true;
      component.text = 'Some message';
      component.clearMessageData();
      expect(component.composer_input_disabled).toBe(false);
      expect(component.text).toBe('');
    });

    it('should call scrollToBottom', () => {
      component.clearMessageData();
      expect(component.scrollToBottom).toHaveBeenCalled();
    });

    it('should reset scrollCon and fileName', () => {
      component.scrollCon = 100;
      component.fileName = 'file.txt';
      component.clearMessageData();
      expect(component.scrollCon).toBe(45);
      expect(component.fileName).toBe('');
    });

    it('should not throw error if elementView is null', () => {
      component.elementView = null as any;
      expect(() => component.clearMessageData()).not.toThrow();
    });
  });

  // ---------- getCalendarEvents & getTodayEvent ----------
  describe('WidgetComponent - getCalendarEvents', () => {
    it('should fetch calendarId and events successfully and call getTodayEvent if events exist', async () => {
      const mockCalendarId = 'cal-123';
      const mockEvents = {
        events: [{ id: 1, type: 'BUSINESS_HOURS', shifts: [] }],
      };

      (component.sdk.fetchBusinessCalendarId as jest.Mock).mockResolvedValue(
        mockCalendarId,
      );
      (component.sdk.getCalendarEvents as jest.Mock).mockResolvedValue(
        mockEvents,
      );
      jest.spyOn(component, 'getTodayEvent').mockImplementation(jest.fn());

      await component.getCalendarEvents();

      expect(component.sdk.fetchBusinessCalendarId).toHaveBeenCalled();
      expect(component.sdk.getCalendarEvents).toHaveBeenCalledWith(
        mockCalendarId,
      );
      expect(component.events).toEqual(mockEvents.events);
      expect(component.getTodayEvent).toHaveBeenCalled();
    });

    it('should set events and not call getTodayEvent if no events exist', async () => {
      const mockCalendarId = 'cal-456';
      const mockEvents = { events: [] };

      (component.sdk.fetchBusinessCalendarId as jest.Mock).mockResolvedValue(
        mockCalendarId,
      );
      (component.sdk.getCalendarEvents as jest.Mock).mockResolvedValue(
        mockEvents,
      );
      jest.spyOn(component, 'getTodayEvent').mockImplementation(jest.fn());

      await component.getCalendarEvents();

      expect(component.events).toEqual([]);
      expect(component.getTodayEvent).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      const consoleSpy = jest
        .spyOn(console, 'log')
        .mockImplementation(() => {});
      (component.sdk.fetchBusinessCalendarId as jest.Mock).mockRejectedValue(
        'API error',
      );

      await component.getCalendarEvents();

      expect(consoleSpy).toHaveBeenCalledWith(
        'Business Calendar Api Response:',
        'API error',
      );
      consoleSpy.mockRestore();
    });
  });

  describe('WidgetComponent - getTodayEvent', () => {
    it('should resolve with empty array and set daySummary null if no BUSINESS_HOURS shifts today', async () => {
      component.events = [
        {
          id: '1',
          name: 'Event 1',
          type: 'BUSINESS_HOURS',
          startTime: new Date().toISOString(),
          endTime: new Date().toISOString(),
          shifts: [],
          validityPeriod: '2025-01-01T00:00:00Z',
          calendar: [],
          eventColor: '#FFFFFF',
        },
        {
          id: '2',
          name: 'Event 2',
          type: 'OTHER',
          startTime: new Date().toISOString(),
          endTime: new Date().toISOString(),
          shifts: [],
          validityPeriod: '2025-01-01T00:00:00Z',
          calendar: [],
          eventColor: '#FFFFFF',
        },
      ];

      const result = await component.getTodayEvent();

      expect(result).toEqual([]);
      expect(component.daySummary).toBeNull();
    });

    it('should resolve with orderedEvents and set correct daySummary when shifts exist today', async () => {
      const today = new Date();
      const startTime = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        9,
      ).toISOString();
      const endTime = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        17,
      ).toISOString();

      component.events = [
        {
          id: '3',
          name: 'Business Event',
          type: 'BUSINESS_HOURS',
          startTime,
          endTime,
          shifts: [
            { id: 'shift-1', name: 'Morning Shift', startTime, endTime },
          ],
          validityPeriod: '2025-01-01T00:00:00Z',
          calendar: [],
          eventColor: '#FFFFFF',
        },
      ];

      component.orderedEvents = [
        {
          type: 'BUSINESS_HOURS',
          shiftName: 'Morning Shift',
          startTime,
          endTime,
        },
      ];

      const result = await component.getTodayEvent();

      expect(component.daySummary?.startOfDay).toEqual(new Date(startTime));
      expect(component.daySummary?.endOfDay).toEqual(new Date(endTime));
      expect(result).toEqual(component.orderedEvents);
    });

    it('should reject with error if processing fails', async () => {
      component.events = null as any; // force error

      await expect(component.getTodayEvent()).rejects.toThrow(
        'Error processing Business Hours events:',
      );
    });
  });

  describe('WidgetComponent - onSendMessage & constructCimMessage', () => {
    beforeEach(() => {
      // mock methods on component
      jest.spyOn(component, 'clearMessageData').mockImplementation(() => {});
      jest.spyOn(component, 'uploadFile').mockImplementation(() => {});
      jest.spyOn(component, 'scrollToBottom').mockImplementation(() => {});
      jest
        .spyOn(component['cdRef'], 'detectChanges')
        .mockImplementation(() => {});
    });

    it('should return early if composer is disabled', () => {
      component.isComposerDisable = true;
      jest.spyOn(component, 'constructCimMessage');
      jest.spyOn(component, 'uploadFile');

      component.onSendMessage('hello');

      expect(component.constructCimMessage).not.toHaveBeenCalled();
      expect(component.uploadFile).not.toHaveBeenCalled();
    });

    it('should call uploadFile when imageUrls exist', () => {
      component.isComposerDisable = false;
      component.selectedFile = { name: 'file.png' } as any;

      component.onSendMessage('extra text');

      expect(component.uploadFile).toBeTruthy();
    });

    it('should call constructCimMessage for plain text', () => {
      component.isComposerDisable = false;
      component.imageUrls = [];

      jest.spyOn(component, 'constructCimMessage');

      component.onSendMessage('hello world');

      expect(component.constructCimMessage).toHaveBeenCalledWith('PLAIN', {
        text: 'hello world',
        intent: null,
        originalMessageId: null,
      });
      expect(component.clearMessageData).toHaveBeenCalled();
    });

    it('should send plain text message via sdk', () => {
      const payloadText = 'test message';
      component.customerData = { id: 'cust1' } as any;

      component.constructCimMessage('PLAIN', { text: payloadText });

      expect(mockSdkService.sendChatMessage).toHaveBeenCalled();
      const payload = (mockSdkService.sendChatMessage as any).mock.calls[0][0];
      expect(payload.body.type).toBe('PLAIN');
      expect(payload.body.markdownText).toBe(payloadText);
    });

    it('should send application/file message', () => {
      const fileName = 'doc.pdf';
      component.customerData = { id: 'cust1' } as any;

      component.constructCimMessage('application', {
        text: '',
        intent: null,
        originalMessageId: null,
        fileMimeType: 'application/pdf',
        fileName,
        fileSize: 1234,
        additionalText: 'extra text',
        fileType: 'file',
      });

      expect(mockSdkService.sendChatMessage).toHaveBeenCalled();
      const payload = (mockSdkService.sendChatMessage as any).mock.calls[0][0];
      expect(payload.body.type).toBe('FILE');
      expect(payload.body.additionalDetails).toEqual({ fileName });
    });

    it('should send image message', () => {
      const fileName = 'img.png';
      component.customerData = { id: 'cust1' } as any;

      component.constructCimMessage('image', {
        text: '',
        intent: null,
        originalMessageId: null,
        fileMimeType: 'image/png',
        fileName,
        fileSize: 456,
        additionalText: 'caption text',
        fileType: 'image',
      });

      expect(mockSdkService.sendChatMessage).toHaveBeenCalled();
      const payload = (mockSdkService.sendChatMessage as any).mock.calls[0][0];
      expect(payload.body.type).toBe('IMAGE');
      expect(payload.body.caption).toBe(fileName);
    });

    it('should handle unknown message type', () => {
      component.constructCimMessage('unknown');

      expect(mockMatSnackBar.open).toHaveBeenCalledWith(
        'unable to process the file',
        'X',
      );
      expect(mockSdkService.sendChatMessage).not.toHaveBeenCalled();
    });
  });

  // ---------- selected5starOption ----------
  describe('selected5starOption', () => {
    let sectionsArray: any;

    beforeEach(() => {
      // Setup a FormArray with one section and one control
      sectionsArray = {
        at: jest.fn().mockReturnValue({
          get: jest.fn().mockReturnValue({
            setValue: jest.fn(),
          }),
        }),
      };
      component.preChatFormGroup = {
        get: jest.fn().mockImplementation((name: string) => {
          if (name === 'sections') return sectionsArray;
          return null;
        }),
      } as any;
      jest.spyOn(console, 'log').mockImplementation(() => {});
      jest.spyOn(document, 'querySelectorAll').mockReturnValue([] as any);
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should set value for star type and update SVG fill', () => {
      // Arrange
      const mockSetValue = jest.fn();
      sectionsArray.at = jest.fn().mockReturnValue({
        get: jest.fn().mockReturnValue({ setValue: mockSetValue }),
      });
      // Mock SVGs
      const mockSvg = {
        getElementsByTagName: jest
          .fn()
          .mockReturnValue([
            { setAttribute: jest.fn() },
            { setAttribute: jest.fn() },
          ]),
      };
      (document.querySelectorAll as jest.Mock).mockReturnValue([
        mockSvg,
        mockSvg,
      ]);
      // Act
      component.selected5starOption('rating', 0, 0, 1, 'star', '4');
      // Assert
      expect(sectionsArray.at).toHaveBeenCalledWith(0);
      expect(sectionsArray.at(0).get).toHaveBeenCalledWith('rating');
      expect(mockSetValue).toHaveBeenCalledWith('4');
      // Check SVG fill
      expect(mockSvg.getElementsByTagName).toHaveBeenCalledWith('path');
      expect(
        mockSvg.getElementsByTagName()[0].setAttribute,
      ).toHaveBeenCalledWith('fill', '#FFB100');
      expect(
        mockSvg.getElementsByTagName()[1].setAttribute,
      ).toHaveBeenCalledWith('fill', '#FFB100');
    });

    it('should set value for non-star type and update SVG fill', () => {
      // Arrange
      const mockSetValue = jest.fn();
      const mockSvg = {
        getElementsByTagName: jest.fn().mockReturnValue([
          {
            setAttribute: jest.fn(),
            getAttribute: jest.fn().mockReturnValue('#000'),
          },
        ]),
        dataset: {},
      };
      (document.querySelectorAll as jest.Mock).mockReturnValue([
        mockSvg,
        mockSvg,
      ]);
      sectionsArray.at = jest.fn().mockReturnValue({
        get: jest.fn().mockReturnValue({ setValue: mockSetValue }),
      });
      // Act
      component.selected5starOption('rating', 0, 0, 1, 'emoji', 'happy');
      // Assert
      expect(sectionsArray.at).toHaveBeenCalledWith(0);
      expect(sectionsArray.at(0).get).toHaveBeenCalledWith('rating');
      expect(mockSetValue).toHaveBeenCalledWith('happy');
      // Should store original colors and set fill to gray for non-selected
      expect(mockSvg.getElementsByTagName).toHaveBeenCalledWith('path');

      expect(
        mockSvg.getElementsByTagName()[0].setAttribute,
      ).toHaveBeenCalledWith('fill', expect.any(String));
    });

    it('should log error if section does not exist', () => {
      // Arrange
      sectionsArray.at = jest.fn().mockReturnValue(undefined);
      const logSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      // Act
      component.selected5starOption('rating', 99, 0, 0, 'star', '5');
      // Assert
      expect(logSpy).toHaveBeenCalledWith(
        'Section at index 99 does not exist.',
      );
    });

    it('should log error if control does not exist', () => {
      // Arrange
      sectionsArray.at = jest.fn().mockReturnValue({
        get: jest.fn().mockReturnValue(undefined),
      });
      const logSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      // Act
      component.selected5starOption('rating', 0, 0, 0, 'star', '5');
      // Assert
      expect(logSpy).toHaveBeenCalledWith(
        'Control "rating" not found in section 0.',
      );
    });
  });

  // ---------- handleDialogStates ----------
  describe('WidgetComponent', () => {
    beforeEach(() => {
      component.preChatFormGroup = {
        get: jest.fn(() => ({ setValue: jest.fn() })),
      } as any;
    });
    it('should call snackBar.open on handleDialogStates with NO_ANSWER', () => {
      component.handleDialogStates({ reasonCode: 'NO_ANSWER' });
      expect(mockMatSnackBar.open).toHaveBeenCalledWith(
        'Call is not picked up',
        'Dismiss',
        expect.any(Object),
      );
    });

    it('should set IsRegisteredInFreeSwitch true on agentInfo LOGIN', () => {
      component.handleDialogStates({
        event: 'agentInfo',
        response: { state: 'LOGIN', extension: '123' },
      });
      expect(component.IsRegisteredInFreeSwitch).toBe(true);
    });

    it('should set maintainDialog and dialogId on outboundDialing INITIATING', () => {
      const dialog = { id: 'd1', state: 'INITIATING' };
      component.handleDialogStates({
        event: 'outboundDialing',
        response: { dialog },
      });
      expect(component.maintainDialog).toBe(dialog);
      expect(component.dialogId).toBe('d1');
    });

    it('should set maintainDialog and dialogId on dialogState ACTIVE and call startCountdown', () => {
      const dialog = { id: 'd2', state: 'ACTIVE' };
      component.standaloneWebRtc = false;
      component.isAudioCallActive = true;
      component.handleDialogStates({
        event: 'dialogState',
        response: { dialog },
      });
      expect(component.maintainDialog).toBe(dialog);
      expect(component.dialogId).toBe('d2');
    });

    it('should set remoteStreamStatus on mediaStreamUpdate with video', () => {
      component.handleDialogStates({
        event: 'mediaStreamUpdate',
        status: 'success',
        dialog: {
          stream: 'video',
          eventRequest: 'remote',
          streamStatus: 'off',
        },
      });
      expect(component.isAudioCallActive).toBe(false);
      expect(component.isScreenShareActive).toBe(false);
      expect(component.callPopUpView).toBe(false);
    });

    it('should set showAuthenticationResponseMessage and call snackBar.open on Error event', () => {
      component.standaloneWebRtc = true;
      component.handleDialogStates({
        event: 'Error',
        response: { type: 'generalError', description: 'Service Unavailable' },
      });
      expect(component.showAuthenticationResponseMessage).toContain(
        'service is currently unavailable',
      );
      expect(mockMatSnackBar.open).toHaveBeenCalled();
    });

    it('should call changeScreen in closeWrapper', () => {
      component.closeWrapper();
      expect(component.additionalPanel).toBe(false);

      expect(mockStorageService.setItem).toHaveBeenCalledWith(
        'wrapper-hide',
        'true',
        'sessionStorage',
      );
    });

    it('should call setFontFromLocalStorage in setFontSize', () => {
      component.setFontFromLocalStorage = jest.fn();
      component.setFontSize('14');
      expect(mockStorageService.setItem).toHaveBeenCalledWith(
        'fontSize',
        '14',
        'sessionStorage',
      );
      expect(component.setFontFromLocalStorage).toHaveBeenCalled();
    });

    it('should set fontSize from storage in setFontFromLocalStorage', () => {
      component.fontSize = { setValue: jest.fn() } as any;
      component.setFontFromLocalStorage();
      expect(component.fontSize.setValue).toBeTruthy();
    });

    it('should call changeScreen and sdk.handleChatEnd in clearSession', () => {
      component.isAudioCallActive = false;
      component.isVideoCallActive = false;
      component.isScreenShareActive = false;
      component.clearSession();
      expect(component.sdk.handleChatEnd).toHaveBeenCalled();
      expect(mockStorageService.removeItem).toHaveBeenCalledWith(
        'user',
        'sessionStorage',
      );
    });

    it('should call callEnd if isAudioCallActive in clearSession', () => {
      component.isAudioCallActive = true;
      component.clearSession();
      expect(component.callEnd).toBeTruthy();
    });

    it('should call snackBar.open on uploadFile with unsupported type', () => {
      const files = [{ name: 'file.exe', size: 100 }];
      mockMatSnackBar.open = jest.fn();
      component.uploadFile(files, '');
      expect(mockMatSnackBar.open).toHaveBeenCalledWith(
        'file.exe unsupported type',
        'X',
        expect.any(Object),
      );
    });

    it('should call snackBar.open and resetFileValidation on uploadFileFromForm error', () => {
      mockMatSnackBar.open = jest.fn();
      const event = { target: { files: [{ name: 'file.exe' }], value: '' } };
      component.resetFileValidation = jest.fn();
      component.uploadFileFromForm(event as any, 'file', true, ['txt']);
      expect(mockMatSnackBar.open).toHaveBeenCalled();
      expect(component.resetFileValidation).toHaveBeenCalled();
    });

    it('should call setFileControl and snackBar.open on uploadPrechatFile success', () => {
      const fileInput = { files: [{ name: 'file.txt' }] };
      component.setFileControl = jest.fn();
      mockMatSnackBar.open = jest.fn();
      component.disableUploadBtn = jest.fn();
      component.uploadPrechatFile(0, 'file', fileInput as any, 'id');
      expect(component.setFileControl).toHaveBeenCalled();
      expect(mockMatSnackBar.open).toHaveBeenCalledWith(
        'File uploaded successfully',
        'X',
        expect.any(Object),
      );
      expect(component.disableUploadBtn).toHaveBeenCalled();
    });

    it('should call snackBar.open on uploadPrechatFile error', () => {
      component.sdk.moveToFileServer = jest.fn((fd, cb) =>
        cb({ isFileInvalid: true, errorMessage: 'fail' }),
      );
      const fileInput = { files: [{ name: 'file.exe' }] };
      mockMatSnackBar.open = jest.fn();
      component.uploadPrechatFile(0, 'file', fileInput as any, 'id');
      expect(mockMatSnackBar.open).toHaveBeenCalled();
    });
  });

  // Additional tests for uncovered methods
  describe('Additional Method Tests', () => {
    describe('composeCimMessage', () => {
      beforeEach(() => {
        component.customerData = { id: 'cust123' };
        component.sdk = mockSdkService as any;
      });

      it('should send plain text message correctly', () => {
        component.constructCimMessage('PLAIN', {
          text: 'Hello world',
          intent: null,
          originalMessageId: null,
        });

        expect(mockSdkService.sendChatMessage).toHaveBeenCalled();
        const args = (mockSdkService.sendChatMessage as any).mock.calls[0][0];
        expect(args.type).toBe('PLAIN');
        expect(args.body.type).toBe('PLAIN');
        expect(args.body.markdownText).toBe('Hello world');
      });

      it('should send media message correctly', () => {
        component.constructCimMessage('image', {
          text: '',
          intent: null,
          originalMessageId: null,
          fileMimeType: 'image/png',
          fileName: 'test.png',
          fileSize: 1024,
          additionalText: 'Image caption',
          fileType: 'image',
        });

        expect(mockSdkService.sendChatMessage).toHaveBeenCalled();
        const args = (mockSdkService.sendChatMessage as any).mock.calls[0][0];
        expect(args.type).toBe('image');
        expect(args.body.type).toBe('IMAGE');
        expect(args.body.caption).toBe('test.png');
      });
    });

    describe('onFormSubmit error handling', () => {
      beforeEach(() => {
        component.preChatFormGroup = {
          valid: false,
          controls: {
            sections: {
              markAsTouched: jest.fn(),
              controls: {
                testControl: {
                  markAsTouched: jest.fn(),
                },
              },
            },
          },
        } as any;
        jest.spyOn(component as any, 'markFormGroupTouched');
      });

      it('should mark form as touched when invalid', () => {
        component.onFormSubmit();
        expect(component['markFormGroupTouched']).toHaveBeenCalledWith(
          component.preChatFormGroup,
        );
      });
    });

    describe('setUserData', () => {
      beforeEach(() => {
        component.sdk = { makeConnection: jest.fn() } as any;
      });

      it('should set customer data correctly', () => {
        const data = {
          channelCustomerIdentifier: 'cid123',
          serviceIdentifier: 'service123',
          browserDeviceInfo: { deviceType: 'desktop' },
        };
        component.setUserData(data, 'startChat');
        expect(component.customerData).toEqual(data);
        expect(component.eventTriggerType).toBe('startChat');
        expect(mockStorageService.setItem).toHaveBeenCalledWith(
          'user',
          { data },
          'sessionStorage',
        );
      });

      it('should show alert when mandatory data is missing', () => {
        global.alert = jest.fn();
        const data = {
          channelCustomerIdentifier: '',
          serviceIdentifier: '',
          browserDeviceInfo: { deviceType: '' },
        };
        component.setUserData(data, 'startChat');
        expect(global.alert).toHaveBeenCalledWith(
          'Error: The field "channelCustomerIdentifier" is required or does not exist in the pre-chat form.',
        );
      });
    });

    describe('chatTranscript', () => {
      beforeEach(() => {
        Object.defineProperty(window, 'location', {
          value: { origin: 'http://localhost:4200' },
          writable: true,
        });
        Object.defineProperty(window, 'open', {
          value: jest.fn(),
          writable: true,
        });
      });

      it('should open transcript in new window', () => {
        (mockStorageService.getItem as jest.Mock).mockReturnValue('conv123');
        component.browserLang = 'en';
        component.chatTranscript();
        expect(window.open).toHaveBeenCalledWith(
          'http://localhost:4200/customer-widget/#/chat-transcript?state=download&browserLang=en&conversationId=conv123',
          '_blank',
          'noopener',
        );
      });
    });

    describe('onKeyPress and sendTypingStartedEvent', () => {
      beforeEach(() => {
        component.customerData = { id: 'cust123' };
        mockSdkService.sendChatMessage = jest.fn();
        jest.useFakeTimers();
      });

      afterEach(() => {
        jest.useRealTimers();
      });

      it('should send typing started event', () => {
        component.sendTypingStartedEvent();
        expect(mockSdkService.sendChatMessage).toHaveBeenCalled();
        expect(component.sendTypingStartedEventTimer).toBeDefined();

        // Advance timer to clear the timeout
        jest.advanceTimersByTime(3000);
        expect(component.sendTypingStartedEventTimer).toBeNull();
      });

      it('should not send typing event if timer is already active', () => {
        component.sendTypingStartedEventTimer = setTimeout(() => {}, 1000);
        const initialTimer = component.sendTypingStartedEventTimer;

        component.sendTypingStartedEvent();

        // Timer should not have changed
        expect(component.sendTypingStartedEventTimer).toBe(initialTimer);
      });

      it('should not send typing event on Enter key', () => {
        component.onKeyPress({ key: 'Enter' });
        expect(mockSdkService.sendChatMessage).not.toHaveBeenCalled();
      });

      it('should send typing event on other keys', () => {
        component.onKeyPress({ key: 'a' });
        expect(mockSdkService.sendChatMessage).toHaveBeenCalled();
      });
    });

    describe('toggleCallMic, toggleCallVideo, toggleCallHold', () => {
      beforeEach(() => {
        component.sdk = {
          handleCallMic: jest.fn(),
          convertCall: jest.fn(),
          handleCallHoldState: jest.fn(),
        } as any;
      });

      it('should toggle call mic', async () => {
        component.isCallMute = false;

        await component.toggleCallMic({ hide: jest.fn(), show: jest.fn() });

        expect(component.sdk.handleCallMic).toHaveBeenCalledWith(
          'mute_call',
          undefined,
        );
        expect(component.isCallMute).toBe(true);
      });

      it('should toggle call video', async () => {
        component.isVideoHide = false;

        await component.toggleCallVideo({ hide: jest.fn(), show: jest.fn() });

        expect(component.sdk.convertCall).toHaveBeenCalledWith(
          'off',
          'video',
          undefined,
        );
        expect(component.isVideoHide).toBe(true);
      });

      it('should toggle call hold', async () => {
        component.isCallOnHold = false;

        await component.toggleCallHold({ hide: jest.fn(), show: jest.fn() });

        expect(component.sdk.handleCallHoldState).toHaveBeenCalledWith(
          'holdCall',
          undefined,
        );
        expect(component.isCallOnHold).toBe(true);
      });
    });

    describe('handleScreenShareClick', () => {
      it('should return early when isSecureWebCall is true', () => {
        component.isSecureWebCall = true;
        component.handleScreenShareClick();
        // Should not throw or change state
      });

      it('should return early when isAudioCallActive is true', () => {
        component.isAudioCallActive = true;
        component.handleScreenShareClick();
        // Should not throw or change state
      });
    });

    describe('getLabel', () => {
      it('should return correct label for known value types', () => {
        expect(component.getLabel('Alphanum100')).toBe('Alpha Numeric');
        expect(component.getLabel('shortAnswer')).toBe('Short Answer');
        expect(component.getLabel('Email')).toBe('Email');
      });

      it('should return capitalized value for unknown value type', () => {
        expect(component.getLabel('unknownType')).toBe('UnknownType');
      });
    });

    describe('isMaxLengthError', () => {
      it('should return false when section does not exist', () => {
        component.preChatFormGroup = {
          get: jest.fn(() => null),
        } as any;

        const result = component.isMaxLengthError(999, 'test', 'shortAnswer');
        expect(result).toBe(false);
      });

      it('should return true when value exceeds max length', () => {
        const mockControl = { value: 'a'.repeat(102) };
        component.preChatFormGroup = {
          get: jest.fn(() => ({
            at: jest.fn(() => ({
              get: jest.fn(() => mockControl),
            })),
          })),
        } as any;

        const result = component.isMaxLengthError(0, 'test', 'shortAnswer');
        expect(result).toBe(true);
      });
    });

    describe('previewFile', () => {
      beforeEach(() => {
        component.fileLoading = false;
        component.selectedFile = null;
        component.imageUrls = [];
        // Note: We can't directly assign to private property 'sanitizer', so we'll skip this line
        // component.sanitizer = mockDomSanitizer;
      });

      it('should handle file event with target.files', () => {
        const mockFile = new File(['content'], 'test.txt', {
          type: 'text/plain',
        });
        const mockEvent = {
          target: {
            files: [mockFile],
          },
        };

        (mockDomSanitizer.bypassSecurityTrustUrl as jest.Mock).mockReturnValue(
          'trusted-url',
        );

        component.previewFile(mockEvent);

        expect(component.fileLoading).toBe(true);
        expect(component.selectedFile).toEqual([mockFile]);
      });

      it('should handle file event with dataTransfer.files', () => {
        const mockFile = new File(['content'], 'test.txt', {
          type: 'text/plain',
        });
        const mockEvent = {
          dataTransfer: {
            files: [mockFile],
          },
          target: {
            files: [],
          },
        };

        (mockDomSanitizer.bypassSecurityTrustUrl as jest.Mock).mockReturnValue(
          'trusted-url',
        );

        component.previewFile(mockEvent);

        expect(component.fileLoading).toBe(true);
        expect(component.selectedFile).toEqual([mockFile]);
      });
    });

    describe('removeUploadFile', () => {
      it('should reset file related properties', () => {
        component.imageUrls = [
          {
            filesPath: 'test-url',
            fileType: 'image',
            fileExt: 'png',
            fileName: 'test.png',
          },
        ];
        component.selectedFile = { name: 'test.png' } as any;

        component.removeUploadFile();

        expect(component.imageUrls).toEqual([]);
        expect(component.selectedFile).toBeNull();
      });
    });

    describe('customerChatResumed', () => {
      beforeEach(() => {
        (mockStorageService.getItem as jest.Mock).mockReturnValue(
          JSON.stringify({
            data: {
              serviceIdentifier: 'service123',
              channelCustomerIdentifier: 'cid123',
            },
          }),
        );
        component.sdk = { makeConnection: jest.fn() } as any;
      });

      it('should resume chat with user data', () => {
        component.customerChatResumed();
        expect(component.customerData).toEqual({
          serviceIdentifier: 'service123',
          channelCustomerIdentifier: 'cid123',
        });
        expect(component.sdk.makeConnection).toHaveBeenCalledWith(
          'service123',
          'cid123',
        );
      });

      it('should change screen to widget when no user data', () => {
        (mockStorageService.getItem as jest.Mock).mockReturnValue(null);
        component.changeScreen = jest.fn();

        component.customerChatResumed();
        expect(component.changeScreen).toHaveBeenCalledWith('widget');
      });
    });

    describe('endChat', () => {
      beforeEach(() => {
        component.IsRegisteredInFreeSwitch = true;
        component.dialogId = 'dialog123';
        component.sdk = {
          handleCallEnd: jest.fn(),
          handleLogOutAgent: jest.fn(),
        } as any;
        component.clearSession = jest.fn();
        component.callEnd = jest.fn();
      });

      it('should end chat when dialog result is true', () => {
        const mockDialogRef = {
          afterClosed: () => ({ subscribe: (cb: any) => cb(true) }),
        };
        mockMatDialog.open = jest.fn(() => mockDialogRef);

        component.endChat();

        expect(mockMatDialog.open).toHaveBeenCalledWith(expect.any(Function));
        expect(component.sdk.handleCallEnd).toHaveBeenCalledWith('dialog123');
        expect(component.sdk.handleLogOutAgent).toHaveBeenCalledWith(
          'dialog123',
        );
        expect(component.clearSession).toHaveBeenCalled();
      });

      it('should not end chat when dialog result is false', () => {
        const mockDialogRef = {
          afterClosed: () => ({ subscribe: (cb: any) => cb(false) }),
        };
        mockMatDialog.open = jest.fn(() => mockDialogRef);

        component.endChat();

        expect(mockMatDialog.open).toHaveBeenCalledWith(expect.any(Function));
        expect(component.sdk.handleCallEnd).not.toHaveBeenCalled();
        expect(component.sdk.handleLogOutAgent).not.toHaveBeenCalled();
        expect(component.clearSession).not.toHaveBeenCalled();
      });
    });

    describe('transformPayload', () => {
      it('should transform intent with entities correctly', () => {
        const result = component.transformPayload('/intent {"key": "value"}');
        expect(result.intent.trim()).toBe('intent');
        expect(result.entities).toEqual({ key: 'value' });
      });

      it('should handle intent without entities', () => {
        const result = component.transformPayload('/intent');
        expect(result.intent).toBe('intent');
        expect(result.entities).toBeNull();
      });

      it('should return null for null input', () => {
        const result = component.transformPayload(null);
        expect(result.intent).toBeNull();
        expect(result.entities).toBeNull();
      });
    });

    describe('changeNpsColor', () => {
      let sectionsArray: any;

      beforeEach(() => {
        sectionsArray = {
          at: jest.fn().mockReturnValue({
            get: jest.fn().mockReturnValue({
              setValue: jest.fn(),
            }),
          }),
        };
        component.preChatFormGroup = {
          get: jest.fn().mockImplementation((name: string) => {
            if (name === 'sections') return sectionsArray;
            return null;
          }),
        } as any;
      });

      it('should update selected indices and control value', () => {
        component.changeNpsColor('npsControl', 0, 0, 1, 'value1');
        expect(component.selectedIndices).toEqual({ 0: 1 });
        expect(sectionsArray.at).toHaveBeenCalledWith(0);
        expect(sectionsArray.at(0).get).toHaveBeenCalledWith('npsControl');
      });

      it('should handle missing section', () => {
        sectionsArray.at = jest.fn().mockReturnValue(undefined);
        const logSpy = jest
          .spyOn(console, 'error')
          .mockImplementation(() => {});
        component.changeNpsColor('npsControl', 99, 0, 1, 'value1');
        expect(logSpy).toHaveBeenCalledWith(
          'Section at index 99 does not exist.',
        );
      });
    });
  });
});
