import { TestBed } from '@angular/core/testing';
import { SdkService } from './sdk.service';
import { ConfigService } from '../services/config.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Subject } from 'rxjs';

describe('SdkService', () => {
  let service: SdkService;
  let configService: ConfigService;

  let mockEstablishConnectionSubject: Subject<any>;
  let mockOnChatResumedSubject: Subject<any>;

  beforeEach(() => {
    mockEstablishConnectionSubject = new Subject<any>();
    mockOnChatResumedSubject = new Subject<any>();

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        SdkService,
        ConfigService,
        // Provide a mock ConfigService with a minimal appConfig
        { provide: ConfigService, useValue: { appConfig: {} } },
      ],
    });

    service = TestBed.inject(SdkService);
    configService = TestBed.inject(ConfigService);

    // Replace private properties with mock subjects
    service['establishConnectionSubject'] = mockEstablishConnectionSubject;
    service['onChatResumedSubject'] = mockOnChatResumedSubject;
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should load widget and emit widgetConfigs$', (done) => {
    const mockWidgetConfig = { key: 'value' };
    service.widgetConfigs$.subscribe((res) => {
      expect(res).toEqual(mockWidgetConfig);
      done();
    });

    // Simulate widgetConfigs callback
    mockEstablishConnectionSubject.next(mockWidgetConfig);

    // You can also directly call the loadWidget method to test the behavior.
    // service.loadWidget('ccm_url', 'widget_id');
  });

  it('should render pre-chat form and emit renderPreChatForm$', (done) => {
    const mockPreChatForm = { key: 'value' };
    service.renderPreChatForm$.subscribe((res) => {
      expect(res).toEqual(mockPreChatForm);
      done();
    });

    // Simulate renderPreChatForm callback
    mockOnChatResumedSubject.next(mockPreChatForm);

    // You can also directly call the renderPreChatForm method to test the behavior.
    // service.renderPreChatForm('form_id');
  });

  it('should emit onChatResumedResponse$', (done) => {
    const mockChatResumedResponse = { key: 'value' };
    service.onChatResumedResponse$.subscribe((res) => {
      expect(res).toEqual(mockChatResumedResponse);
      done();
    });

    // Simulate onChatResumed callback
    mockOnChatResumedSubject.next(mockChatResumedResponse);

    // Simulate the call to onChatResumed
    // service.onChatResumed('service_id', 'channel_customer_id');
  });

  // ... Similar tests for other methods
});
