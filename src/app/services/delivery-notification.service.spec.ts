import { TestBed } from '@angular/core/testing';

import { DeliveryNotificationService } from './delivery-notification.service';

describe('DeliveryNotificationService', () => {
  let service: DeliveryNotificationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DeliveryNotificationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
