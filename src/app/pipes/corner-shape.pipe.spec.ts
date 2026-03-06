import { CornerShapePipe } from './corner-shape.pipe';

describe('CornerShapePipe', () => {
  const pipe = new CornerShapePipe();

  it('should return default rounded radius when value is missing', () => {
    expect(pipe.transform(undefined)).toBe('8px');
    expect(pipe.transform(null as any)).toBe('8px');
    expect(pipe.transform('')).toBe('8px');
  });

  it('should convert known keywords correctly', () => {
    expect(pipe.transform('sharp')).toBe('0px');
    expect(pipe.transform('ROUND')).toBe('8px');
    expect(pipe.transform('  round  ')).toBe('8px');
  });

  it('should passthrough custom values', () => {
    expect(pipe.transform('4px')).toBe('4px');
    expect(pipe.transform('50%')).toBe('50%');
  });
});
