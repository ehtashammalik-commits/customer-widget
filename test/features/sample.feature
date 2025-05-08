Feature: User Login

  As a registered user
  I want to log into the system
  So that I can access protected resources

  Scenario: Successful login with valid credentials
    Given I am on the login page
    When I enter valid credentials
    Then I should see the dashboard