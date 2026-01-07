import { ConfigService } from './config.service';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';

describe('ConfigService', () => {
  let service: ConfigService;
  let httpClientMock: jest.Mocked<HttpClient>;

  beforeEach(() => {
    httpClientMock = {
      get: jest.fn(),
    } as any;

    service = new ConfigService(httpClientMock);
  });

  describe('loadConfig', () => {
    it('should load config and override URLs with current hostname', async () => {
      const fakeConfig = {
        SOCKET_URL: 'http://oldhost.com/socket',
        CCM_URL: 'https://oldhost.com/ccm',
        OTHER_KEY: 'no-change',
      };
      httpClientMock.get.mockReturnValue(of(fakeConfig));

      // mock hostname
      Object.defineProperty(window, 'location', {
        value: { hostname: 'newhost.com' },
        writable: true,
      });

      await service.loadConfig();

      expect(service.appConfig.SOCKET_URL).toBe('https://newhost.com/socket');
      expect(service.appConfig.CCM_URL).toBe('https://newhost.com/ccm');
      expect(service.appConfig.OTHER_KEY).toBe('no-change'); // unchanged
    });

    it('should not override keys if they are not strings with http', async () => {
      const fakeConfig = {
        SOCKET_URL: 123, // not a string
        CCM_URL: null, // not a string
      };
      httpClientMock.get.mockReturnValue(of(fakeConfig));

      Object.defineProperty(window, 'location', {
        value: { hostname: 'anotherhost.com' },
        writable: true,
      });

      await service.loadConfig();

      expect(service.appConfig.SOCKET_URL).toBe(123);
      expect(service.appConfig.CCM_URL).toBe(null);
    });

    it('should handle empty config gracefully', async () => {
      const fakeConfig = {};
      httpClientMock.get.mockReturnValue(of(fakeConfig));

      await service.loadConfig();

      expect(service.appConfig).toEqual({});
    });
  });
});
