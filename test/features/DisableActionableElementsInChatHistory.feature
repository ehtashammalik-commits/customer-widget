Feature: Disable Actionable Elements in Chat History

Scenario: Disable actionable elements when disableInteraction is set to true
Given the controller sends a message containing actionable elements
And the message includes the flag disableInteraction set to true
When the customer sends a new message
Then all actionable elements in previous messages should be disabled
And those elements should no longer trigger any actions
And those elements should be visually indicated as greyed out

Scenario: Persistence of Disabled State of Actionable Elements
Given the controller sends a message containing actionable elements
And the message includes the flag disableInteraction set to true
And the elements are subsequently disabled after a user interaction
And the customer refreshes their browser session
Then the previously disabled actionable elements in the chat history should remain visually disabled
And clicking on them should still not trigger any action

Scenario: Persistence of Enabled State of Actionable Elements
Given the controller sends a message containing actionable elements
And the message includes the flag disableInteraction set to true
And the customer refreshes their browser session
Then the previously enabled actionable elements in the chat history should remain visually enabled
And clicking on them should trigger an action