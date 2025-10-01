import { FormatTimePipe } from './format-time.pipe';

describe('FormatTimePipe', () => {
  let pipe: FormatTimePipe;

  beforeEach(() => {
    pipe = new FormatTimePipe();
  });

  it('should format a morning timestamp (AM)', () => {
    // 2021-01-01 09:05:00
    const timestamp = '2021-01-01T09:05:00Z';
    // get local time for 09:05 UTC
    const expected = pipe.transform(timestamp);
    expect(expected.endsWith('AM')).toBe(true);
    expect(expected).toMatch(/^\d{2}:05 AM$/);
  });

  it('should format an afternoon timestamp (PM)', () => {
    // 2021-01-01 15:45:00
    const timestamp = '2021-01-01T15:45:00Z';
    const expected = pipe.transform(timestamp);
    expect(expected.endsWith('PM')).toBe(true);
    expect(expected).toMatch(/^\d{2}:45 PM$/);
  });

  it('should format midnight (00:00:00) as 12:00 AM', () => {
    const timestamp = '2021-01-01T00:00:00Z';
    const expected = pipe.transform(timestamp);
    expect(expected.endsWith('AM')).toBe(true);
    expect(expected.startsWith('12:00')).toBe(true);
  });

  it('should format noon (12:00:00) as 12:00 PM', () => {
    const timestamp = '2021-01-01T12:00:00Z';
    const expected = pipe.transform(timestamp);
    expect(expected.endsWith('PM')).toBe(true);
    expect(expected.startsWith('12:00')).toBe(true);
  });

  it('should pad single-digit hours and minutes', () => {
    // 2021-01-01 03:07:00
    const timestamp = '2021-01-01T03:07:00Z';
    const expected = pipe.transform(timestamp);
    expect(expected).toMatch(/^0[1-9]:07 AM$|^1[0-2]:07 AM$/);
  });

  it('should handle invalid date string gracefully', () => {
    const invalidTimestamp = 'not-a-date';
    const expected = pipe.transform(invalidTimestamp);
    // result will be 'NaN:NaN AM'
    expect(expected).toContain('NaN');
  });

  it('should format 23:59:00 as 11:59 PM', () => {
    const timestamp = '2021-01-01T23:59:00Z';
    const expected = pipe.transform(timestamp);
    expect(expected).toBe('11:59 PM');
  });
});