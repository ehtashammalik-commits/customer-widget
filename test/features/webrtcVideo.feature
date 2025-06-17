Feature: WebRTC Video Channel for Customer-Agent Communication
  As a customer, I want to seamlessly initiate a video call from the widget
  So that I can engage in real-time, face-to-face communication with a live agent for better support

  Scenario: Customer initiates a video call
    Given the customer widget is loaded
    And video permissions are granted
    When the customer clicks on Start Video Call button
    Then a new WebRTC session should be initiated
    And a routing request is sent to CX Core

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
