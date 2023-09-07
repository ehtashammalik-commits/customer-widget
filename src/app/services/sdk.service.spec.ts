import { SdkService } from './sdk.service';
import { ConfigService } from '../services/config.service';

describe('SdkService', () => {
  let service: SdkService;
  let configService: ConfigService;
  describe('Test Check', () => {
    it('test check', () => {
      let a = 4;
      expect(a).toBeTruthy();
    });
  });
  // ... Similar tests for other methods
});
