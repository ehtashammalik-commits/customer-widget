
import { SdkService } from '../services/sdk.service';
import { WidgetComponent } from './widget.component';

// ---------- Common mocks ----------


const mockSdkService: Partial<SdkService> = {
  handleCallStart: jest.fn(),
  makeConnection: jest.fn(),
  authenticateKey: jest.fn(),
};

const mockAppConfigService = {
  appConfig: { ENABLE_LOGO: false, ADDITIONAL_PANEL: false, USERNAME_ENABLED: true },
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
      {} as any  // Document
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
        (component as any).__postMessageHandlerService = { browserInfoData$: mockBrowserInfoData$ };
        jest.spyOn(component as any, 'setFontFromLocalStorage').mockImplementation(() => {});
        jest.spyOn(component as any, 'createFormValidationControls').mockImplementation(() => {});

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
        'Error: Please check with Administrator. Widget identifier is missing!!!'
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
        'Error: Please check with Administrator. Service identifier is missing!!!'
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
        'Error: Please check with Administrator. Widget identifier is missing!!!'
      );
    });

    it('should call alert if channelCustomerIdentifier is missing and CHANNEL_IDENTIFIER is set', () => {
      global.alert = jest.fn();
      component.__appConfig = { appConfig: { CHANNEL_IDENTIFIER: 'channel_customer_identifier' } } as any;
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
        "Warning: 'channelCustomerIdentifier' parameter is missing in the url, Required for Customer Identification!!!"
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

      component.webRTCConfig = { customerName: 'Initial Name', customerNumber: 'Initial Number' };

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
      expect(mockStorageService.removeItem).toHaveBeenCalledWith('user', component.storageType);
      expect(component.isChatActive).toBe(false);
      expect(mockComposerDisable).toHaveBeenCalled();
    });

    it('should handle SOCKET_RECONNECTED', () => {
      const event = { id: 1, type: 'SOCKET_RECONNECTED', data: { serviceIdentifier: 's', channelCustomerIdentifier: 'c' } };
      component.customerData = {};
      component.eventListener(event);
      expect(mockSdk.onChatResumed).toHaveBeenCalledWith('s', 'c');
      expect(mockChangeScreen).toHaveBeenCalledWith('chat');
    });

    it('should handle SOCKET_CONNECTED with eventTriggerType "startChat"', () => {
      component.eventTriggerType = 'startChat';
      component.customerData = { foo: 'bar' };
      component.enabledWebhook = true;
      component.webhookUrl = 'url';
      const event = { id: 1, type: 'SOCKET_CONNECTED', data: {} };
      component.eventListener(event);
      expect(mockSdk.sendChatRequest).toHaveBeenCalledWith({ type: 'CHAT_REQUESTED', data: component.customerData });
      expect(mockSdk.sendWebhookNotification).toHaveBeenCalledWith('url', { type: 'CHAT_REQUESTED', data: component.customerData });
      expect(mockChangeScreen).toHaveBeenCalledWith('chat');
    });

    it('should handle SOCKET_CONNECTED with eventTriggerType ""', () => {
      component.eventTriggerType = '';
      component.customerData = { serviceIdentifier: 's', channelCustomerIdentifier: 'c' };
      component.eventListener({ id: 1, type: 'SOCKET_CONNECTED', data: {} });
      expect(mockSdk.onChatResumed).toHaveBeenCalledWith('s', 'c');
      expect(mockChangeScreen).toHaveBeenCalledWith('chat');
    });

    it('should handle CONVERSATION_RESUMED', () => {
      const event = { id: 1, type: 'CONVERSATION_RESUMED', data: { history: [{ header: { conversationId: 'cid' } }] } };
      component.eventListener(event);
      expect(component.isChatActive).toBe(true);
      expect(component.preChatFormLoader).toBe(false);
      expect(component.conversationId).toBe('cid');
      expect(mockStorageService.setItem).toHaveBeenCalledWith('conversationId', 'cid', component.storageType);
      expect(mockHandleResumedMessages).toHaveBeenCalledWith(event.data.history);
      expect(mockScrollToBottom).toHaveBeenCalled();
      expect(mockChangeScreen).toHaveBeenCalledWith('chat');
    });

    it('should handle CHANNEL_SESSION_STARTED', () => {
      const event = { id: 1, type: 'CHANNEL_SESSION_STARTED', data: { header: { conversationId: 'cid', customer: { _id: 'custid' } } } };
      component.customerData = { channelCustomerIdentifier: 'c', serviceIdentifier: 's' };
      component.preChatFormData = {};
      component.getFormDataAsConversationData = jest.fn();
      component.eventListener(event);
      expect(component.isChatActive).toBe(true);
      expect(component.isComposerDisable).toBe(false);
      expect(component.preChatFormLoader).toBe(false);
      expect(component.conversationId).toBe('cid');
      expect(component.customerId).toBe('custid');
      expect(mockStorageService.setItem).toHaveBeenCalledWith('conversationId', 'cid', component.storageType);
      expect(mockSdk.setConversationDataAgainstCustomerIdentifier).toHaveBeenCalled();
      expect(mockPushPrechatDataAsActivity).toHaveBeenCalled();
    });

    it('should handle MESSAGE_RECEIVED', () => {
      const event = { id: 1, type: 'MESSAGE_RECEIVED', data: { foo: 'bar' } };
      component.eventListener(event);
      expect(mockHandleCimMessage).toHaveBeenCalledWith(event.data);
    });

    it('should handle SOCKET_DISCONNECTED when messageType is not survey', () => {
      component.cimMessage = [{ body: { subType: 'plain' } }];
      component.eventListener({ id: 1, type: 'SOCKET_DISCONNECTED', data: {} });
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
      component.eventListener({ id: 1, type: 'ERRORS', data: { task: 'CHAT_REQUESTED', code: 408 } });
      expect(mockAlert).toHaveBeenCalledWith('Unable to connect with end server');
    });

    it('should handle ERRORS with code 400', () => {
      component.eventListener({ id: 1, type: 'ERRORS', data: { task: 'CHAT_REQUESTED', code: 400 } });
      expect(mockAlert).toHaveBeenCalledWith('data is invalid');
    });

    it('should handle ERRORS with code 500', () => {
      component.eventListener({ id: 1, type: 'ERRORS', data: { task: 'CHAT_REQUESTED', code: 500 } });
      expect(mockAlert).toHaveBeenCalledWith('Internal error with end server');
    });

    it('should handle ERRORS with other code', () => {
      component.eventListener({ id: 1, type: 'ERRORS', data: { task: 'CHAT_REQUESTED', code: 999 } });
      expect(mockAlert).toHaveBeenCalledWith('Unable to send request');
    });

    it('should not throw on error', () => {
      component.cimMessage = null as any;
      expect(() => component.eventListener({ id: 1, type: 'MESSAGE_RECEIVED', data: {} })).not.toThrow();
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
      const cimMessage = { body: { type: 'deliverynotification', messageId: 'id1', status: 'SENT' }, header: { sender: { type: 'agent' } } };
      component.handleCimMessage(cimMessage);
      expect(component.updateStatusOfCustomerMessage).toHaveBeenCalledWith('id1', 'sent');
    });

    it('should start typing indicator timer for typing_started notification from agent', () => {
      const cimMessage = { body: { type: 'notification', notificationType: 'typing_started' }, header: { sender: { type: 'agent' } } };
      component.handleCimMessage(cimMessage);
      expect(component.typingIndicatorTimer).not.toBeNull();
      jest.advanceTimersByTime(5000);
      expect(component.typingIndicatorTimer).toBeNull();
    });

    it('should restart typing indicator timer if already running', () => {
      const cimMessage = { body: { type: 'notification', notificationType: 'typing_started' }, header: { sender: { type: 'agent' } } };
      component.typingIndicatorTimer = setTimeout(() => {}, 5000);
      component.handleCimMessage(cimMessage);
      jest.advanceTimersByTime(5000);
      expect(component.typingIndicatorTimer).toBeNull();
    });

    it('should call editMessage and handleMessageReport for plain message with intent update', () => {
      const cimMessage = { body: { type: 'plain', markdownText: 'text' }, header: { sender: { type: 'agent' }, intent: 'update' } };
      component.handleCimMessage(cimMessage);
      expect(component.editMessage).toHaveBeenCalledWith(cimMessage);
      expect(component.handleMessageReport).toHaveBeenCalledWith(cimMessage);
    });

    it('should push message, notify, scroll and report for plain message without intent update', () => {
      const cimMessage = { body: { type: 'plain', markdownText: 'text' }, header: { sender: { type: 'agent' } } };
      component.handleCimMessage(cimMessage);
      expect(component.cimMessage).toContain(cimMessage);
      expect(mockBrowserNotificationService.notify).toHaveBeenCalledWith(cimMessage);
      expect(component.scrollToBottom).toHaveBeenCalled();
      expect(component.handleMessageReport).toHaveBeenCalledWith(cimMessage);
    });

    it('should clear typing indicator for non-notification type from agent', () => {
      component.typingIndicatorTimer = 123 as any;
      const cimMessage = { body: { type: 'plain', markdownText: 'text' }, header: { sender: { type: 'agent' } } };
      component.handleCimMessage(cimMessage);
      expect(component.typingIndicatorTimer).toBeDefined();
    });

    it('should update agent username in notification if isUsernameEnabled is false', () => {
      const cimMessage = {
        body: { type: 'notification', notificationType: '', notificationData: { data: { agentParticipant: { participant: { keycloakUser: { username: 'old' } } } } } },
        header: { sender: { type: 'agent', additionalDetail: {} } },
      };
      component.handleCimMessage(cimMessage);
      expect(cimMessage.body.notificationData.data.agentParticipant.participant.keycloakUser.username).toBe('Agent Name');
    });

    it('should update conversation participant username in notification if isUsernameEnabled is false', () => {
      const cimMessage = {
        body: { type: 'notification', notificationType: '', notificationData: { data: { conversationParticipant: { participant: { keycloakUser: { username: 'old' } } } } } },
        header: { sender: { type: 'agent', additionalDetail: {} } },
      };
      component.handleCimMessage(cimMessage);
      expect(cimMessage.body.notificationData.data.conversationParticipant.participant.keycloakUser.username).toBe('Agent Name');
    });

    it('should update senderName if isUsernameEnabled is false', () => {
      const cimMessage = { body: { type: 'other' }, header: { sender: { type: 'agent', additionalDetail: {}, senderName: 'old' } } };
      component.handleCimMessage(cimMessage);
      expect(cimMessage.header.sender.senderName).toBe('Agent Name');
    });

    it('should call editMessage and handleMessageReport for non-plain message with intent update', () => {
      const cimMessage = { body: { type: 'other' }, header: { sender: { type: 'agent' }, intent: 'update' } };
      component.handleCimMessage(cimMessage);
      expect(component.editMessage).toHaveBeenCalledWith(cimMessage);
      expect(component.handleMessageReport).toHaveBeenCalledWith(cimMessage);
    });

    it('should push message, notify, scroll and report for non-plain message without intent update', () => {
      const cimMessage = { body: { type: 'other' }, header: { sender: { type: 'agent' } } };
      component.handleCimMessage(cimMessage);
      expect(component.cimMessage).toContain(cimMessage);
      expect(mockBrowserNotificationService.notify).toHaveBeenCalledWith(cimMessage);
      expect(component.scrollToBottom).toHaveBeenCalled();
      expect(component.handleMessageReport).toHaveBeenCalledWith(cimMessage);
    });
  });

  // ---------- handleDialogStates ----------
  describe('handleDialogStates', () => {
    it('should open snackbar when reasonCode is NO_ANSWER', () => {
      const snackSpy = jest.spyOn(component['snackBar'], 'open');
      component.handleDialogStates({ reasonCode: 'NO_ANSWER' });
      expect(snackSpy).toHaveBeenCalledWith('Call is not picked up', 'X', expect.any(Object));
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
    const spyStart = jest.spyOn(component as any, 'startCountdown').mockImplementation(() => {});

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
      expect(component.showAuthenticationResponseMessage).toContain('Authentication failed');
      expect(snackSpy).toHaveBeenCalled();
    });
 });

 // ---------- changeScreen ----------
  describe('changeScreen', () => {
    it('should set widget screen correctly when screen=widget', () => {
      jest.spyOn(component['storageService'], 'getItem').mockReturnValue('true');
      const spyResize = jest.spyOn(component, 'resizeWidget').mockImplementation();
      component.changeScreen('widget');
      expect(component.isIconWidget).toBe(true);
      expect(spyResize).toHaveBeenCalledWith('icon-view');
    });

    it('should set chat screen correctly when screen=chat', () => {
      const spyResize = jest.spyOn(component, 'resizeWidget').mockImplementation();
      const spyChange = jest.spyOn(component, 'changeView').mockImplementation();
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
      const spyInit = jest.spyOn(component, 'initiateWebRtcCall').mockImplementation();
      const spyLogin = jest.spyOn(component, 'logInToFreeSwitch').mockImplementation();
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
      const spyInit = jest.spyOn(component, 'initiateWebRtcCall').mockImplementation();
      component.isWebRtcVideoCallActive = false;
      component.showInvalidCodeError = false;
      component.changeView('standaloneVideo');
      expect(spyInit).toHaveBeenCalledWith('video');
    });

    it('should initiate secureWebVideoCall when not already secure', () => {
      const spyInit = jest.spyOn(component, 'initiateWebRtcCall').mockImplementation();
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
      spyHandleRefresh = jest.spyOn(component, 'handleRefreshCaseForWebRTC').mockImplementation(() => {});
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

  describe('WidgetComponent - Secure Link Handling', () => {

    beforeEach(() => {
      jest.spyOn(component, 'logInToFreeSwitch').mockImplementation(() => {});

      // mock the webRTCConfig before tests run
        component.webRTCConfig = {
        diallingUri: 'wss://mock.dial.uri',
        stunServers: ['stun:stun.l.google.com:19302'], // add whatever else is expected in your code
        turnServers: [],
        turnUsername: 'testUser',
        turnCredential: 'testPass'
      };
    });

    it('should extract encryptedKey and call authenticateSecureLinkKey when widgetIdentifier matches', () => {
      component.widgetIdentifier = 'widget123'; // ensure match

      const fakeMessage = {
        body: {
          mediaUrl: 'https://test.com?encryptedKey=abc123&widgetIdentifier=widget123'
        }
      };

      const spyAuth = jest.spyOn(component, 'authenticateSecureLinkKey').mockImplementation();

      component.processSecureLinkMessage(fakeMessage);

      expect(component.webRtcSecureLink).toBe('abc123');
      expect(spyAuth).toHaveBeenCalledWith(true);
    });

    it('should show snackbar when widgetIdentifier mismatches', () => {
      component.widgetIdentifier = 'widget123';

      const fakeMessage = {
        body: {
          mediaUrl: 'https://test.com?encryptedKey=abc123&widgetIdentifier=wrongWidget'
        }
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
        body: { mediaUrl: 'https://test.com?widgetIdentifier=widget123' }
      };

      const spyAuth = jest.spyOn(component, 'authenticateSecureLinkKey').mockImplementation();

      component.processSecureLinkMessage(fakeMessage);

      expect(component.webRtcSecureLink).toBe('');
      expect(spyAuth).toHaveBeenCalledWith(true);
    });

    it('should handle error response and set expired link flags', async () => {
      (mockSdkService.authenticateKey as jest.Mock).mockImplementation((payload, cb) => {
        cb({ error: true, data: { message: 'Expired' }, message: 'Link expired' });
      });

      await component.authenticateSecureLinkKey(true);

      expect(component.isSecureLinkExpired).toBe(true);
      expect(component.showInvalidCodeError).toBe(true);
      expect(component.showAuthenticationResponseMessage).toBe('The link has expired');
    });

    it('should handle successful response and login to FreeSwitch', async () => {
      component.webRTCConfig = { diallingUri: 'test-uri' } as any;
      const res = { error: false, data: { agentName: 'Agent007' }, message: 'Authenticated' };
      (mockSdkService.authenticateKey as jest.Mock).mockImplementation((payload, cb) => cb(res));

      await component.authenticateSecureLinkKey(true);

      expect(component.agentName).toBe('Agent007');
      expect(component.setAuthorizedResponse).toMatchObject(res.data);
      expect(component.showAuthenticationResponseMessage).toBe('Authenticated');
      expect(component.logInToFreeSwitch).toHaveBeenCalled();
    });

    it('should set standaloneWebRtc when not authenticated and authorized response exists', async () => {
      const res = { error: false, data: { agentName: 'Agent007' }, message: 'Authenticated' };
      (mockSdkService.authenticateKey as jest.Mock).mockImplementation((payload, cb) => cb(res));

      await component.authenticateSecureLinkKey(false);

      expect(component.standaloneWebRtc).toBe(true);
    });
  })
});
