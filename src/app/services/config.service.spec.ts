import { ConfigService } from './config.service';
var jest: any;

describe('ConfigService', () => {
  let service: ConfigService;

  describe("Test Check", () => {
    it("test check", () => {
      let a = 4;
      expect(a).toBeTruthy();
    });
  });
});
