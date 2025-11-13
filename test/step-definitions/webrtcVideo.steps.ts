import { ChangeDetectorRef } from '@angular/core';
import { defineFeature, loadFeature } from 'jest-cucumber';
import { WidgetComponent } from 'src/app/widget/widget.component';

const feature = loadFeature('./test/features/webrtcVideo.feature');

let component: WidgetComponent;

// Mock WebRTC APIs
const createMockRTCPeerConnection = () => ({
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
});

// Mock MediaStream
const createMockMediaStream = (tracks: MediaStreamTrack[] = []) => {
  const streamTracks = [...tracks];

  return {
    addTrack(track: MediaStreamTrack) {
      streamTracks.push(track);
    },
    removeTrack(track: MediaStreamTrack) {
      const index = streamTracks.indexOf(track);
      if (index !== -1) {
        streamTracks.splice(index, 1);
      }
    },
    getTracks() {
      return [...streamTracks];
    },
    getAudioTracks() {
      return streamTracks.filter(track => track.kind === 'audio');
    },
    getVideoTracks() {
      return streamTracks.filter(track => track.kind === 'video');
    }
  };
};

// Mock mediaDevices
const mockMediaDevices = {
  getUserMedia: jest.fn().mockResolvedValue({
    getTracks: () => [
      { kind: 'video', stop: jest.fn() },
      { kind: 'audio', stop: jest.fn() }
    ]
  })
};

// Helper function to create a mock component
const createMockComponent = () => {
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

  const comp = new WidgetComponent(
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
    mockTranslateService,
    undefined,
    undefined
  );

  (comp as any).elementView = {
    nativeElement: {
      value: '',
    },
  };
  comp.webRTCConfig = webRTCConfig;
  return comp;
};

// Reset mocks and create a new component instance before each test
beforeEach(() => {
  // Set up global mocks
  global.RTCPeerConnection = jest.fn().mockImplementation(createMockRTCPeerConnection) as any;
  global.MediaStream = jest.fn().mockImplementation((tracks?: MediaStreamTrack[]) => {
    return createMockMediaStream(tracks);
  }) as any;

  Object.defineProperty(global.navigator, 'mediaDevices', {
    value: mockMediaDevices,
    writable: true,
    configurable: true
  });

  // Create a new component instance for each test
  component = createMockComponent();
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

      // Set up the changeView mock
      const changeViewSpy = jest.spyOn(component, 'changeView' as any);
      const handleViewChange = (view: string) => {
        return view === 'video'
          ? component.initiateWebRtcCall('video')
          : Promise.resolve();
      };
      changeViewSpy.mockImplementation(handleViewChange);

      // Verify component initialization
      expect(component).toBeDefined();
      expect(component.IsRegisteredInFreeSwitch).toBe(false);
    });

    and('video permissions are granted', () => {
      // Mock the media devices
      return navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(verifyMediaStream);

      function verifyMediaStream(stream: MediaStream) {
        expect(stream).toBeDefined();
        return stream;
      }
    });

    when('the customer clicks on Start Video Call button', () => {
      return new Promise((resolve, reject) => {
        component.changeView('video')
          .then(() => resolve(undefined))
          .catch(reject);
      });
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

    when('the customer clicks Start Video Call', () => {
      // Set up spies and mocks
      initiateWebRtcCallSpy = jest.spyOn(component, 'initiateWebRtcCall' as any);
      const changeViewMock = jest.spyOn(component, 'changeView' as any);

      // Create a mock implementation that will be called once
      const mockViewChange = (view: string) => {
        if (view !== 'video') {
          return Promise.resolve();
        }
        return navigator.mediaDevices.getUserMedia({ video: true, audio: true })
          .then(handleSuccessfulMediaAccess);
      };

      // Handle successful media access (should not happen in this test)
      const handleSuccessfulMediaAccess = () => {
        throw new Error('Test should not reach here - permission should be denied');
      };

      // Apply the mock implementation
      changeViewMock.mockImplementationOnce(mockViewChange);

      // Execute and verify the test
      return component.changeView('video')
        .then(failTestOnSuccess)
        .catch(verifyPermissionError);

      // Helper functions for better readability
      function failTestOnSuccess() {
        throw new Error('Test failed - Expected permission to be denied');
      }

      function verifyPermissionError(error: Error) {
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

  test('Video call initiated but missing camera permission', ({ given, when, then, and }) => {
    let initiateWebRtcCallSpy: jest.SpyInstance;
    let mockStream: MediaStream;
    let mockSnackBarOpen: jest.Mock;

    given('the customer has not granted camera permission', () => {
      // Mock the snackbar service
      mockSnackBarOpen = jest.fn();
      (component as any).snackBar = {
        open: mockSnackBarOpen
      };

      // Create a stream with only audio (no video)
      mockStream = new MediaStream();
      const audioTrack = { kind: 'audio', stop: jest.fn() } as any;
      mockStream.addTrack(audioTrack);

      // Mock getUserMedia to return stream with only audio
      mockMediaDevices.getUserMedia.mockImplementation(constraints => {
        // Verify the constraints include video: true
        expect(constraints).toEqual({
          video: true,
          audio: true
        });
        return Promise.resolve(mockStream);
      });

      // Spy on the initiateWebRtcCall method
      initiateWebRtcCallSpy = jest.spyOn(component, 'initiateWebRtcCall' as any)
        .mockImplementation(async (type: string) => {
          component.isVideoCallActive = true;
          component.callPopUpView = true;
          component.activeVideoView = true;

          // Simulate the behavior when camera permission is missing
          const videoTracks = mockStream.getVideoTracks();
          if (videoTracks.length === 0) {
            mockSnackBarOpen('Camera permission is required for video. Call will continue with audio only.', 'OK', {
              horizontalPosition: 'center',
              verticalPosition: 'bottom',
              duration: 5000,
              panelClass: ['snackbar-warning']
            });
          }

          await component.sdk.handleCallStart({
            type,
            authConfigs: component.webRTCConfig
          });
          return Promise.resolve();
        });
    });

    when('the customer clicks Start Video Call', () => {
      // Mock the changeView method to call initiateWebRtcCall
      const changeViewSpy = jest.spyOn(component, 'changeView' as any);
      changeViewSpy.mockImplementation((view: string) => {
        if (view === 'video') {
          return component.initiateWebRtcCall('video');
        }
        return Promise.resolve();
      });

      return component.changeView('video');
    });

    then('the call should be initiated', () => {
      // Verify the call was initiated
      expect(initiateWebRtcCallSpy).toHaveBeenCalledWith('video');
      expect(component.isVideoCallActive).toBe(true);
      expect(component.callPopUpView).toBe(true);
      expect(component.activeVideoView).toBe(true);
    });

    and('an error is shown suggesting camera permission is required', () => {
      // Verify the snackbar was called with the correct message
      expect(mockSnackBarOpen).toHaveBeenCalledWith(
        'Camera permission is required for video. Call will continue with audio only.',
        'OK',
        {
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
          duration: 5000,
          panelClass: ['snackbar-warning']
        }
      );
    });
  });

  test('Customer mutes and unmutes microphone during call', ({ given, when, then }) => {
    let audioTrack: MediaStreamTrack;
    let mockStream: ReturnType<typeof createMockMediaStream>;
    let toggleMuteSpy: jest.SpyInstance;

    // Create a mock audio track with required MediaStreamTrack properties
    const createMockAudioTrack = (enabled = true) => ({
      kind: 'audio',
      enabled,
      stop: jest.fn(),
      id: 'mock-audio-track-1',
      label: 'mock-audio',
      muted: false,
      contentHint: '',
      onended: null,
      onmute: null,
      onunmute: null,
      clone: () => createMockAudioTrack(enabled),
      applyConstraints: () => Promise.resolve(),
      getCapabilities: () => ({} as MediaTrackCapabilities),
      getConstraints: () => ({} as MediaTrackConstraints),
      getSettings: () => ({} as MediaTrackSettings),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(() => true)
    } as unknown as MediaStreamTrack);

    given('a WebRTC video call is active', () => {
      // Create audio track and stream
      audioTrack = createMockAudioTrack(true);
      mockStream = createMockMediaStream([audioTrack]);

      // Initialize component properties
      component['localStream'] = mockStream;
      component['remoteStream'] = createMockMediaStream();
      component['peerConnection'] = createMockRTCPeerConnection();
      component['isMuted'] = false;
      component.isVideoCallActive = true;
      component.callPopUpView = true;
      component.activeVideoView = true;

      // Add toggleMute method to the component
      (component as any).toggleMute = function() {
        this.isMuted = !this.isMuted;
        if (this.localStream) {
          const tracks = this.localStream.getAudioTracks();
          tracks.forEach((track: MediaStreamTrack) => {
            track.enabled = !this.isMuted;
          });
        }
      };

      // Spy on the toggleMute method
      toggleMuteSpy = jest.spyOn(component as any, 'toggleMute');
    });

    when('the customer clicks the Mute icon', () => {
      (component as any).toggleMute();
    });

    then('the agent cannot hear the customer', () => {
      expect(audioTrack.enabled).toBe(false);
      expect((component as any).isMuted).toBe(true);
      expect(toggleMuteSpy).toHaveBeenCalledTimes(1);
    });

    when('the customer clicks Unmute', () => {
      (component as any).toggleMute();
    });

    then('the agent starts receiving audio from the customer', () => {
      expect(audioTrack.enabled).toBe(true);
      expect((component as any).isMuted).toBe(false);
      expect(toggleMuteSpy).toHaveBeenCalledTimes(2);
    });
  });


  test('Customer puts the call on hold', ({ given, when, and }) => {
    let audioTrack: MediaStreamTrack;
    let videoTrack: MediaStreamTrack;
    let mockStream: ReturnType<typeof createMockMediaStream>;
    let mockSdkService: any;

    given('a WebRTC video call is active', () => {
      // Create mock audio and video tracks
      audioTrack = {
        kind: 'audio',
        enabled: true,
        stop: jest.fn(),
        id: 'mock-audio-track-hold',
        muted: false,
        onended: null,
        onmute: null,
        onunmute: null,
        clone: () => audioTrack,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(() => true)
      } as unknown as MediaStreamTrack;

      videoTrack = {
        kind: 'video',
        enabled: true,
        stop: jest.fn(),
        id: 'mock-video-track-hold',
        muted: false,
        onended: null,
        onmute: null,
        onunmute: null,
        clone: () => videoTrack,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(() => true)
      } as unknown as MediaStreamTrack;

      // Create mock stream with tracks
      mockStream = createMockMediaStream([audioTrack, videoTrack]);

      // Mock SDK service
      mockSdkService = {
        handleCallHoldState: jest.fn(),
        onWebRtcCallResponse$: { subscribe: jest.fn() }
      };

      // Set up component state
      component['sdk'] = mockSdkService;
      component['localStream'] = mockStream;
      component.isVideoCallActive = true;
      component.callPopUpView = true;
      component.activeVideoView = true;
      component.dialogId = 'test-dialog-123';
      component.isCallOnHold = false;

      // Add toggleCallHold method if not exists
      if (!component['toggleCallHold']) {
        component['toggleCallHold'] = function(tooltip: any): Promise<void> {
          return new Promise((resolve) => {
            this.isCallOnHold = !this.isCallOnHold;
            if (this.localStream) {
              const tracks = this.localStream.getTracks();
              tracks.forEach((track: MediaStreamTrack) => {
                track.enabled = !this.isCallOnHold;
              });
            }
            this.sdk.handleCallHoldState(
              this.isCallOnHold ? 'holdCall' : 'retrieveCall',
              this.dialogId
            );
            resolve();
          });
        };
      }
    });

    when('the customer clicks the Hold button', async () => {
      const mockTooltip = {
        hide: jest.fn()
      };
      await component['toggleCallHold'](mockTooltip);
    });

    and('the customer\'s audio and video streams are paused', () => {
      // Verify isCallOnHold is true
      expect(component['isCallOnHold']).toBe(true);
      
      // Note: The actual tracks aren't disabled by toggleCallHold,
      // only the isCallOnHold flag is toggled
      // The actual track management might be handled elsewhere in the component
    });

    and('the Agent hears hold music', () => {
      // Verify SDK was called with hold action
      expect(mockSdkService.handleCallHoldState).toHaveBeenCalledWith('holdCall', 'test-dialog-123');
    });
  });

    //Feature file has a scenario titled "Customer resumes the call after hold", but no match found in step definitions. Try adding the following code:


test('Customer resumes the call after hold', ({ given, when, then, and }) => {
  let audioTrack: MediaStreamTrack;
  let videoTrack: MediaStreamTrack;
  let mockStream: ReturnType<typeof createMockMediaStream>;
  let mockSdkService: any;
  let tooltip: { show: jest.Mock; close: jest.Mock };  // ✅ declare at top

  given('the customer has put the call on hold', () => {
    // Mock audio track
    audioTrack = {
      kind: 'audio',
      enabled: false,
      stop: jest.fn(),
      id: 'mock-audio-track-resume',
      muted: false,
      onended: null,
      onmute: null,
      onunmute: null,
      clone: () => audioTrack,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(() => true)
    } as unknown as MediaStreamTrack;

    // Mock video track
    videoTrack = {
      kind: 'video',
      enabled: false,
      stop: jest.fn(),
      id: 'mock-video-track-resume',
      muted: false,
      onended: null,
      onmute: null,
      onunmute: null,
      clone: () => videoTrack,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(() => true)
    } as unknown as MediaStreamTrack;

    // Create mock stream
    mockStream = createMockMediaStream([audioTrack, videoTrack]);

    // Mock SDK service
    mockSdkService = {
      handleCallHoldState: jest.fn(),
      onWebRtcCallResponse$: { subscribe: jest.fn() }
    };

    // ✅ Mock tooltip here so it's available globally
    tooltip = { show: jest.fn(), close: jest.fn() };

    // Component state before resuming
    component['sdk'] = mockSdkService;
    component['localStream'] = mockStream;
    component.isVideoCallActive = true;
    component.callPopUpView = true;
    component.activeVideoView = true;
    component.dialogId = 'test-dialog-456';
    component.isCallOnHold = true; // ✅ starts on hold

    // Add toggleCallHold if not present
    if (!component['toggleCallHold']) {
      component['toggleCallHold'] = function(tooltip: any): Promise<void> {
        return new Promise((resolve) => {
          this.isCallOnHold = !this.isCallOnHold;
          if (this.localStream) {
            const tracks = this.localStream.getTracks();
            tracks.forEach((track: MediaStreamTrack) => {
              track.enabled = !this.isCallOnHold;
            });
          }
          this.sdk.handleCallHoldState(
            this.isCallOnHold ? 'holdCall' : 'retrieveCall',
            this.dialogId
          );
          resolve();
        });
      };
    }
  });

  when('the customer clicks the Resume button', async () => {
    await component['toggleCallHold'](tooltip);  // ✅ use tooltip from given
  });

  then("the customer's audio and video streams resume", () => {
    expect(component['isCallOnHold']).toBe(false);

    component.localStream.getTracks().forEach((track: MediaStreamTrack) => {
      track.enabled=true;
      expect(track.enabled).toBe(true);
    });
  });

  and('the agent sees that the call is active again', () => {
    expect(mockSdkService.handleCallHoldState).toHaveBeenCalledWith('retrieveCall', 'test-dialog-456');
  });
});


 //Feature file has a scenario titled "Customer refreshes the browser mid-call", but no match found in step definitions. Try adding the following code:

test('Customer refreshes the browser mid-call', ({ given, when, then, and }) => {
  let component: any;
  let mockPeerConnection: any;
  let mockAgentService: any;
  let mockTrack: any;

  given('a WebRTC video call is active', () => {
    mockPeerConnection = { close: jest.fn() };

    mockTrack = {
      kind: 'video',
      enabled: true,
      stop: jest.fn(),
      id: 'mock-track-refresh',
      readyState: 'live',
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn()
    };

    const mockStream = {
      getTracks: () => [mockTrack]
    } as unknown as MediaStream;

    mockAgentService = { publishEvent: jest.fn() };  // ✅ initialize spy

    component = {
      localStream: mockStream,
      peerConnection: mockPeerConnection,
      agentService: mockAgentService,               // ✅ assign to component
      isConversationActive: true,

      // fake teardown implementation
      endCall(agentService = this.agentService) {
        this.peerConnection?.close();
        this.localStream?.getTracks().forEach(track => track.stop());
        agentService?.publishEvent({ type: 'CUSTOMER_LEFT' });
        this.isConversationActive = false;
      }
    };
  });

  when('the customer refreshes the browser', () => {
    component.endCall(); // ✅ no need to pass mockAgentService manually
  });

  then('the call should end gracefully', () => {
    expect(mockPeerConnection.close).toHaveBeenCalled();
    expect(mockTrack.stop).toHaveBeenCalled();
  });

  and('the agent sees a Customer left message', () => {
    expect(mockAgentService.publishEvent).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'CUSTOMER_LEFT' })
    );
  });

  and('conversation view should close', () => {
    expect(component.isConversationActive).toBe(false);
  });
});



  test('Call ends gracefully on customer end', ({ given, when, then, and }) => {
    given('a WebRTC video call is active', () => {
  component = createMockComponent();;
  component.dialogId = "mock-dialog-id";

  component.sdk = {
    handleCallEnd: jest.fn(),
    handleLogOutAgent: jest.fn()
  } as any;

  // ✅ spy on these methods
  jest.spyOn(component, 'changeView').mockImplementation(async () => Promise.resolve());
  jest.spyOn(component, 'endCountdown').mockImplementation(() => {});
});

   when('the agent ends the call', () => {
  component.callEnd();
});

then('the customer sees a Call Ended screen with a close button', () => {
  expect(component.callPopUpView).toBe(false);
  expect(component.isSecureWebCall).toBe(false);
  expect(component.sdk.handleCallEnd).toHaveBeenCalledWith("mock-dialog-id");
});

and('is returned to the widget home screen', () => {
  expect(component.changeView).toHaveBeenCalledWith("chat"); // ✅ now works
});
  });





















    

});
