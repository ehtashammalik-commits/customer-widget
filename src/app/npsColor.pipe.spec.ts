import { NpsColorPipe } from './npsColor.pipe';

describe('NpsColorPipe', () => {
  let pipe: NpsColorPipe;

  beforeEach(() => {
    pipe = new NpsColorPipe();
  });

  it('should return color by optionIndex if selectedIndex is undefined', () => {
    expect(pipe.transform(0, 5, {})).toBe('#F14949'); // <=6
    expect(pipe.transform(0, 7, {})).toBe('#FECB2D'); // <=8
    expect(pipe.transform(0, 10, {})).toBe('#28C591'); // <=10
    expect(pipe.transform(0, 11, {})).toBe('#DBDBDB'); // >10
  });

  it('should return color if optionIndex is selected', () => {
    expect(pipe.transform(1, 3, { 1: 3 })).toBe('#F14949');
    expect(pipe.transform(2, 8, { 2: 8 })).toBe('#FECB2D');
    expect(pipe.transform(3, 10, { 3: 10 })).toBe('#28C591');
  });

  it('should return #DBDBDB if optionIndex is not selected', () => {
    expect(pipe.transform(1, 2, { 1: 3 })).toBe('#DBDBDB');
    expect(pipe.transform(2, 7, { 2: 8 })).toBe('#DBDBDB');
    expect(pipe.transform(3, 9, { 3: 10 })).toBe('#DBDBDB');
  });
});
