import { PostMessageHandlerService } from './post-message-handler.service';

describe('PostMessageHandlerService', () => {
  let service: PostMessageHandlerService;

  beforeEach(() => {
    // fresh service before each test
    service = new PostMessageHandlerService();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should emit browserInfoData when receiving correct postMessage event', (done) => {
    const testData = { foo: 'bar' };

    service.browserInfoData$.subscribe((data) => {
      expect(data).toEqual(testData);
      done();
    });

    // Simulate postMessage event
    window.dispatchEvent(
      new MessageEvent('message', {
        data: { type: 'browserInfoData', data: testData },
      }),
    );
  });

  it('should ignore messages with different type', () => {
    const nextSpy = jest.fn();
    service.browserInfoData$.subscribe(nextSpy);

    window.dispatchEvent(
      new MessageEvent('message', {
        data: { type: 'otherType', data: { hello: 'world' } },
      }),
    );

    expect(nextSpy).not.toHaveBeenCalled();
  });

  it('should not throw error when receiving malformed event', () => {
    expect(() => {
      window.dispatchEvent(
        new MessageEvent('message', { data: 'not-an-object' }),
      );
    }).not.toThrow();
  });

  describe('sendPostMessage', () => {
    let getParentOriginSpy: jest.SpyInstance;
    let postMessageSpy: jest.SpyInstance;
    let originalParent: WindowProxy;

    beforeEach(() => {
      getParentOriginSpy = jest.spyOn(service, 'getParentOrigin');
      postMessageSpy = jest.spyOn(window, 'postMessage').mockImplementation();
      // Save and mock window.parent to simulate a different window
      originalParent = window.parent;
      Object.defineProperty(window, 'parent', {
        value: {},
        writable: true,
        configurable: true,
      });
    });

    afterEach(() => {
      getParentOriginSpy.mockRestore();
      postMessageSpy.mockRestore();
      Object.defineProperty(window, 'parent', {
        value: originalParent,
        writable: true,
        configurable: true,
      });
    });

    it('should send postMessage to parent if parent exists and origin is valid', () => {
      // Simulate parent is not self
      Object.defineProperty(window, 'parent', {
        value: { postMessage: postMessageSpy },
        writable: true,
        configurable: true,
      });
      getParentOriginSpy.mockReturnValue('https://example.com');
      const msg = { type: 'TEST' };
      service.sendPostMessage(msg);
      expect(postMessageSpy).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'TEST', timestamp: expect.any(String) }),
        'https://example.com',
      );
    });

    it('should not send postMessage if parent is self', () => {
      // Simulate parent is self
      Object.defineProperty(window, 'parent', {
        value: window,
        writable: true,
        configurable: true,
      });
      getParentOriginSpy.mockReturnValue('https://example.com');
      const msg = { type: 'TEST' };
      service.sendPostMessage(msg);
      expect(postMessageSpy).not.toHaveBeenCalled();
    });

    it('should not send postMessage if origin is null', () => {
      Object.defineProperty(window, 'parent', {
        value: { postMessage: postMessageSpy },
        writable: true,
        configurable: true,
      });
      getParentOriginSpy.mockReturnValue(null);
      const msg = { type: 'TEST' };
      service.sendPostMessage(msg);
      expect(postMessageSpy).not.toHaveBeenCalled();
    });
  });

  describe('sendLinkClickedPostMessage', () => {
    let getParentOriginSpy: jest.SpyInstance;
    let postMessageSpy: jest.SpyInstance;
    let originalParent: WindowProxy;

    beforeEach(() => {
      getParentOriginSpy = jest.spyOn(service, 'getParentOrigin');
      postMessageSpy = jest.spyOn(window, 'postMessage').mockImplementation();
      originalParent = window.parent;
      Object.defineProperty(window, 'parent', {
        value: {},
        writable: true,
        configurable: true,
      });
    });

    afterEach(() => {
      getParentOriginSpy.mockRestore();
      postMessageSpy.mockRestore();
      Object.defineProperty(window, 'parent', {
        value: originalParent,
        writable: true,
        configurable: true,
      });
    });

    it('should send LINK_CLICKED message to parent if parent exists and origin is valid', () => {
      Object.defineProperty(window, 'parent', {
        value: { postMessage: postMessageSpy },
        writable: true,
        configurable: true,
      });
      getParentOriginSpy.mockReturnValue('https://example.com');
      const link = 'https://foo.com';
      service.sendLinkClickedPostMessage(link);
      expect(postMessageSpy).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'LINK_CLICKED', url: link, timestamp: expect.any(String) }),
        'https://example.com',
      );
    });

    it('should not send LINK_CLICKED message if origin is null', () => {
      Object.defineProperty(window, 'parent', {
        value: { postMessage: postMessageSpy },
        writable: true,
        configurable: true,
      });
      getParentOriginSpy.mockReturnValue(null);
      const link = 'https://foo.com';
      service.sendLinkClickedPostMessage(link);
      expect(postMessageSpy).not.toHaveBeenCalled();
    });
  });

  describe('getParentOrigin', () => {
    let originalReferrer: string;

    beforeEach(() => {
      originalReferrer = document.referrer;
    });

    afterEach(() => {
      Object.defineProperty(document, 'referrer', { value: originalReferrer, configurable: true });
    });

    it('should return null if referrer is empty', () => {
      Object.defineProperty(document, 'referrer', { value: '', configurable: true });
      expect(service.getParentOrigin()).toBeNull();
    });

    it('should return origin if referrer is valid', () => {
      Object.defineProperty(document, 'referrer', { value: 'https://foo.com/page', configurable: true });
      expect(service.getParentOrigin()).toBe('https://foo.com');
    });

    it('should return null if referrer is malformed', () => {
      Object.defineProperty(document, 'referrer', { value: 'not-a-valid-url', configurable: true });
      expect(service.getParentOrigin()).toBeNull();
    });
  });
});
