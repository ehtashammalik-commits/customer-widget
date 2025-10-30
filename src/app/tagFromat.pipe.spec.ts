import { tagFormatPipe } from './tagFormat.pipe';

// Mock ibsFormat globally
jest.mock('ibs-format', () => ({
  ibsFormat: jest.fn((value, tags, opts, xss) => `formatted:${value}:${opts.detectLinks}`),
}));

describe('tagFormatPipe', () => {
  let pipe: tagFormatPipe;
  const { ibsFormat } = require('ibs-format');

  beforeEach(() => {
    pipe = new tagFormatPipe();
    (ibsFormat as jest.Mock).mockClear();
  });

  it('should call ibsFormat with enableDynamicLink true', () => {
    const result = pipe.transform('Hello *world*', true);
    expect(ibsFormat).toHaveBeenCalledWith(
      'Hello *world*',
      [
        ['em', '`'],
        ['b', '*'],
        ['i', '_'],
        ['strike', '~'],
        ['mark', '!'],
      ],
      { detectLinks: true, target: '_blank' },
      { allowXssEscaping: true }
    );
    expect(result).toBe('formatted:Hello *world*:true');
  });

  it('should call ibsFormat with enableDynamicLink false', () => {
    const result = pipe.transform('Test _italic_', false);
    expect(ibsFormat).toHaveBeenCalledWith(
      'Test _italic_',
      [
        ['em', '`'],
        ['b', '*'],
        ['i', '_'],
        ['strike', '~'],
        ['mark', '!'],
      ],
      { detectLinks: false, target: '_blank' },
      { allowXssEscaping: true }
    );
    expect(result).toBe('formatted:Test _italic_:false');
  });
});