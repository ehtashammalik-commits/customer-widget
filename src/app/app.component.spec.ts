import { AppComponent } from './app.component';

describe('AppComponent (class only, no Angular TestBed)', () => {
  it('should create the app instance', () => {
    const app = new AppComponent();
    expect(app).toBeTruthy();
  });

  it('should implement OnInit and log message', () => {
    const app = new AppComponent();
    const spyLog = jest.spyOn(console, 'log').mockImplementation(() => {});

    app.ngOnInit();

    expect(spyLog).toHaveBeenCalledWith('AppComponent initialized');
    spyLog.mockRestore();
  });
});
