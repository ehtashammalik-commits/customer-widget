import { TestBed, inject } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ConfigService } from './config.service';

describe('ConfigService', () => {
  let service: ConfigService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ConfigService],
    });
    service = TestBed.inject(ConfigService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should load configuration from HTTP', async () => {
    const expectedConfig = { apiUrl: 'https://example.com/api' };
    const configUrl = '../../assets/config/config.json';

    let appConfig: any;

    // Make a mock HTTP request
    const configPromise = service.loadConfig();

    const req = httpMock.expectOne(configUrl);
    expect(req.request.method).toBe('GET');
    req.flush(expectedConfig);

    await configPromise;

    // Access the loaded configuration
    appConfig = service.appConfig;

    // Check that the configuration was loaded correctly
    expect(appConfig).toEqual(expectedConfig);
  });
});
