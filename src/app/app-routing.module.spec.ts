import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';

import { AppRoutingModule } from './app-routing.module';
import { WidgetComponent } from './widget/widget.component';
import { TranscriptComponent } from './chat-transcript/chat-transcript.component';

describe('AppRoutingModule', () => {
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouterTestingModule.withRoutes([]), AppRoutingModule],
    }).compileComponents();

    router = TestBed.inject(Router);
  });

  it('should create an instance', () => {
    const module = new AppRoutingModule();
    expect(module).toBeTruthy();
  });

  it('should have "widget" route', () => {
    const widgetRoute = router.config.find(r => r.path === 'widget');
    expect(widgetRoute).toBeTruthy();
    expect(widgetRoute?.component).toBe(WidgetComponent);
  });

  it('should have "chat-transcript" route', () => {
    const chatRoute = router.config.find(r => r.path === 'chat-transcript');
    expect(chatRoute).toBeTruthy();
    expect(chatRoute?.component).toBe(TranscriptComponent);
  });

  it('should redirect "" to "widget"', () => {
    const redirectRoute = router.config.find(r => r.path === '');
    expect(redirectRoute).toBeTruthy();
    expect(redirectRoute?.redirectTo).toBe('widget');
    expect(redirectRoute?.pathMatch).toBe('full');
  });
});
