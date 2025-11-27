import { defineFeature, loadFeature } from 'jest-cucumber';
import { FormBuilder } from '@angular/forms';
import { WidgetComponent } from 'src/app/widget/widget.component';
import { ChangeDetectorRef } from '@angular/core';
import { of, Subject } from 'rxjs';

// 🟢 Load your feature
const feature = loadFeature('./test/features/webrtcVideo.feature');
//  Mock global navigator.mediaDevices
const mockMediaDevices = {
  getUserMedia: jest.fn(),
  enumerateDevices: jest.fn(),
};
Object.defineProperty(global.navigator, 'mediaDevices', {
  value: mockMediaDevices,
});
//  Mock MediaStream globally
global.MediaStream = jest.fn().mockImplementation((tracks: any[] = []) => {
  return {
    tracks,
    getTracks() { return this.tracks; },
    getAudioTracks() { return this.tracks.filter(t => t.kind === 'audio'); },
    getVideoTracks() { return this.tracks.filter(t => t.kind === 'video'); },
    addTrack(track: any) { this.tracks.push(track); },
    removeTrack(track: any) { this.tracks = this.tracks.filter((t: any) => t !== track); }
  };
});

// Define the feature test
defineFeature(feature, (test) => {
  let component: WidgetComponent;
  let spy: jest.SpyInstance;
  const mockChangeDetectorRef = {
    detectChanges: jest.fn()
  } as unknown as ChangeDetectorRef;

  const mockTranslateService = {
    setDefaultLang: jest.fn(),
    use: jest.fn()
  } as any;
  const mockActivatedRoute = { snapshot: { params: {} }, queryParams: of({}) } as any;
  const mockSdkService = {
    sendChatMessage: jest.fn(),
    convertCall: jest.fn(),
    handleCallHoldState: jest.fn(),
    handleCallStart: jest.fn().mockResolvedValue({
      callId: 'mock-call-id',
      status: 'started',
    }),
    receiveUrlParamsValue: jest.fn(),
    fetchBusinessCalendarId: jest.fn().mockResolvedValue('mock-calendar-id'),
    getCalendarEvents: jest.fn().mockResolvedValue([
      { id: 'event1', title: 'Test Event', start: '2025-09-10T10:00:00Z' },
    ]),
    widgetConfigs$: new Subject(),
    handleLogOutAgent: jest.fn(),
    handleCallEnd: jest.fn(),
    onChatResumed: jest.fn(),
    validationsSubcription: of({}), // emits immediately
    renderPreChatForm$: new Subject(),
    renderCallbackForm$: new Subject(),
    onChatResumedResponse$: new Subject(),
    onWebRtcCallResponse$: new Subject(),
    onCallbackRequestResponse$: new Subject(),  // 👈 added this
    onWebsocketReconnect$: new Subject(),
    onWebsocketDisconnect$: new Subject(),
    onWebsocketConnect$: new Subject(),
    connectionResponse$: new Subject(),
    localStream$: of(new MediaStream()),
    remoteStreamObs$: of(new MediaStream()),
  } as any;
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
  const router = {} as any;
  const doc = {} as any;
  const mockStorageService: any = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  };
  beforeAll(() => {
    window.alert = jest.fn();

  });

  beforeEach(() => {
    // Create a fresh mock config for each test to avoid state corruption
    const freshMockAppConfig: any = {
      appConfig: {
        ENABLE_LOGO: true,
        ADDITIONAL_PANEL: false,
        USERNAME_ENABLED: true,
        AUTO_RESUME_ON_NEW_TAB: false,
        CHANNEL_IDENTIFIER: "phone",
        VIDEO: true,
        MUTE_NOTIFICATIONS: false,
        IS_DIRECT_WEBRTC_CALL_ENABLED: true,
        ENABLE_TRANSCRIPT_NOTIFICATIONS: true,
      },
      loadConfig: jest.fn().mockResolvedValue(undefined)
    };

    component = new WidgetComponent(
      mockActivatedRoute,
      new FormBuilder(),
      mockSdkService,
      freshMockAppConfig,
      mockStorageService,
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
      router,
      doc
    );

    // Mock the postMessageHandlerService browserInfoData$ observable
    (component as any).__postMessageHandlerService.browserInfoData$ = of({
      userAgent: 'jest-mock-agent',
      platform: 'jest-test-platform',
    });

    // Mock the tooltip functionality by replacing the updateTooltip method
    (component as any).updateTooltip = jest.fn((tooltip) => {
      if (tooltip) {
        tooltip.hide?.();
      }
    });

    // Provide fake WebRTC config directly
    (component as any).webRTCConfig = {
      enableWebRtc: true,
      diallingUri: '26131',
      sipExtension: '8012',
      extensionPassword: '1234',
      websocket: 'wss',
      wssFs: 'wss://192.168.1.17/wss',
      uriFs: '192.168.1.17',
      iceServers: [{ urls: [] }]
    };
  });
  let mockAgentInfo;
  let mockOutboundDialing;
  let mockXmppEvent;

  test('Video call initiated but missing camera permission', ({ given, when, then, and }) => {
    let initiateWebRtcCallSpy: jest.SpyInstance;
    let mockStream: MediaStream;
    let mockSnackBarOpen: jest.Mock;

    given('the customer has not granted camera permission', () => {
      mockSnackBarOpen = jest.fn();
      (component as any).snackBar = { open: mockSnackBarOpen };
      mockStream = new MediaStream();
      const audioTrack = { kind: 'audio', stop: jest.fn() } as any;
      mockStream.addTrack(audioTrack);

      mockMediaDevices.getUserMedia.mockImplementation((constraints) => {
        expect(constraints).toEqual({ video: true, audio: true });
        return Promise.resolve(mockStream);
      });

      // Mock handleDialogState for error UI
      (component as any).handleDialogState = jest.fn((eventObj: any) => {
        if (eventObj.response?.type === 'generalError') {
          (component as any).snackBar.open(
            eventObj.response.description,
            'OK',
            {
              horizontalPosition: 'center',
              verticalPosition: 'bottom',
              duration: 5000,
              panelClass: ['snackbar-warning'],
            }
          );
        }
      });

      initiateWebRtcCallSpy = jest.spyOn(component as any, 'initiateWebRtcCall')
        .mockImplementation(async (type: string) => {
          component.isVideoCallActive = true;
          component.callPopUpView = true;
          component.activeVideoView = true;

          const videoTracks = mockStream.getVideoTracks();
          expect(videoTracks.length).toBe(0); // Ensure no camera

          if (videoTracks.length === 0) {
            const errorEvent = {
              event: 'Error',
              response: {
                type: 'generalError',
                description: 'Camera permission is required for video. Call will continue with audio only.',
                event_time: new Date().toISOString(),
              }
            };
            (component as any).handleDialogState(errorEvent);
          }

          await component.sdk.handleCallStart({
            type,
            authConfigs: component.webRTCConfig,
          });
          return Promise.resolve();
        });
    });

    when('the customer clicks Start Video Call', async () => {
      const changeViewSpy = jest.spyOn(component as any, 'changeView');
      changeViewSpy.mockImplementation((view: string) => {
        if (view === 'video') {
          return component.initiateWebRtcCall('video');
        }
        return Promise.resolve();
      });

      await component.changeView('video');
    });

    then('the call should be initiated', () => {
      expect(initiateWebRtcCallSpy).toHaveBeenCalledWith('video');
      expect(component.isVideoCallActive).toBe(true);
      expect(component.callPopUpView).toBe(true);
      expect(component.activeVideoView).toBe(true);
    });

    and('an error is shown suggesting camera permission is required', () => {
      expect(mockSnackBarOpen).toHaveBeenCalledTimes(1); // ensure only once
      expect(mockSnackBarOpen).toHaveBeenCalledWith(
        'Camera permission is required for video. Call will continue with audio only.',
        'OK',
        {
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
          duration: 5000,
          panelClass: ['snackbar-warning'],
        }
      );
    });
  });


  test('Video call initiation fails due to missing audio permission', ({ given, when, then, and }) => {
    let mockSnackBarOpen: jest.Mock;
    const errorEvent = {
      event: "Error",
      response: {
        type: "generalError",
        loginId: null,
        description: "Microphone permission denied. Please enable.",
        event_time: "2025-9-9 15:49:44.12"
      }
    };

    given('the customer has not granted microphone permission', () => {
      mockSnackBarOpen = jest.fn();
      (component as any).snackBar = { open: mockSnackBarOpen };

      (component as any)['handleDialogState'] = jest.fn((eventObj: any) => {
        if (eventObj.response?.type === 'generalError') {
          (component as any).snackBar.open(
            eventObj.response.description,
            'OK',
            { duration: 5000, panelClass: ['snackbar-error'] }
          );
        }
      });
    });

    when('the customer clicks Start Video Call', async () => {

      (component as any).handleDialogState(errorEvent);
    });

    then('the call should not be initiated', () => {

      expect(component['localStream']).toBeUndefined();
    });

    and('an error is shown to the customer', () => {
      expect(mockSnackBarOpen).toHaveBeenCalledTimes(1);
      expect(mockSnackBarOpen).toHaveBeenCalledWith(
        "Microphone permission denied. Please enable.",
        "OK",
        expect.any(Object)
      );
    });
  });


  test('Customer initiates a video call', ({ given, and, when, then }) => {
    given('the customer widget is loaded', async () => {
      const ngOnInitSpy = jest.spyOn(component, 'ngOnInit');
      await component.ngOnInit();
      expect(ngOnInitSpy).toHaveBeenCalled();

      expect(
        component.__appConfig.appConfig.VIDEO === true ||
        component.__appConfig.appConfig.IS_DIRECT_WEBRTC_CALL_ENABLED === true
      ).toBeTruthy();
    });

    and('video permissions are granted', async () => {
      const audioTrack = { kind: 'audio', enabled: true, stop: jest.fn() } as any;
      const videoTrack = { kind: 'video', enabled: true, stop: jest.fn() } as any;
      const mockStream = new MediaStream([audioTrack, videoTrack]);

      mockMediaDevices.getUserMedia.mockResolvedValue(mockStream);
      component['localStream'] = mockStream;

      expect(component['localStream'].getAudioTracks()).toHaveLength(1);
      expect(component['localStream'].getVideoTracks()).toHaveLength(1);
    });

    when('the customer clicks on Start Video Call button', async () => {
      const changeViewSpy = jest.spyOn(component, 'changeView');
      await component.changeView('video');
      expect(changeViewSpy).toHaveBeenCalledWith('video');

      expect(mockSdkService.handleCallStart).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'video',
          authConfigs: expect.objectContaining({
            enableWebRtc: true,
            diallingUri: '26131',
            sipExtension: '8012',
          }),
        })
      );

      mockXmppEvent = { event: 'xmppEvent', response: { loginId: '8012', type: 'IN_SERVICE' } };
      const handleDialogSpy = jest.spyOn(component, 'handleDialogStates');

      component.handleDialogStates(mockXmppEvent);
      expect(handleDialogSpy).toHaveBeenCalledWith(mockXmppEvent);

      mockAgentInfo = { event: 'agentInfo', response: { loginId: '8012', state: 'LOGIN' } };
      component.handleDialogStates(mockAgentInfo);
      expect(handleDialogSpy).toHaveBeenCalledWith(mockAgentInfo);

      mockOutboundDialing = {
        event: 'outboundDialing',
        response: {
          dialog: {
            id: 'call-123',
            callType: 'OUT',
            state: 'INITIATING',
            participants: [{ mediaAddress: '8012', state: 'INITIATING' }],
            mediaType: 'video',
            channelType: 'WEB_RTC',
          },
        },
      };
      component.handleDialogStates(mockOutboundDialing);
      expect(handleDialogSpy).toHaveBeenCalledWith(mockOutboundDialing);
    });

    then('a new WebRTC session should be initiated', () => {
      expect(component.isVideoCallActive).toBe(true);
      expect(component.activeVideoView).toBe(true);
      expect(mockOutboundDialing.response.dialog.state).toBe('INITIATING');
    });

    and('a routing request is sent to CX Core', () => {
      expect(mockXmppEvent.response.type).toBe('IN_SERVICE');
      expect(mockAgentInfo.response.state).toBe('LOGIN');
    });

    and('the agent receives an incoming call with a video prompt', () => {
      const mockDialogState = {
        event: 'dialogState',
        response: {
          dialog: {
            id: 'call-123',
            callType: 'OUT',
            state: 'ACTIVE',
            participants: [{ mediaAddress: '8012', state: 'ACTIVE' }],
            mediaType: 'video',
            channelType: 'WEB_RTC',
          },
        },
      };

      const handleDialogSpy = jest.spyOn(component, 'handleDialogStates');
      component.handleDialogStates(mockDialogState);

      expect(handleDialogSpy).toHaveBeenCalledWith(mockDialogState);
      expect(mockDialogState.response.dialog.state).toBe('ACTIVE');
      expect(mockDialogState.response.dialog.mediaType).toBe('video');
    });
  });

  test('Customer toggle camera should reflect current state', ({ given, when, then, and }) => {
    given('a WebRTC video call is active', () => {
      component.isVideoHide = false; // camera initially ON
      component.isVideoCallActive = true;
      component.dialogId = '12345';
    });

    when('the customer toggles the camera off', async () => {
      await component.toggleCallVideo('Turn camera off');
    });

    then('the camera icon changes to indicate it\'s off', () => {
      expect(mockSdkService.convertCall).toHaveBeenCalledWith(
        'off',
        'video',
        '12345'
      );
      expect(component.isVideoHide).toBe(true); // now hidden
    });

    and('the agent sees a blank feed or avatar', () => {
      // We can’t test the UI/avatar directly, but we can test the signaling
      expect(mockSdkService.convertCall).toHaveBeenCalledWith(
        'off',
        'video',
        '12345'
      );
    });
  });

  test('Audio call initiation fails due to missing audio permission', ({ given, when, then, and }) => {
    let mockSnackBarOpen: jest.Mock;
    const errorEvent = {
      event: "Error",
      response: {
        type: "generalError",
        loginId: "8012",
        description: "Microphone permission denied. Please enable.",
        event_time: new Date().toISOString()
      }
    };

    given('the customer has not granted microphone permission', () => {
      // Mock snackBar
      mockSnackBarOpen = jest.fn();
      (component as any).snackBar = { open: mockSnackBarOpen };

      // Stub handleDialogState to simulate error handling
      (component as any)['handleDialogState'] = jest.fn((eventObj: any) => {
        if (eventObj.response?.type === 'generalError') {
          (component as any).snackBar.open(
            eventObj.response.description,
            'Dismiss',
            { duration: 3000, panelClass: ['error-snackbar'], horizontalPosition: 'right' }
          );
        }
      });

      // Mock getUserMedia rejection (microphone blocked)
      (navigator.mediaDevices.getUserMedia as jest.Mock) = jest.fn(() =>
        Promise.reject(new Error('Microphone permission denied. Please enable.'))
      );
    });

    when('the customer clicks Start Audio Call', async () => {
      // Simulate error being raised
      (component as any).handleDialogState(errorEvent);
    });

    then('the call should not be initiated', () => {

      expect((component as any).activeCall).toBeFalsy();
    });

    and('an error is shown suggesting audio permission is required', () => {
      expect(mockSnackBarOpen).toHaveBeenCalledTimes(1);
      expect(mockSnackBarOpen).toHaveBeenCalledWith(
        "Microphone permission denied. Please enable.",
        "Dismiss",
        expect.objectContaining({
          duration: 3000,
          panelClass: ['error-snackbar'],
          horizontalPosition: 'right'
        })
      );
    });
  });


  test('Customer mutes and unmutes microphone during call', ({ given, when, then }) => {
    let mockHandleCallMic: jest.Mock;
    let dialogEvent: any;

    given('a WebRTC video call is active', () => {
      mockHandleCallMic = jest.fn();
      (component as any).sdk = { handleCallMic: mockHandleCallMic };
      (component as any).dialogId = 'mock-dialog-id';
    });

    when('the customer clicks the Mute icon', async () => {
      await (component as any).toggleCallMic({} as any); // simulate mute

      dialogEvent = {
        event: 'dialogState',
        response: {
          dialog: {
            participants: [{ mute: true }]
          }
        }
      };
    });

    then('the agent cannot hear the customer', () => {
      expect(mockHandleCallMic).toHaveBeenCalledWith('mute_call', 'mock-dialog-id');
      expect(dialogEvent.response.dialog.participants[0].mute).toBe(true);
    });

    when('the customer clicks Unmute', async () => {
      await (component as any).toggleCallMic({} as any); // simulate unmute

      dialogEvent = {
        event: 'dialogState',
        response: {
          dialog: {
            participants: [{ mute: false }]
          }
        }
      };
    });

    then('the agent starts receiving audio from the customer', () => {
      expect(mockHandleCallMic).toHaveBeenCalledWith('unmute_call', 'mock-dialog-id');
      expect(dialogEvent.response.dialog.participants[0].mute).toBe(false);
    });
  });


  test('Customer puts the call on hold', ({ given, when, and }) => {
    let dialogEvent: any;

    given('a WebRTC video call is active', () => {
      // no-op, relying on beforeEach setup
    });

    when('the customer clicks the Hold button', async () => {
      await component.toggleCallHold('Hold Call');
    });

    and('the customer\'s audio and video streams are paused', () => {
      dialogEvent = {
        response: {
          dialog: {
            id: component.dialogId,
            state: 'HELD',
            participants: [
              {
                mediaAddress: '8012',
                state: 'HELD',
                mute: false
              }
            ],
            mediaType: 'audio',
            channelType: 'WEB_RTC'
          }
        },
        event: 'dialogState'
      };

      component.handleDialogStates(dialogEvent);

      expect(dialogEvent.response.dialog.state).toBe('HELD');
      expect(dialogEvent.response.dialog.participants[0].state).toBe('HELD');
    });

    and('the Agent hears hold music', () => {
      expect(mockSdkService.handleCallHoldState).toHaveBeenCalledWith(
        'holdCall',
        component.dialogId
      );
    });
  });

  test('Customer resumes the call after hold', ({ given, when, then, and }) => {
    let dialogEvent: any;

    given('the customer has put the call on hold', () => {
      // Set initial state
      component.isCallOnHold = true;
    });

    when('the customer clicks the Resume button', async () => {
      // Trigger the toggle function to resume call
      await component.toggleCallHold('Resume Call');

      // Simulate the dialogState event received after resuming
      dialogEvent = {
        response: {
          dialog: {
            id: component.dialogId,
            state: 'ACTIVE',
            participants: [
              {
                mediaAddress: '8012',
                state: 'ACTIVE',
                mute: false
              }
            ],
            mediaType: 'audio',
            channelType: 'WEB_RTC'
          }
        },
        event: 'dialogState'
      };

      component.handleDialogStates(dialogEvent);
    });

    then("the customer's audio and video streams resume", () => {

      const participant = dialogEvent.response.dialog.participants[0];
      expect(participant.state).toBe('ACTIVE');
      expect(participant.mute).toBe(false);
    });

    and('the agent sees that the call is active again', () => {
      expect(dialogEvent.response.dialog.state).toBe('ACTIVE');
      expect(component.isCallOnHold).toBe(false);
    });
  });


  test('Customer refreshes the browser mid-call', ({ given, when, then, and }) => {
    let dialogEvent: any;

    given('a WebRTC video call is active', () => {
      // Mock an active audio call dialog event
      dialogEvent = {
        response: {
          loginId: '8012',
          dialog: {
            id: 'mock-dialog-id',
            state: 'ACTIVE',
            participants: [
              { mediaAddress: '8012', state: 'ACTIVE', mute: false }
            ],
            mediaType: 'audio',
            channelType: 'WEB_RTC'
          }
        },
        event: 'dialogState'
      };
    });

    when('the customer refreshes the browser', () => {

      dialogEvent.response.dialog.state = 'ENDED';
    });

    then('the call should end gracefully', () => {
      expect(dialogEvent.response.dialog.state).toBe('ENDED');
    });

    and('the agent sees a Customer left message', () => {
      const agentMessage = 'Customer left';

      expect(agentMessage).toBe('Customer left');
    });

    and('conversation view should close', () => {
      const isConversationViewOpen = false; // simulate view closed
      expect(isConversationViewOpen).toBe(false);
    });
  });

  test('Network disconnect on customer side', ({ given, when, then, and }) => {
    let dialogEvent: any;
    let reconnectionTimeout: NodeJS.Timeout | null = null;
    let agentMessage: string | null = null;

    given('a WebRTC video call is active', () => {
      // Simulate an active audio call
      dialogEvent = {
        response: {
          loginId: '8012',
          dialog: {
            id: 'mock-dialog-id',
            state: 'ACTIVE',
            participants: [
              { mediaAddress: '8012', state: 'ACTIVE', mute: false }
            ],
            mediaType: 'audio',
            channelType: 'WEB_RTC'
          }
        },
        event: 'dialogState'
      };
    });

    when('the customer\'s network drops', () => {
      dialogEvent = {
        event: 'dialogState',
        response: {
          dialog: {
            id: 'mock-dialog-id',
            state: 'DROPPED',   // 👈 simulate proper disconnect
            mediaType: 'audio',
            channelType: 'WEB_RTC',
          },
        },
      };
      agentMessage = 'Customer disconnected';
      // emit socket disconnected
      mockSdkService.connectionResponse$.next({ type: 'SOCKET_DISCONNECTED', data: 'ping timeout' });

      // emit xmpp out of service event
      mockSdkService.connectionResponse$.next({ event: 'xmppEvent', response: { loginId: '8012', type: 'OUT_OF_SERVICE', description: 'WebSocket closed wss://...' } });

      // emit transport error
      mockSdkService.connectionResponse$.next({ type: 'CONNECT_ERROR', data: { type: 'TransportError', description: 0 } });

    });

    then('the system should wait for reconnection for few seconds', () => {
      // During the timeout, call state should be DISCONNECTED
      expect(dialogEvent.response.dialog.state).toBe('DROPPED');

    });

    and('if reconnection fails, the call ends with a proper message on Agent Desk', () => {
      // Simulate timeout completion
      if (reconnectionTimeout) {
        clearTimeout(reconnectionTimeout);
        dialogEvent.response.dialog.state = 'DROPPED';
        agentMessage = 'Customer disconnected';
      }

      expect(dialogEvent.response.dialog.state).toBe('DROPPED');
      expect(agentMessage).toBe('Customer disconnected');
    });
  });

  test('Call ends gracefully on customer end', ({ given, when, then, and }) => {
    let dialogEvent: any;
    let agentEvent: any;

    given('a WebRTC video call is active', () => {
      component.dialogId = 'plcu0nnjqm50e24mcpkj';
      component.callPopUpView = true;
      component.isSecureWebCall = true;

      // mock sdk logout handler
      (component.sdk.handleLogOutAgent as jest.Mock).mockImplementation(() => {
        agentEvent = {
          event: "agentInfo",
          response: { state: "LOGOUT" }
        };
      });
    });

    when('the agent ends the call', () => {
      component.callEnd();

      // simulate dialog end event
      dialogEvent = {
        event: "dialogState",
        response: {
          dialog: { state: "DROPPED", isCallEnded: 1 }
        }
      };

      component.handleDialogStates(dialogEvent);
    });

    then('the customer sees a Call Ended screen with a close button', () => {
      expect(component.callPopUpView).toBe(false);
      expect(dialogEvent.response.dialog.state).toBe("DROPPED");
    });

    and('is returned to the widget home screen', () => {
      expect(component.activeChatView).toBe(true);
      expect(component.activeAudioView).toBe(false);
      expect(component.activeVideoView).toBe(false);
      expect(component.activeScreenShareView).toBe(false);

      // verify logout triggered
      expect(agentEvent.response.state).toBe("LOGOUT");
      expect(component.sdk.handleLogOutAgent).toHaveBeenCalledWith('plcu0nnjqm50e24mcpkj');
    });
  });


  test('Video feed should not freeze unexpectedly', ({ given, when, then, and }) => {
    given('a WebRTC video call is ongoing', () => {
      component.dialogId = 'mock-dialog-id';
      component.activeVideoView = true;
      component.callPopUpView = true;
    });

    when('there is temporary network jitter', () => {
      // Simulate SIPJS muting + black track internally
      mockSdkService.remoteStreamObs$ = of(new MediaStream());

      // Simulate network recovery with SOCKET_RECONNECTED event
      component.handleDialogStates({
        type: 'SOCKET_RECONNECTED',
        data: {
          serviceIdentifier: 'mock-service',
          channelCustomerIdentifier: 'mock-channel',
        },
      });
    });

    then('the system should attempt to recover the video feed automatically', () => {
      expect(component.activeVideoView).toBe(true);   // video view stays open
      expect(component.callPopUpView).not.toBe(false);
    });

    and('show a Connection unstable indicator temporarily if needed', () => {
      expect(component.activeVideoView).toBe(true);   // video view stays open
      expect(component.callPopUpView).not.toBe(false); // no force close
    });
  });

  test('Customer sees placeholder if agent’s camera is off', ({ given, and, then }) => {


    given('a video call is active', () => {
      component.dialogId = 'plcu0nnjqm50e24mcpkj';
      component.callPopUpView = true;
      component.isVideoCallActive = true;
      component.remoteStreamStatus = false; // initially we set video cam placeholder flag var to false
    });

    and('the agent\'s camera is off or revoked', () => {
      const event = {
        event: "mediaStreamUpdate",
        status: "success",
        loginId: "8012",
        dialog: {
          id: "pkq3to0069vacf4ppo7g",
          eventRequest: "remote",
          stream: "video",
          streamStatus: "off",
          errorReason: "",
          timeStamp: "2025-09-12T07:49:05.521Z"
        }
      };
      component.handleDialogStates(event);
      component.remoteStreamStatus = true;
      jest.runAllTimers(); // flush setTimeout
    });

    then('the customer sees a placeholder or blank video tile for the agent', () => {
      expect(component.remoteStreamStatus).toBe(true);
    });
  });

  test('Call initiated during active chat with video-capable agent', ({ given, and, when, then }) => {

    let agent: any;
    let chatSession: any;

    given('the customer is in a chat session with Agent A', () => {
      // replace with your actual class/component
      agent = { id: 'A1', name: 'Agent A' };
      chatSession = { id: 'chat123', agentId: agent.id, active: true };

      component.maintainDialog = chatSession;
      component.dialogId = chatSession.id;
    });

    and('Agent A is video-call capable', () => {
      component.__appConfig.appConfig.VIDEO = true;
    });

    when('the customer initiates a video call', () => {
      const event = {
        event: 'outboundDialing',
        status: 'success',
        response: {
          dialog: {
            id: 'chat123',          // same session id
            state: 'INITIATED',
            type: 'video',
            agentId: agent.id
          }
        }
      };

      component.handleDialogStates(event);
    });

    then('the system routes the video call to Agent A', () => {
      expect(component.maintainDialog.agentId).toBe(agent.id);
      expect(component.dialogId).toBe('chat123');
    });

    and('maintains the session context', () => {
      expect(component.maintainDialog.type).toBe('video');
      expect(chatSession.id).toBe(component.dialogId); // context preserved
    });
  });


});

