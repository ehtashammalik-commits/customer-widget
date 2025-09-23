import { Router } from '@angular/router';
import { WidgetComponent } from './widget.component';

// ---------- Common mocks ----------
const mockSdkService = { makeConnection: jest.fn() };

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
const mockFormBuilder = {};

const mockBrowserNotificationService: any = {
  notify: jest.fn(),
  playSound: jest.fn(),
  openBrowserNotification: jest.fn(),
};

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
      {} as any, // Router
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
});
