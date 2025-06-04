Feature: WebRTC Video Channel for Customer-Agent Communication
  As a customer, I want to seamlessly initiate a video call from the widget
  So that I can engage in real-time, face-to-face communication with a live agent for better support

  Scenario: Agent answers a video call
    Given an incoming WebRTC video call is received
    And the agent grants microphone and camera permission
    When the agent clicks Answer
    Then the call should connect with audio and video streams enabled

  