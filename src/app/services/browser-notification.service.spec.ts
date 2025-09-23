import { BrowserNotificationService } from './browser-notification.service';
import { ConfigService } from './config.service';

describe('BrowserNotificationService (Jest)', () => {
  let service: BrowserNotificationService;
  let mockConfig: any;
  let originalNotification: any;
  let playSpy: jest.Mock;

  beforeEach(() => {
    mockConfig = { appConfig: { MUTE_NOTIFICATIONS: false } };
    service = new BrowserNotificationService(mockConfig as ConfigService);

    // mock audio element
    playSpy = jest.fn();
    jest.spyOn(document, 'getElementById').mockReturnValue({ play: playSpy } as any);

    // backup Notification
    originalNotification = global.Notification;

    // by default, define Notification
    (global as any).Notification = function (title: string, options?: any) {
      return { title, options };
    } as any;
    (global as any).Notification.permission = 'granted';
    (global as any).Notification.requestPermission = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    (global as any).Notification = originalNotification;
  });

  const baseMessage = {
    header: { sender: { type: 'BOT' } },
    body: { type: 'PLAIN', markdownText: 'Hello' },
  };

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('notify()', () => {
    it('should skip if type is notification', () => {
      const msg = { body: { type: 'notification' }, header: { sender: { type: 'BOT' } } };
      service.openBrowserNotification = jest.fn();
      service.playSound = jest.fn();
      service.notify(msg);
      expect(service.openBrowserNotification).not.toHaveBeenCalled();
      expect(service.playSound).not.toHaveBeenCalled();
    });

    it('should skip if type is deliverynotification', () => {
      const msg = { body: { type: 'deliverynotification' }, header: { sender: { type: 'BOT' } } };
      service.openBrowserNotification = jest.fn();
      service.notify(msg);
      expect(service.openBrowserNotification).not.toHaveBeenCalled();
    });

    it('should trigger openBrowserNotification when document.hidden is true', () => {
      Object.defineProperty(document, 'hidden', { value: true, configurable: true });
      const spy = jest.spyOn(service, 'openBrowserNotification').mockImplementation();
      service.notify(baseMessage);
      expect(spy).toHaveBeenCalledWith('BOT', 'Hello');
    });

    it('should trigger playSound when notifications not muted', () => {
      Object.defineProperty(document, 'hidden', { value: false, configurable: true });
      const spy = jest.spyOn(service, 'playSound').mockImplementation();
      service.notify(baseMessage);
      expect(spy).toHaveBeenCalled();
    });

    it('should not playSound when notifications are muted', () => {
      mockConfig.appConfig.MUTE_NOTIFICATIONS = true;
      Object.defineProperty(document, 'hidden', { value: false, configurable: true });
      const spy = jest.spyOn(service, 'playSound').mockImplementation();
      service.notify(baseMessage);
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('playSound()', () => {
    it('should play audio if element found', () => {
      service.playSound();
      expect(playSpy).toHaveBeenCalled();
    });

    it('should catch error if play fails', () => {
      jest.spyOn(document, 'getElementById').mockReturnValue({ play: jest.fn(() => { throw new Error('fail'); }) } as any);
      const errorSpy = jest.spyOn(console, 'error').mockImplementation();
      service.playSound();
      expect(errorSpy).toHaveBeenCalled();
    });
  });

  describe('openBrowserNotification()', () => {
    it('should log if Notification not supported', () => {
      (global as any).Notification = undefined;
      const logSpy = jest.spyOn(console, 'log').mockImplementation();
      service.openBrowserNotification('BOT', 'msg');
      expect(logSpy).toHaveBeenCalledWith('Browser does not support notifications.');
    });

    it('should request permission and show notification if granted', async () => {
      (global as any).Notification.permission = 'default';
      (global as any).Notification.requestPermission = jest.fn().mockResolvedValue('granted');
      await service.openBrowserNotification('BOT', 'msg');
      expect((global as any).Notification.requestPermission).toHaveBeenCalled();
    });

    it('should log if user blocks notifications', async () => {
      (global as any).Notification.permission = 'default';
      (global as any).Notification.requestPermission = jest.fn().mockResolvedValue('denied');
      const logSpy = jest.spyOn(console, 'log').mockImplementation();
      await service.openBrowserNotification('BOT', 'msg');
      expect(logSpy).toHaveBeenCalledWith('User blocked notifications.');
    });

    it('should catch error when requestPermission rejects', async () => {
      (global as any).Notification.permission = 'default';
      (global as any).Notification.requestPermission = jest.fn().mockRejectedValue('err');
      const errorSpy = jest.spyOn(console, 'error').mockImplementation();
      await service.openBrowserNotification('BOT', 'msg');
      expect(errorSpy).toHaveBeenCalledWith('Error requesting notification permission:', 'err');
    });
  });
});
