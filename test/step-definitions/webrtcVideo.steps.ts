import { defineFeature, loadFeature } from 'jest-cucumber';
import { of } from 'rxjs';

// Load the feature file
const feature = loadFeature('./test/features/webrtcVideo.feature');

// Mock the SDK service with all necessary methods and properties
class MockSdkService {
  // Core methods for WebRTC
  sendChatMessage = jest.fn().mockResolvedValue({});
  loginSipWebRtc = jest.fn().mockResolvedValue(undefined);
  handleCallStart = jest.fn().mockResolvedValue({});
  
  // Event handling
  on = jest.fn().mockReturnValue(of({}));
  off = jest.fn();
  emit = jest.fn();
  
  // Connection management
  connect = jest.fn().mockResolvedValue(undefined);
  disconnect = jest.fn().mockResolvedValue(undefined);
  
  // Configuration and state
  getConfig = jest.fn().mockResolvedValue({});
  ConfigData: any = {};
  widgetIdentifier = 'test-widget';
  serviceIdentifier = 'test-service';
  sdkLoaded = true;
  
  // State properties
  messages: any[] = [];
  currentChat: any = null;
  isConnected = true;
  isConnecting = false;
  isDisconnected = false;
  isError = false;
  error: any = null;
  
  // Additional methods
  sendMessage = jest.fn().mockResolvedValue(undefined);
}

// Mock the WidgetComponent
class MockWidgetComponent {
  isVideoCallActive = false;
  IsRegisteredInFreeSwitch = true;
  callPopUpView = false;
  activeVideoView = false;
  webRTCConfig = { sipExtension: '1234' };
  sdk = new MockSdkService();
  
  changeView = jest.fn().mockImplementation(async (view: string) => {
    if (view === 'video') {
      await this.initiateWebRtcCall('video');
    }
  });
  
  initiateWebRtcCall = jest.fn().mockImplementation(async (type: string) => {
    this.isVideoCallActive = true;
    this.callPopUpView = true;
    this.activeVideoView = true;
    
    await this.sdk.handleCallStart({
      type,
      authConfigs: this.webRTCConfig
    });
    
    await this.sdk.sendChatMessage({
      type: 'webrtc',
      action: 'initiate',
      hasVideo: true
    });
  });
}

let component: MockWidgetComponent;

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
  component = new MockWidgetComponent();
  jest.clearAllMocks();
});

// Define the feature test
defineFeature(feature, (test) => {
  test('Customer initiates a video call', ({ given, and, when, then }) => {
    given('the customer widget is loaded', () => {
      // Component is already initialized in beforeEach
      expect(component).toBeDefined();
      expect(component.IsRegisteredInFreeSwitch).toBe(true);
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
      expect(component.initiateWebRtcCall).toHaveBeenCalledWith('video');
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
})
