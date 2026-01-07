import { DeliveryNotificationService } from './delivery-notification.service';

describe('DeliveryNotificationService', () => {
  let service: DeliveryNotificationService;

  beforeEach(() => {
    service = new DeliveryNotificationService();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
