// src/app/services/storage.service.spec.ts
import { StorageService } from './storage.service';

describe('StorageService', () => {
  let service: StorageService;

  let localStorageMock: any;
  let sessionStorageMock: any;

  beforeEach(() => {
    localStorageMock = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
    };

    sessionStorageMock = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
    };
    
    const createStorageMock = (): Storage => {
      let store: Record<string, string> = {};
      return {
        getItem: jest.fn((key: string) => store[key] ?? null),
        setItem: jest.fn((key: string, value: string) => {
          store[key] = value;
        }),
        removeItem: jest.fn((key: string) => {
          delete store[key];
        }),
        clear: jest.fn(() => {
          store = {};
        }),
        key: jest.fn(),
        length: 0,
      };
    };

    localStorageMock = createStorageMock();
    sessionStorageMock = createStorageMock();

    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });

    Object.defineProperty(window, 'sessionStorage', {
      value: sessionStorageMock,
      writable: true,
    });

    service = new StorageService();
  });

  describe('setItem', () => {
    it('should store a string value in localStorage', () => {
      service.setItem('key1', 'value1');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('key1', 'value1');
    });

    it('should stringify an object before storing', () => {
      const obj = { name: 'Alice' };
      service.setItem('user', obj);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'user',
        JSON.stringify(obj),
      );
    });

    it('should use sessionStorage when storageType is sessionStorage', () => {
      service.setItem('key2', 'sessionVal', 'sessionStorage');
      expect(sessionStorageMock.setItem).toHaveBeenCalledWith(
        'key2',
        'sessionVal',
      );
    });

    it('should log error if setItem throws', () => {
      const spy = jest.spyOn(console, 'error').mockImplementation();
      (localStorageMock.setItem as jest.Mock).mockImplementation(() => {
        throw new Error('fail');
      });
      service.setItem('bad', 'val');
      expect(spy).toHaveBeenCalledWith(
        'Storage setItem error:',
        expect.any(Error),
      );
      spy.mockRestore();
    });
  });

  describe('getItem', () => {
    it('should retrieve and parse a JSON value', () => {
      const obj = { foo: 'bar' };
      localStorageMock.getItem = jest.fn(() => JSON.stringify(obj));
      const result = service.getItem('obj');
      expect(result).toEqual(obj);
    });

    it('should return raw string if parseJson=false', () => {
      localStorageMock.getItem = jest.fn(() => 'rawString');
      const result = service.getItem('raw', 'localStorage', false);
      expect(result).toBe('rawString');
    });

    it('should return string if JSON.parse fails', () => {
      localStorageMock.getItem = jest.fn(() => 'not-json');
      const result = service.getItem('broken');
      expect(result).toBe('not-json');
    });

    it('should return null if key not found', () => {
      localStorageMock.getItem = jest.fn(() => null);
      const result = service.getItem('missing');
      expect(result).toBeNull();
    });

    it('should log error and return null if getItem throws', () => {
      const spy = jest.spyOn(console, 'error').mockImplementation();
      (localStorageMock.getItem as jest.Mock).mockImplementation(() => {
        throw new Error('boom');
      });
      const result = service.getItem('err');
      expect(result).toBeNull();
      expect(spy).toHaveBeenCalledWith(
        'Storage getItem error:',
        expect.any(Error),
      );
      spy.mockRestore();
    });
  });

  describe('removeItem', () => {
    it('should remove item from localStorage', () => {
      service.removeItem('toRemove');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('toRemove');
    });

    it('should log error if removeItem fails', () => {
      const spy = jest.spyOn(console, 'error').mockImplementation();
      (localStorageMock.removeItem as jest.Mock).mockImplementation(() => {
        throw new Error('removeFail');
      });
      service.removeItem('badKey');
      expect(spy).toHaveBeenCalledWith(
        'Storage removeItem error:',
        expect.any(Error),
      );
      spy.mockRestore();
    });
  });

  describe('clear', () => {
    it('should clear localStorage', () => {
      service.clear();
      expect(localStorageMock.clear).toHaveBeenCalled();
    });

    it('should clear sessionStorage when specified', () => {
      service.clear('sessionStorage');
      expect(sessionStorageMock.clear).toHaveBeenCalled();
    });

    it('should log error if clear fails', () => {
      const spy = jest.spyOn(console, 'error').mockImplementation();
      (localStorageMock.clear as jest.Mock).mockImplementation(() => {
        throw new Error('clearFail');
      });
      service.clear();
      expect(spy).toHaveBeenCalledWith(
        'Storage clear error:',
        expect.any(Error),
      );
      spy.mockRestore();
    });
  });
});
