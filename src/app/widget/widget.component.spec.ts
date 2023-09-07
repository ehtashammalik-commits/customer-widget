import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { WidgetComponent } from './widget.component';
import { SdkService } from '../services/sdk.service'; // Create a mock service

describe('WidgetComponent', () => {
  let component: WidgetComponent;
  let sdkService: SdkService;
  let fixture: ComponentFixture<WidgetComponent>;

  describe('Test Check', () => {
    it('test check', () => {
      let a = 4;
      expect(a).toBeTruthy();
    });
  });

  // Add more tests for other methods and behaviors
});
