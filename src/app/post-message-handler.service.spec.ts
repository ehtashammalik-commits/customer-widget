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
});
