import { TestBed } from '@angular/core/testing';

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
});
