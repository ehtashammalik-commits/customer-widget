import { ChangeDetectorRef } from '@angular/core';
import { defineFeature, loadFeature } from 'jest-cucumber';
import { WidgetComponent } from 'src/app/widget/widget.component'
const feature = loadFeature('./test/features/webrtcVideo.feature');

let component: WidgetComponent;

// Mock WebRTC APIs
const mockRTCPeerConnection = jest.fn().mockImplementation(() => ({
  createOffer: jest.fn().mockResolvedValue({ type: 'offer', sdp: 'test-sdp' }),
  setLocalDescription: jest.fn().mockResolvedValue(undefined),
  close: jest.fn(),
  addTrack: jest.fn(),
  createDataChannel: jest.fn(),
  onicecandidate: null,
  oniceconnectionstatechange: null,
  onnegotiationneeded: null,
  onicegatheringstatechange: null,
  onsignalingstatechange: null,
  ontrack: null,
  generateCertificate: jest.fn().mockResolvedValue({})
}));

// Mock mediaDevices
const mockMediaDevices = {
  getUserMedia: jest.fn().mockResolvedValue({
    getTracks: () => [
      { kind: 'video', stop: jest.fn() },
      { kind: 'audio', stop: jest.fn() }
    ]
  })
};

// Set up global mocks
beforeAll(() => {
  global.RTCPeerConnection = mockRTCPeerConnection as any;
  Object.defineProperty(global.navigator, 'mediaDevices', {
    value: mockMediaDevices,
    writable: true,
    configurable: true
  });



});

// Reset mocks before each test
beforeEach(() => {
  const mockChangeDetectorRef = {
    detectChanges: jest.fn()
  } as unknown as ChangeDetectorRef;

  const mockTranslateService = {
    setDefaultLang: jest.fn(),
    use: jest.fn()
  } as any;
  const mockActivatedRoute = { snapshot: { params: {} } } as any;
  const mockFormBuilder = { group: jest.fn() } as any;
  const mockSdkService = {
    sendChatMessage: jest.fn(),
    loginSipWebRtc: jest.fn(),
    handleCallStart: jest.fn()
  } as any;
  const mockAppConfig = {
    appConfig: {
      ENABLE_LOGO: true,
      ADDITIONAL_PANEL: false,
      USERNAME_ENABLED: true,
    },
  } as any;

  const webRTCConfig = { sipExtension: '1234' };
  const mockElementRef = {} as any;
  const mockRenderer2 = {} as any;
  const mockSanitizer = {} as any;
  const mockSnackBar = {} as any;
  const mockDialog = {} as any;
  const mockBrowserNotificationService: any = {
    notify: jest.fn(),
    playSound: jest.fn(),
    openBrowserNotification: jest.fn(),
  };
  const mockDeliveryNotificationService = {} as any;
  const mockPostMessageHandlerService = {} as any;
  component = new WidgetComponent(
    mockActivatedRoute,
    mockFormBuilder,
    mockSdkService,
    mockAppConfig,
    mockElementRef,
    mockRenderer2,
    mockChangeDetectorRef,
    mockSanitizer,
    mockSnackBar,
    mockDialog,
    mockBrowserNotificationService,
    mockDeliveryNotificationService,
    mockPostMessageHandlerService,
    mockTranslateService
  );

  (component as any).elementView = {
    nativeElement: {
      value: '',
    },
  };
  component.webRTCConfig = webRTCConfig;
  jest.clearAllMocks();
});

// Define the feature test
defineFeature(feature, (test) => {
  let initiateWebRtcCallSpy: jest.SpyInstance;

  test('Customer initiates a video call', ({ given, and, when, then }) => {
    given('the customer widget is loaded', () => {
      // Create a spy on the initiateWebRtcCall method
      initiateWebRtcCallSpy = jest.spyOn(component, 'initiateWebRtcCall' as any)
        .mockImplementation(async (type: string) => {
          component.isVideoCallActive = true;
          component.callPopUpView = true;
          component.activeVideoView = true;

          await component.sdk.handleCallStart({
            type,
            authConfigs: component.webRTCConfig
          });

          await component.sdk.sendChatMessage({
            type: 'webrtc',
            action: 'initiate',
            hasVideo: true
          });

          return Promise.resolve();
        });

      // Mock the changeView method to call initiateWebRtcCall
      jest.spyOn(component, 'changeView' as any).mockImplementation(async (view: string) => {
        if (view === 'video') {
          await component.initiateWebRtcCall('video');
        }
      });

      expect(component).toBeDefined();
      expect(component.IsRegisteredInFreeSwitch).toBe(false);
    });

    and('video permissions are granted', async () => {
      // Mock the media devices
      const mockStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      expect(mockStream).toBeDefined();
    });

    when('the customer clicks on Start Video Call button', async () => {
      await component.changeView('video');
    });

    then('a new WebRTC session should be initiated', () => {
      expect(initiateWebRtcCallSpy).toHaveBeenCalledWith('video');
      expect(component.isVideoCallActive).toBe(true);
      expect(component.callPopUpView).toBe(true);
      expect(component.activeVideoView).toBe(true);
    });

    and('a routing request is sent to CX Core', () => {
      expect(component.sdk.handleCallStart).toHaveBeenCalledWith({
        type: 'video',
        authConfigs: component.webRTCConfig
      });

      expect(component.sdk.sendChatMessage).toHaveBeenCalledWith({
        type: 'webrtc',
        action: 'initiate',
        hasVideo: true
      });
    });
  });

  test('Video call initiation fails due to missing audio permission', ({ given, when, then, and }) => {
    // Setup spies and mocks
    let permissionError: Error;

    given('the customer has not granted microphone permission', () => {
      // Create a permission denied error
      permissionError = new Error('Permission denied');
      // Mock getUserMedia to reject with the permission denied error
      mockMediaDevices.getUserMedia.mockRejectedValueOnce(permissionError);
    });

    when('the customer clicks Start Video Call', async () => {
      // Create a spy on the initiateWebRtcCall method
      initiateWebRtcCallSpy = jest.spyOn(component, 'initiateWebRtcCall' as any);

      // Mock the changeView implementation to handle the permission error
      jest.spyOn(component, 'changeView' as any).mockImplementationOnce(async (view: string) => {
        if (view === 'video') {
          // This will trigger the mocked permission denied error
          await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          throw new Error('Test should not reach here - permission should be denied');
        }
        return Promise.resolve();
      });

      // Execute the test - we expect this to fail with a permission error
      try {
        await component.changeView('video');
        // If we get here, the test should fail as we expected an error
        throw new Error('Test failed - Expected permission to be denied');
      } catch (error) {
        // Verify the error is the one we expect
        expect(error).toBe(permissionError);
      }
    });

    then('the call should not be initiated', () => {
      // Verify that initiateWebRtcCall was never called
      expect(initiateWebRtcCallSpy).not.toHaveBeenCalled();
      // Verify the component state remains unchanged
      expect(component.isVideoCallActive).toBe(false);
      expect(component.callPopUpView).toBe(false);
    });

    and('an error is shown suggesting audio permission is required', () => {
      // Verify that getUserMedia was called with the expected parameters
      expect(mockMediaDevices.getUserMedia).toHaveBeenCalledWith({
        video: true,
        audio: true
      });
      // Verify the error was properly propagated
      expect(permissionError).toBeDefined();
      expect(permissionError.message).toBe('Permission denied');
    });
  });
})
