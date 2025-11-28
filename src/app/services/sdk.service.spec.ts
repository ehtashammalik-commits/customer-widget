// src/app/services/sdk.service.spec.ts
import { SdkService } from './sdk.service';
import { ConfigService } from '../services/config.service';
import { firstValueFrom } from 'rxjs';

type AnyFn = jest.Mock<any, any>;

describe('SdkService', () => {
  let service: SdkService;
  let mockConfig: Partial<ConfigService>;

  // global SDK functions (we'll create mocks for them)
  let widgetConfigsMock: AnyFn;
  let getPreChatFormMock: AnyFn;
  let formValidationMock: AnyFn;
  let establishConnectionMock: AnyFn;
  let getCalendarIdMock: AnyFn;
  let getCalendarEventsMock: AnyFn;
  let postMessagesMock: AnyFn;
  let pushFormDataAsActivityMock: AnyFn;
  let chatRequestMock: AnyFn;
  let sendChatMessageMock: AnyFn;
  let uploadToFileEngineMock: AnyFn;
  let chatEndMock: AnyFn;
  let resumeChatMock: AnyFn;
  let webhookNotificationsMock: AnyFn;
  let callbackRequestMock: AnyFn;
  let authenticateRequestMock: AnyFn;
  let getBrowserInfoMock: AnyFn;
  let getFileURLMock: AnyFn;

  beforeEach(() => {
    // create fresh jest mocks for every global
    widgetConfigsMock = jest.fn();
    getPreChatFormMock = jest.fn();
    formValidationMock = jest.fn();
    establishConnectionMock = jest.fn();
    getCalendarIdMock = jest.fn();
    getCalendarEventsMock = jest.fn();
    postMessagesMock = jest.fn();
    pushFormDataAsActivityMock = jest.fn();
    chatRequestMock = jest.fn();
    sendChatMessageMock = jest.fn();
    uploadToFileEngineMock = jest.fn();
    chatEndMock = jest.fn();
    resumeChatMock = jest.fn();
    webhookNotificationsMock = jest.fn();
    callbackRequestMock = jest.fn();
    authenticateRequestMock = jest.fn();
    getBrowserInfoMock = jest.fn();
    getFileURLMock = jest.fn();

    // Attach to global scope with same names the service expects
    // NOTE: intentionally NOT attaching widgetConfigs here to make sdkLoaded=false by default.
    (global as any).getPreChatForm = getPreChatFormMock;
    (global as any).formValidation = formValidationMock;
    (global as any).establishConnection = establishConnectionMock;
    (global as any).getCalendarId = getCalendarIdMock;
    (global as any).getCalendarEvents = getCalendarEventsMock;
    (global as any).postMessages = postMessagesMock;
    (global as any).pushFormDataAsActivity = pushFormDataAsActivityMock;
    (global as any).chatRequest = chatRequestMock;
    (global as any).sendChatMessage = sendChatMessageMock;
    (global as any).uploadToFileEngine = uploadToFileEngineMock;
    (global as any).chatEnd = chatEndMock;
    (global as any).resumeChat = resumeChatMock;
    (global as any).webhookNotifications = webhookNotificationsMock;
    (global as any).callbackRequest = callbackRequestMock;
    (global as any).authenticateRequest = authenticateRequestMock;
    (global as any).getBrowserInfo = getBrowserInfoMock;
    (global as any).getFileURL = getFileURLMock;

    // Minimal mock config service expected by SdkService
    mockConfig = {
      appConfig: {
        CCM_URL: 'https://test-ccm',
        SOCKET_URL: 'wss://socket',
        BUSINESSCALENDAR_URL: 'https://calendar',
        FORM_URL: 'https://forms',
        CX_ACTIVITY: 'https://cx-activity',
        FILE_SERVER_URL: 'https://file-server',
        AUTHENTICATOR_URL: 'https://auth',
      },
    };

    // Instantiate service AFTER attaching globals (except widgetConfigs which we'll install per-test)
    service = new SdkService(mockConfig as ConfigService);
  });

  afterEach(() => {
    jest.resetAllMocks();
    // clean up globals
    delete (global as any).widgetConfigs;
    delete (global as any).getPreChatForm;
    delete (global as any).formValidation;
    delete (global as any).establishConnection;
    delete (global as any).getCalendarId;
    delete (global as any).getCalendarEvents;
    delete (global as any).postMessages;
    delete (global as any).pushFormDataAsActivity;
    delete (global as any).chatRequest;
    delete (global as any).sendChatMessage;
    delete (global as any).uploadToFileEngine;
    delete (global as any).chatEnd;
    delete (global as any).resumeChat;
    delete (global as any).webhookNotifications;
    delete (global as any).callbackRequest;
    delete (global as any).authenticateRequest;
    delete (global as any).getBrowserInfo;
    delete (global as any).getFileURL;
  });

  it('should initialize subjects and service instance', () => {
    expect(service).toBeTruthy();
    expect((service as any).widgetConfigs$).toBeDefined();
    expect((service as any).renderPreChatForm$).toBeDefined();
  });

  describe('loadSdk', () => {
    it('resolves when widgetConfigs is defined (sdkLoaded true)', async () => {
      // attach widgetConfigs BEFORE instantiating a fresh service to simulate global SDK present
      (global as any).widgetConfigs = widgetConfigsMock;
      const svc = new SdkService(mockConfig as ConfigService); // fresh instance to pick up global
      await svc.loadSdk();
      expect((svc as any).sdkLoaded).toBe(true);
    });

    it('resolves when widgetConfigs undefined (no error) and sdkLoaded remains false', async () => {
      // ensure widgetConfigs is not present for this instance
      delete (global as any).widgetConfigs;
      // service was already created without widgetConfigs in beforeEach, ensure the flag is false
      (service as any).sdkLoaded = false;
      const res = await service.loadSdk();
      expect(res).toBeUndefined();
      expect((service as any).sdkLoaded).toBe(false);
    });
  });

  describe('receiveUrlParamsValue & loadWidget', () => {
    it('should set identifiers and call widgetConfigs', () => {
      const fakeRes = { foo: 'bar' };
      // make widgetConfigs call the callback with fakeRes
      widgetConfigsMock.mockImplementation((_ccm, _wid, cb) => cb(fakeRes));
      (global as any).widgetConfigs = widgetConfigsMock; // attach for this test

      jest.spyOn((service as any).widgetConfigsSubject, 'next');

      service.receiveUrlParamsValue('wid', 'sid');

      expect((service as any).widgetIdentifier).toBe('wid');
      expect((service as any).serviceIdentifier).toBe('sid');
      expect(widgetConfigsMock).toHaveBeenCalledWith(
        mockConfig!.appConfig.CCM_URL,
        'wid',
        expect.any(Function),
      );
    });

    it('widgetConfigs next value is emitted on widgetConfigs$', (done) => {
      const fakeRes = { hello: 'world' };
      widgetConfigsMock.mockImplementation((_ccm, _wid, cb) => cb(fakeRes));
      (global as any).widgetConfigs = widgetConfigsMock;

      service.widgetConfigs$.subscribe((val) => {
        expect(val).toEqual(fakeRes);
        done();
      });

      service.receiveUrlParamsValue('wid', 'sid');
    });
  });

  describe('fetchBusinessCalendarId', () => {
    it('resolves with calendarId when getCalendarId returns', async () => {
      getCalendarIdMock.mockImplementation((_url, _sid, cb) =>
        cb({ calendarId: 'cal-123' }),
      );
      const id = await service.fetchBusinessCalendarId();
      expect(id).toBe('cal-123');
      expect(getCalendarIdMock).toHaveBeenCalled();
    });

    it('rejects when getCalendarId returns invalid response', async () => {
      getCalendarIdMock.mockImplementation((_url, _sid, cb) => cb({}));
      await expect(service.fetchBusinessCalendarId()).rejects.toThrow(
        'Failed to fetch calendar ID.',
      );
    });
  });

  describe('getCalendarEvents', () => {
    it('resolves when getCalendarEvents returns response', async () => {
      getCalendarEventsMock.mockImplementation((_cid, _url, _s, _e, cb) =>
        cb({ events: [1, 2, 3] }),
      );
      const res = await service.getCalendarEvents('cid-1');
      expect(res).toEqual({ events: [1, 2, 3] });
      expect(getCalendarEventsMock).toHaveBeenCalled();
    });

    it('rejects when getCalendarEvents returns falsy', async () => {
      getCalendarEventsMock.mockImplementation((_cid, _url, _s, _e, cb) =>
        cb(null),
      );
      await expect(service.getCalendarEvents('cid-1')).rejects.toThrow(
        'Failed to fetch calendar events.',
      );
    });
  });

  describe('renderPreChatForm / getFormValidation / renderCallbackForm', () => {
    it('renderPreChatForm forwards result to renderPreChatForm$', async () => {
      const fakeForm = { f: 'x' };
      getPreChatFormMock.mockImplementation((_url, _id, cb) => cb(fakeForm));
      const emitPromise = firstValueFrom(service.renderPreChatForm$);
      service.renderPreChatForm('form-id');
      await expect(emitPromise).resolves.toEqual(fakeForm);
      expect(getPreChatFormMock).toHaveBeenCalledWith(
        mockConfig!.appConfig.FORM_URL,
        'form-id',
        expect.any(Function),
      );
    });

    it('getFormValidation pushes to validation subject and calls callback', async () => {
      formValidationMock.mockImplementation((_url, cb) => cb({ ok: true }));
      const cb = jest.fn();
      const emitPromise = firstValueFrom(service.validationsSubcription);
      service.getFormValidation(cb);
      await expect(emitPromise).resolves.toEqual({ ok: true });
      expect(cb).toHaveBeenCalled();
      expect(formValidationMock).toHaveBeenCalledWith(
        mockConfig!.appConfig.FORM_URL,
        expect.any(Function),
      );
    });

    it('renderCallbackForm forwards to renderCallbackForm$', async () => {
      const fakeForm = { cb: true };
      getPreChatFormMock.mockImplementation((_url, _id, cb) => cb(fakeForm));
      const emitPromise = firstValueFrom(service.renderCallbackForm$);
      service.renderCallbackForm('x');
      await expect(emitPromise).resolves.toEqual(fakeForm);
    });
  });

  describe('makeConnection', () => {
    it('does not call establishConnection when sdkLoaded is false', () => {
      (service as any).sdkLoaded = false;
      const spyError = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      service.makeConnection('svc', 'cid');
      expect(establishConnectionMock).not.toHaveBeenCalled();
      expect(spyError).toHaveBeenCalledWith('SDK script is not loaded yet');
      spyError.mockRestore();
    });

    it('calls establishConnection when sdkLoaded true and forwards response', (done) => {
      (service as any).sdkLoaded = true;
      establishConnectionMock.mockImplementation((_socket, _sid, _cid, cb) =>
        cb({ connected: true }),
      );

      service.connectionResponse$.subscribe((val) => {
        expect(val).toEqual({ connected: true });
        done();
      });

      service.makeConnection('svc', 'cid');
      expect(establishConnectionMock).toHaveBeenCalledWith(
        mockConfig!.appConfig.SOCKET_URL,
        'svc',
        'cid',
        expect.any(Function),
      );
    });
  });

  describe('setConversationDataAgainstCustomerIdentifier / postFormDataAsActivity / onChatResumed / sendChatRequest', () => {
    it('postFormDataAsActivity calls pushFormDataAsActivity', () => {
      service.postFormDataAsActivity({ my: 'data' });
      expect(pushFormDataAsActivityMock).toHaveBeenCalledWith(
        mockConfig!.appConfig.CX_ACTIVITY,
        { my: 'data' },
        expect.any(Function),
      );
    });

    it('sendChatRequest calls chatRequest', () => {
      const payload = { type: 'CHAT_REQUESTED' };
      service.sendChatRequest(payload);
      expect(chatRequestMock).toHaveBeenCalledWith(payload);
    });
  });

  describe('createStandardFormObj and sendWebhookNotification', () => {
    it('createStandardFormObj converts attributes list into object', () => {
      const attrs = [
        { key: 'name', value: 'bob' },
        { key: 'phone', value: '123' },
        { key: '', value: 'x' },
      ];
      const out = service.createStandardFormObj(attrs as any);
      expect(out).toEqual({ name: 'bob', phone: '123' });
    });

    it('sendWebhookNotification should call webhookNotifications with expected args', () => {
      const fakePayload = {
        data: { formData: { attributes: [{ key: 'name', value: 'bob' }] } },
      };
      service.sendWebhookNotification('https://webhook', fakePayload);
      expect(webhookNotificationsMock).toHaveBeenCalledWith(
        'https://webhook',
        expect.any(Object),
        { name: 'bob' },
      );
    });
  });

  describe('fetchBrowserData & sendCallbackRequest', () => {
    it('fetchBrowserData calls getBrowserInfo and returns via callback', (done) => {
      getBrowserInfoMock.mockImplementation((_apiKey, cb) => cb({ ua: 'x' }));
      service.fetchBrowserData('api-key', (res: any) => {
        expect(res).toEqual({ ua: 'x' });
        done();
      });
    });

    it('sendCallbackRequest constructs payload and calls callbackRequest and onCallbackRequestResponse$', (done) => {
      const configs = {
        campaignId: 'camp',
        allowDuplicate: true,
        callbackUrl: 'https://cb',
      };
      const formData = [
        { key: 'phone', value: '999' },
        { key: 'name', value: 'n' },
      ];
      callbackRequestMock.mockImplementation((_url, _payload, cb) =>
        cb({ ok: true }),
      );
      service.onCallbackRequestResponse$.subscribe((val) => {
        expect(val).toEqual({ ok: true });
        done();
      });
      service.sendCallbackRequest(configs, formData as any);
      expect(callbackRequestMock).toHaveBeenCalledWith(
        configs.callbackUrl,
        expect.any(Object),
        expect.any(Function),
      );
    });
  });

  describe('getCurrentDate', () => {
    it('returns a yyyy-mm-dd formatted string', () => {
      const d = service.getCurrentDate();
      expect(d).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('sendChatMessage / moveToFileServer / authenticateKey / handleChatEnd', () => {
    it('sendChatMessage calls global sendChatMessage', () => {
      const payload = { foo: 'bar' };
      service.sendChatMessage(payload);
      expect(sendChatMessageMock).toHaveBeenCalledWith(payload);
    });

    it('moveToFileServer calls uploadToFileEngine and returns via callback', (done) => {
      uploadToFileEngineMock.mockImplementation((_url, _filePayload, cb) =>
        cb({ type: 'ok', name: 'f', size: 10 }),
      );
      service.moveToFileServer({ file: 'x' } as any, (res: any) => {
        expect(res).toEqual({ type: 'ok', name: 'f', size: 10 });
        done();
      });
      expect(uploadToFileEngineMock).toHaveBeenCalledWith(
        mockConfig!.appConfig.FILE_SERVER_URL,
        { file: 'x' },
        expect.any(Function),
      );
    });

    it('authenticateKey delegates to authenticateRequest', (done) => {
      authenticateRequestMock.mockImplementation((_url, _payload, cb) =>
        cb({ ok: true }),
      );
      service.authenticateKey({ roomId: 'r' }, (res: any) => {
        expect(res).toEqual({ ok: true });
        done();
      });
      expect(authenticateRequestMock).toHaveBeenCalledWith(
        mockConfig!.appConfig.AUTHENTICATOR_URL,
        { roomId: 'r' },
        expect.any(Function),
      );
    });

    it('handleChatEnd calls global chatEnd', () => {
      const payload = { c: 1 };
      service.handleChatEnd(payload);
      expect(chatEndMock).toHaveBeenCalledWith(payload);
    });
  });

  describe('webRTC postMessages wrappers', () => {
    it('loginSipWebRtc posts login action and triggers onWebRtcCallSubject', () => {
      const webRtc = { sipExtension: '101', extensionPassword: 'pw' };
      postMessagesMock.mockImplementation((payload: any) => {
        payload.parameter.clientCallbackFunction({ ok: true });
      });
      (global as any).postMessages = postMessagesMock;
      const spy = jest.fn();
      service.onWebRtcCallResponse$.subscribe(spy);
      service.loginSipWebRtc(webRtc);
      expect(postMessagesMock).toHaveBeenCalled();
      expect(spy).toHaveBeenCalledWith({ ok: true });
    });

    it('handleCallStart posts makeCall with diallingUri', () => {
      const callPayload = {
        type: 'video',
        authConfigs: { diallingUri: 'sip:123' },
      };
      postMessagesMock.mockImplementation((payload: any) =>
        payload.parameter.clientCallbackFunction({ started: true }),
      );
      (global as any).postMessages = postMessagesMock;
      const spy = jest.fn();
      service.onWebRtcCallResponse$.subscribe(spy);
      service.handleCallStart(callPayload);
      expect(postMessagesMock).toHaveBeenCalled();
      expect(spy).toHaveBeenCalledWith({ started: true });
    });

    it('handleCallEnd posts releaseCall', () => {
      postMessagesMock.mockImplementation((payload: any) =>
        payload.parameter.clientCallbackFunction({ ended: true }),
      );
      (global as any).postMessages = postMessagesMock;
      const spy = jest.fn();
      service.onWebRtcCallResponse$.subscribe(spy);
      service.handleCallEnd('dialog-1');
      expect(postMessagesMock).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'releaseCall' }),
      );
      expect(spy).toHaveBeenCalledWith({ ended: true });
    });

    it('handleLogOutAgent posts logout action', () => {
      postMessagesMock.mockImplementation((payload: any) =>
        payload.parameter.clientCallbackFunction({ loggedOut: true }),
      );
      (global as any).postMessages = postMessagesMock;
      const spy = jest.fn();
      service.onWebRtcCallResponse$.subscribe(spy);
      service.handleLogOutAgent('dialog-2');
      expect(postMessagesMock).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'logout' }),
      );
      expect(spy).toHaveBeenCalledWith({ loggedOut: true });
    });

    it('handleCallMic posts mic payload', () => {
      postMessagesMock.mockImplementation((payload: any) =>
        payload.parameter.clientCallbackFunction({ mic: 'ok' }),
      );
      (global as any).postMessages = postMessagesMock;
      const spy = jest.fn();
      service.onWebRtcCallResponse$.subscribe(spy);
      service.handleCallMic('mute', 'd1');
      expect(postMessagesMock).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'mute' }),
      );
      expect(spy).toHaveBeenCalledWith({ mic: 'ok' });
    });

    it('handleCallHoldState posts hold action', () => {
      postMessagesMock.mockImplementation((payload: any) =>
        payload.parameter.clientCallbackFunction({ hold: 'ok' }),
      );
      (global as any).postMessages = postMessagesMock;
      const spy = jest.fn();
      service.onWebRtcCallResponse$.subscribe(spy);
      service.handleCallHoldState('hold', 'd2');
      expect(postMessagesMock).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'hold' }),
      );
      expect(spy).toHaveBeenCalledWith({ hold: 'ok' });
    });

    it('convertCall posts convertCall and catches errors gracefully', () => {
      postMessagesMock.mockImplementation((payload: any) =>
        payload.parameter.clientCallbackFunction({ converted: true }),
      );
      (global as any).postMessages = postMessagesMock;
      const spy = jest.fn();
      service.onWebRtcCallResponse$.subscribe(spy);
      service.convertCall('on', 'video', 'd3');
      expect(postMessagesMock).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'convertCall' }),
      );
      expect(spy).toHaveBeenCalledWith({ converted: true });
    });
  });

  describe('getFileURLfromServer', () => {
    it('getFileURLfromServer calls global getFileURL and returns via callback', (done) => {
      getFileURLMock.mockImplementation((_url, cb) => cb({ file: 'ok' }));
      service.getFileURLfromServer('some-url', (res: any) => {
        expect(res).toEqual({ file: 'ok' });
        done();
      });
      expect(getFileURLMock).toHaveBeenCalledWith(
        'some-url',
        expect.any(Function),
      );
    });
  });
});
