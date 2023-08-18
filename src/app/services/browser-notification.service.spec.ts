import { TestBed } from '@angular/core/testing';
import { ElementRef } from '@angular/core';
import { browserNotificationService } from './browser-notification.service';

describe('browserNotificationService', () => {
  let service: browserNotificationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(browserNotificationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should notify when message type is BOT and text type is PLAIN', () => {
    const cimMessage = {
      header: { sender: { type: 'BOT' } },
      body: { type: 'notification', markdownText: 'Test notification' },
    };
    const openNotificationSpy = spyOn(service, 'openBrowserNotification');

    service.notify(cimMessage);

    expect(openNotificationSpy).toHaveBeenCalledWith('BOT', 'Test notification');
  });

  it('should play sound when text type is PLAIN', () => {
    const cimMessage = {
      header: { sender: { type: 'AGENT' } },
      body: { type: 'plain', markdownText: 'Test plain message' },
    };
    const playSoundSpy = spyOn(service, 'playSound');

    service.notify(cimMessage);

    expect(playSoundSpy).toHaveBeenCalled();
  });

  it('should not notify when message type is not BOT, AGENT, or SYSTEM', () => {
    const cimMessage = {
      header: { sender: { type: 'OTHER' } },
      body: { type: 'notification', markdownText: 'Test notification' },
    };
    const openNotificationSpy = spyOn(service, 'openBrowserNotification');

    service.notify(cimMessage);

    expect(openNotificationSpy).not.toHaveBeenCalled();
  });

  it('should not notify when text type is not PLAIN', () => {
    const cimMessage = {
      header: { sender: { type: 'BOT' } },
      body: { type: 'formatted', markdownText: 'Test formatted message' },
    };
    const openNotificationSpy = spyOn(service, 'openBrowserNotification');

    service.notify(cimMessage);

    expect(openNotificationSpy).not.toHaveBeenCalled();
  });

  // You can add more test cases to cover other scenarios and edge cases.
});
