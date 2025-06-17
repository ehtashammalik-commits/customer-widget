 Feature: Customer Widget ClickableList Message Types Support

 Scenario: Customer selects a text option from the list
    Given the customer is in an active conversation with the bot
    When the customer receives a list message with text options
    And the customer selects a text option
    Then the selected option text should appear as a text in the chat
    And the list message should become non interactive

  Scenario: Customer selects an image option from the list
   Given the customer is in an active conversation with the bot
   When the customer receives a list message with image options
   And the customer selects an image option
   Then the selected image should be displayed as an image in the chat
   And the list message should become non interactive

  Scenario: Attempting to select multiple options after one selection
   Given the customer is in an active conversation with the bot
   And the customer receives a list message from the bot
   And the customer has already selected an option from the list
   When the customer attempts to click another option in the list
   Then the customer should not be able to select another option after the initial selection
   And the list message should become non interactive
