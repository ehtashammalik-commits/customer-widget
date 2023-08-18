import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { WidgetComponent } from './widget.component';
import { SdkService } from "../services/sdk.service"; // Create a mock service
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';

describe('WidgetComponent', () => {
  let component: WidgetComponent;
  let fixture: ComponentFixture<WidgetComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [WidgetComponent],
      providers: [
        { provide: SdkService, useClass: SdkService }, // Provide mock service
        { provide: MatSnackBar, useValue: {} }, // Provide mock MatSnackBar
        { provide: MatDialog, useValue: {} } // Provide mock MatDialog
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // Add more tests here based on your component's functionality
  it('should change screen to "widget"', () => {
    component.changeScreen('widget');
    expect(component.additionalPanel).toBe(true);
    expect(component.preChatForm).toBe(false);
    // Add more expectations for other properties
  });

  it('should change screen to "chat"', () => {
    component.changeScreen('chat');
    expect(component.additionalPanel).toBe(false);
    expect(component.chatActive).toBe(true);
    // Add more expectations for other properties
  });

  // Add more tests for other methods and behaviors

});
