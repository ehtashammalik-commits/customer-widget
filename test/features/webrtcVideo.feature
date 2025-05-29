Feature: WebRTC Video Channel for Customer-Agent Communication
  As a customer, I want to seamlessly initiate a video call from the widget
  So that I can engage in real-time, face-to-face communication with a live agent for better support

  Scenario: Customer initiates a video call
    Given the customer widget is loaded
    And video permissions are granted
    When the customer clicks on Start Video Call button
    Then a new WebRTC session should be initiated
    And a routing request is sent to CX Core
    And the agent receives an incoming call with a video prompt

  Scenario: Agent answers a video call
    Given an incoming WebRTC video call is received
    And the agent grants microphone and camera permission
    When the agent clicks Answer
    Then the call should connect with audio and video streams enabled

  Scenario: Agent cannot make CX-Voice MRD ready without mic and camera permissions
    Given the agent is logged into CX Agent Desk
    And the CX-Voice MRD is currently in Not Ready state
    When the agent attempts to make the CX-Voice MRD Ready
    And the browser does not have microphone or camera permissions
    Then the MRD does not transition to Ready
    And an error message is displayed prompting the agent to grant both microphone and camera permissions

  Scenario: Agent revokes mic/camera permissions after making CX-Voice MRD Ready while call is ringing
    Given the agent has granted microphone and camera permissions
    And the CX-Voice MRD is set to Ready
    And an incoming video call is ringing on the Agent Desk
    When the agent revokes microphone
    And camera permission from browser settings during the ringing state
    Then the Answer button remains enabled
    And the agent is allowed to accept the call
    And once the call becomes ACTIVE
    Then agent mic is muted and an error icon appears on the MIC button in the Agent Desk
    And agent video is off and an error icon appears on the CAMERA button in the Agent Desk

  Scenario: Agent revokes camera permission mid-call
    Given a WebRTC video call is active
    When the agent revokes camera access from browser settings
    Then the video stream stops immediately
    And the agent sees a warning on the Enable Camera button that the camera is unavailable
    And CX-Voice mrd is set to Not-Ready

  Scenario: Agent Toggle camera during call
    Given a WebRTC video call is active
    When the agent clicks the Camera Off icon
    Then their camera stream should be disabled
    And the customer sees a fallback avatar or blank feed

  Scenario: Customer toggle camera should reflect current state
    Given a WebRTC video call is active
    When the customer toggles the camera off
    Then the camera icon changes to indicate it's off
    And the agent sees a blank feed or avatar

  Scenario: Chat is active before a video call
    Given a chat session is active with Agent A
    When the customer initiates a video call
    Then the system checks if Agent A has the capability to handle video calls
    And if Agent A is capable, the video call rings on Agent A
    And if Agent A is not capable, the entire conversation chat
    And video is routed to an available agent with video capability

  Scenario: Audio call initiation fails due to missing audio permission
    Given the customer has not granted microphone permission
    When the customer clicks Start Audio Call
    Then the call should not be initiated
    And an error is shown suggesting audio permission is required

  Scenario: Video call initiation fails due to missing audio permission
    Given the customer has not granted microphone permission
    When the customer clicks Start Video Call
    Then the call should not be initiated
    And an error is shown suggesting audio permission is required

  Scenario: Video call initiated but missing camera permission
    Given the customer has not granted camera permission
    When the customer clicks Start Video Call
    Then the call should be initiated
    And an error is shown suggesting camera permission is required

  Scenario: Agent mutes and unmutes microphone during call
    Given a WebRTC video call is active
    When the agent clicks the Mute icon
    Then the customer's audio feed from agent should stop
    When the agent clicks Unmute
    Then audio from the agent should resume and be heard by the customer

  Scenario: Customer mutes and unmutes microphone during call
    Given a WebRTC video call is active
    When the customer clicks the Mute icon
    Then the agent cannot hear the customer
    When the customer clicks Unmute
    Then the agent starts receiving audio from the customer

  Scenario: Agent puts the call on hold
    Given a WebRTC video call is active
    When the agent clicks the Hold button
    Then the customer hears hold music
    And the agent's video and audio streams are paused
    And the agent sees an indicator that the call is on hold

  Scenario: Agent resumes the call after hold
    Given the call is on hold
    When the agent clicks the Resume button
    Then the customer sees the agent's video feed again
    And audio resumes from both sides
    And the hold indicator disappears from the agent desk

  Scenario: Customer puts the call on hold
    Given a WebRTC video call is active
    When the customer clicks the Hold button
    And the customer's audio and video streams are paused
    And the Agent hears hold music

  Scenario: Customer resumes the call after hold
    Given the customer has put the call on hold
    When the customer clicks the Resume button
    Then the customer's audio and video streams resume
    And the agent sees that the call is active again

  Scenario: Customer refreshes the browser mid-call
    Given a WebRTC video call is active
    When the customer refreshes the browser
    Then the call should end gracefully
    And the agent sees a Customer left message
    And conversation view should close

  Scenario: Agent refreshes the browser mid-call
    Given a WebRTC video call is active
    When the agent refreshes the browser
    Then the call should end for both parties
    And the customer sees a Agent Left message

  Scenario: Network disconnect on customer side
    Given a WebRTC video call is active
    When the customer's network drops
    Then the system should wait for reconnection for 30 seconds
    And if reconnection fails, the call ends with a proper message on Agent Desk

  Scenario: UI reflects call status correctly on agent side
    Given a call is in progress
    When the call is put on hold
    Then the call timer pauses
    And a Call on Hold banner is shown on the agent's UI

  Scenario: Call ends gracefully on customer end
    Given a WebRTC video call is active
    When the agent ends the call
    Then the customer sees a Call Ended screen with a close button
    And is returned to the widget home screen

  Scenario: Call ends gracefully on Agent end
    Given a WebRTC video call is active
    When the customer ends the call
    Then the Agent sees conversation view close

  Scenario: Video feed should not freeze unexpectedly
    Given a WebRTC video call is ongoing
    When there is temporary network jitter
    Then the system should attempt to recover the video feed automatically
    And show a Connection unstable indicator temporarily if needed

  Scenario: Call initiated from audio-only configured widget
    Given the customer widget is configured for audio-only
    When the customer initiates a call
    Then the system treats the call as a WebRTC audio call
    And does not attempt to start video streams

  Scenario: Call initiated during active chat with video-capable agent
    Given the customer is in a chat session with Agent A
    And Agent A is video-call capable
    When the customer initiates a video call
    Then the system routes the video call to Agent A
    And maintains the session context

  Scenario: Customer sees placeholder if agent’s camera is off
    Given a video call is active
    And the agent's camera is off or revoked
    Then the customer sees a placeholder or blank video tile for the agent

  Scenario: Agent sees placeholder if customer's camera is off
    Given a video call is active
    And the customer's camera is off
    Then the agent sees a placeholder in the customer’s video tile






