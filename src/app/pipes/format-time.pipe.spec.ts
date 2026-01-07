import { FormatTimePipe } from './format-time.pipe';

describe('FormatTimePipe', () => {
  let pipe: FormatTimePipe;

  beforeEach(() => {
    pipe = new FormatTimePipe();
  });

  function getLocalFormattedTime(timestamp: string): string {
    const dateTime = new Date(timestamp);
    let hours = dateTime.getHours();
    const minutes = dateTime.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';

    hours = hours % 12;
    hours = hours ? hours : 12; // convert 0 to 12
    const hoursStr = hours.toString().padStart(2, '0');

    return `${hoursStr}:${minutes} ${ampm}`;
  }

  it('should format a morning timestamp (AM)', () => {
    const timestamp = '2021-01-01T09:05:00Z';
    const expected = getLocalFormattedTime(timestamp);
    const actual = pipe.transform(timestamp);
    expect(actual).toBe(expected);
  });

  it('should format an afternoon timestamp (PM)', () => {
    const timestamp = '2021-01-01T15:45:00Z';
    const expected = getLocalFormattedTime(timestamp);
    const actual = pipe.transform(timestamp);
    expect(actual).toBe(expected);
  });

  it('should format midnight (00:00:00 UTC) as local 12:00 AM equivalent', () => {
    const timestamp = '2021-01-01T00:00:00Z';
    const expected = getLocalFormattedTime(timestamp);
    const actual = pipe.transform(timestamp);
    expect(actual).toBe(expected);
  });

  it('should format noon (12:00:00 UTC) as local 12:00 PM equivalent', () => {
    const timestamp = '2021-01-01T12:00:00Z';
    const expected = getLocalFormattedTime(timestamp);
    const actual = pipe.transform(timestamp);
    expect(actual).toBe(expected);
  });

  it('should pad single-digit hours and minutes', () => {
    const timestamp = '2021-01-01T03:07:00Z';
    const result = pipe.transform(timestamp);
    expect(result).toMatch(/^\d{2}:\d{2} [AP]M$/);
  });

  it('should handle invalid date string gracefully', () => {
    const invalidTimestamp = 'not-a-date';
    const result = pipe.transform(invalidTimestamp);
    expect(result).toContain('NaN');
  });

  it('should format 23:59:00 UTC correctly in local timezone', () => {
    const timestamp = '2021-01-01T23:59:00Z';
    const expected = getLocalFormattedTime(timestamp);
    const actual = pipe.transform(timestamp);
    expect(actual).toBe(expected);
  });
});
