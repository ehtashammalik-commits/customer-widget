Feature: Customer Widget Form Message Types Support
  
  Scenario: Customer fills and submits a form
    Given the customer is in an active conversation with the bot
    When the customer receives a form message
    And the customer fills in all required fields
    And the customer submits the form
    Then the customer should see the submitted form data in the conversation with all filled entries
    And the submitted form should be displayed as non-interactive
  
  Scenario: Customer submits an incomplete form
    Given the customer receives a form message
    When the customer tries to submit the form without filling all required fields
    Then a validation error message should be displayed indicating that all required fields must be filled
    And the customer should not be able to submit the form

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

