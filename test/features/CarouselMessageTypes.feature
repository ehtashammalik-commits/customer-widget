Feature: Customer Widget Carousal Message Types Support

  Scenario: Customer selects a button from the carousel
    Given the customer is in an active conversation with the bot
    When the customer receives a carousel message
    And the customer selects a button from a carousel card
    And the customer submits their selection
    Then the selected button should be shown as a quoted reply in the conversation

  Scenario: Customer selects a list from the carousel
    Given the customer is in an active conversation with the bot
    When the customer receives a carousel message
    And the customer selects a list item from a carousel card
    And the customer submits their selection
    Then the selected list item should be shown as a quoted reply

  Scenario: Successful carousel response with clickable URL
    Given the customer is in an active conversation with the bot
    When the customer receives a carousel message from the bot with a card containing a URL
    Then the customer should be able to click on the URL
    And the URL should open in a new browser tab or window
    And the URL should remain clickable

  Scenario: Customer attempts to respond to carousel after submitting
   Given the customer has already responded to the carousel message
   When the customer tries to interact with the carousel again
   Then the carousel message should be disabled for further input
   And the quoted reply should be visually associated with the carousel card

  Scenario: Customer refreshes the browser after submits the carousel response
    Given the customer has submitted a carousel response
    When the customer refreshes the customer widget browser
    Then the submitted carousel response should be displayed as non interactive
  


