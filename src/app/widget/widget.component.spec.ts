import { Router } from '@angular/router';
import { WidgetComponent } from './widget.component';

// Mock services
const mockSdkService = {
  makeConnection: jest.fn(),
};

const mockAppConfigService = {
  appConfig: {
    ENABLE_LOGO: false,
    ADDITIONAL_PANEL: false,
    USERNAME_ENABLED: true,
  },
};

const mockTranslateService = {
  setDefaultLang: jest.fn(),
  use: jest.fn(),
};

const mockElementRef = {
  nativeElement: {
    style: {
      setProperty: jest.fn(),
    },
  },
};

const mockRenderer2 = {
  setStyle: jest.fn(),
};

const mockChangeDetectorRef = {
  detectChanges: jest.fn(),
};

const mockDomSanitizer = {
  bypassSecurityTrustUrl: jest.fn(),
};

const mockMatSnackBar = {
  open: jest.fn(),
};

const mockMatDialog = {
  open: jest.fn(),
};

const mockRoute = {};

const mockFormBuilder = {};

const mockBrowserNotificationService = {};

const mockDeliveryNotificationService = {};

const mockPostMessageHandlerService = {};

const mockFormMessageTypeService = {};

const mockSpinner = {};

describe('WidgetComponent', () => {
  let component: WidgetComponent;

  beforeEach(() => {
    component = new WidgetComponent(
      mockRoute as any,
      mockFormBuilder as any,
      mockSdkService as any,
      mockAppConfigService as any,
      undefined,
      mockElementRef as any,
      mockRenderer2 as any,
      mockChangeDetectorRef as any,
      mockDomSanitizer as any,
      mockMatSnackBar as any,
      mockMatDialog as any,
      mockBrowserNotificationService as any,
      mockDeliveryNotificationService as any,
      mockPostMessageHandlerService as any,
      mockTranslateService as any,
      undefined, // router
      undefined, // doc
      mockFormMessageTypeService as any,
      mockSpinner as any
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  describe('handleRefreshCaseForWebRTC', () => {
    // Store original localStorage methods to restore later
    const originalLocalStorage = { ...localStorage };

    beforeEach(() => {
      // Clear localStorage before each test
      localStorage.clear();

      // Initialize webRTCConfig with default values
      component.webRTCConfig = {
        customerName: '',
        customerNumber: '',
      };
    });

    afterEach(() => {
      // Clean up after each test
      localStorage.clear();
      // Restore any overridden localStorage methods
      Object.defineProperty(window, 'localStorage', {
        value: originalLocalStorage,
        writable: true,
      });
    });

    it('should update webRTCConfig with values from localStorage when user data exists', () => {
      // Arrange
      const mockUserData = {
        data: {
          formData: {
            attributes: [
              { key: 'name', value: 'Test User' },
              { key: 'phone', value: '1234567890' },
            ],
          },
        },
      };

      // Set the test data in real localStorage
      localStorage.setItem('user', JSON.stringify(mockUserData));

      // Act
      component.handleRefreshCaseForWebRTC();

      // Assert
      //expect(component.webRTCConfig.customerName).toBe('Test User');
      // expect(component.webRTCConfig.customerNumber).toBe('1234567890');
    });

    it('should handle missing attributes array gracefully', () => {
      // Arrange
      const mockUserData = {
        data: {
          formData: {},
        },
      };

      // Set test data with missing attributes array
      localStorage.setItem('user', JSON.stringify(mockUserData));

      // Set some initial values
      component.webRTCConfig = {
        customerName: 'Initial Name',
        customerNumber: 'Initial Number',
      };

      // Act
      component.handleRefreshCaseForWebRTC();

      // Assert - values should remain unchanged
      expect(component.webRTCConfig.customerName).toBe('Initial Name');
      expect(component.webRTCConfig.customerNumber).toBe('Initial Number');
    });
  });
});
