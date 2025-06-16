Feature: WebRTC Video Channel for Customer-Agent Communication
  As a customer, I want to seamlessly initiate a video call from the widget
  So that I can engage in real-time, face-to-face communication with a live agent for better support

  Scenario: Customer initiates a video call
    Given the customer widget is loaded
    And video permissions are granted
    When the customer clicks on Start Video Call button
    Then a new WebRTC session should be initiated
    And a routing request is sent to CX Core
