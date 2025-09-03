import { defineFeature, loadFeature } from 'jest-cucumber';
const feature = loadFeature('./test/features/sample.feature');

defineFeature(feature, (test) => {
  test('Entering a correct password', ({ given, when, then }) => {
    given('I have previously created a password', () => {});

    when('I enter my password correctly', () => {});

    then('I should be granted access', () => {});
  });
});
