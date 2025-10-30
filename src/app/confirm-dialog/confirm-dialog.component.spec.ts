import { ConfirmDialogComponent } from './confirm-dialog.component';
import { MatDialogRef } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';

describe('ConfirmDialogComponent', () => {
  let component: ConfirmDialogComponent;
  let mockDialogRef: { close: jest.Mock };
  let mockTranslate: Partial<TranslateService>;

  beforeEach(() => {
    mockDialogRef = { close: jest.fn() };
    mockTranslate = { instant: jest.fn() } as any;

    component = new ConfirmDialogComponent(
      mockDialogRef as unknown as MatDialogRef<ConfirmDialogComponent>,
      mockTranslate as TranslateService,
      { title: 'Test Title', message: 'Test Message' }
    );
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should receive injected data', () => {
    expect(component.data).toEqual({
      title: 'Test Title',
      message: 'Test Message',
    });
  });

  it('should close dialog with true on confirm', () => {
    component.onConfirm();
    expect(mockDialogRef.close).toHaveBeenCalledWith(true);
  });

  it('should close dialog with false on cancel', () => {
    component.onCancel();
    expect(mockDialogRef.close).toHaveBeenCalledWith(false);
  });
});
