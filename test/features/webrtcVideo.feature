Feature: WebRTC Video Channel for Customer-Agent Communication
  As a customer, I want to seamlessly initiate a video call from the widget
  So that I can engage in real-time, face-to-face communication with a live agent for better support

    Scenario: Video call initiated but missing camera permission
    Given the customer has not granted camera permission
    When the customer clicks Start Video Call
    Then the call should be initiated
    And an error is shown suggesting camera permission is required

   Scenario: Video call initiation fails due to missing audio permission
   Given the customer has not granted microphone permission
   When the customer clicks Start Video Call
   Then the call should not be initiated
   And an error is shown to the customer

   Scenario: Customer initiates a video call
  Given the customer widget is loaded
  And video permissions are granted
  When the customer clicks on Start Video Call button
  Then a new WebRTC session should be initiated
  And a routing request is sent to CX Core
  And the agent receives an incoming call with a video prompt

  Scenario: Customer toggle camera should reflect current state
  Given a WebRTC video call is active
  When the customer toggles the camera off
  Then the camera icon changes to indicate it's off
  And the agent sees a blank feed or avatar

  Scenario: Audio call initiation fails due to missing audio permission
  Given the customer has not granted microphone permission
  When the customer clicks Start Audio Call
  Then the call should not be initiated
  And an error is shown suggesting audio permission is required

  Scenario: Customer mutes and unmutes microphone during call
  Given a WebRTC video call is active
  When the customer clicks the Mute icon
  Then the agent cannot hear the customer
  When the customer clicks Unmute
  Then the agent starts receiving audio from the customer

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

  Scenario: Network disconnect on customer side
  Given a WebRTC video call is active
  When the customer's network drops
  Then the system should wait for reconnection for few seconds
  And if reconnection fails, the call ends with a proper message on Agent Desk

  Scenario: Call ends gracefully on customer end
  Given a WebRTC video call is active
  When the agent ends the call
  Then the customer sees a Call Ended screen with a close button
  And is returned to the widget home screen

  Scenario: Video feed should not freeze unexpectedly
  Given a WebRTC video call is ongoing
  When there is temporary network jitter
  Then the system should attempt to recover the video feed automatically
  And show a Connection unstable indicator temporarily if needed

  Scenario: Customer sees placeholder if agent’s camera is off
  Given a video call is active
  And the agent's camera is off or revoked
  Then the customer sees a placeholder or blank video tile for the agent

  Scenario: Call initiated during active chat with video-capable agent
  Given the customer is in a chat session with Agent A
  And Agent A is video-call capable
  When the customer initiates a video call
  Then the system routes the video call to Agent A
  And maintains the session context