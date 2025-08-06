import { ChangeDetectorRef } from '@angular/core';
import { ComponentFixture } from '@angular/core/testing';
import { defineFeature, loadFeature } from 'jest-cucumber';

import { WidgetComponent } from 'src/app/widget/widget.component';
const feature = loadFeature('./test/features/FormMessageType.feature');

defineFeature(feature, (test) => {
  let component: WidgetComponent;
  let spy: jest.SpyInstance;
  beforeEach(() => {
    const mockChangeDetectorRef = {
      detectChanges: jest.fn(),
    } as unknown as ChangeDetectorRef;

    const mockTranslateService = {
      setDefaultLang: jest.fn(),
      use: jest.fn(),
    } as any;
    const mockActivatedRoute = { snapshot: { params: {} } } as any;
    const mockFormBuilder = { group: jest.fn() } as any;

    const mockSdkService = {
      sendChatMessage: jest.fn(),
      setConversationDataAgainstCustomerIdentifier: jest.fn(),
      postFormDataAsActivity: jest.fn(),
    } as any;

    const mockAppConfig = {
      appConfig: {
        ENABLE_LOGO: true,
        ADDITIONAL_PANEL: false,
        USERNAME_ENABLED: true,
      },
    } as any;
    const mockElementRef = {} as any;
    const mockRenderer2 = {} as any;
    const mockSanitizer = {} as any;
    const mockSnackBar = {} as any;
    const mockDialog = {} as any;
    const mockBrowserNotificationService: any = {
      notify: jest.fn(),
      playSound: jest.fn(),
      openBrowserNotification: jest.fn(),
    };
    const mockDeliveryNotificationService = {} as any;
    const mockPostMessageHandlerService = {} as any;
    component = new WidgetComponent(
      mockActivatedRoute,
      mockFormBuilder,
      mockSdkService,
      mockAppConfig,
      mockElementRef,
      mockRenderer2,
      mockChangeDetectorRef,
      mockSanitizer,
      mockSnackBar,
      mockDialog,
      mockBrowserNotificationService,
      mockDeliveryNotificationService,
      mockPostMessageHandlerService,
      mockTranslateService,
      undefined,
      undefined,
    );

    component.customerData = {
      channelCustomerIdentifier: 'cust‑123',
      serviceIdentifier: 'svc‑999',
    } as any;

    component.preChatFormData = {
      sections: [],
    } as any;

    component.preChatFormGroup = {
      value: { sections: [] },
    } as any;

    // creatingSectionsforSchema() loops over this.formData
    component.formData = [] as any;

    (component as any).elementView = {
      nativeElement: {
        value: '',
      },
    };
  });

  let mockEvent: any;
  let carousalMessage: any;
  let selectedButton: any;

  test('Customer fills and submits a form', ({ given, when, and, then }) => {
    given('the customer is in an active conversation with the bot', () => {
      // Set up active conversation with bot
    });

    when('the customer receives a form message', () => {
      // Load and display form message
    });

    and('the customer fills in all required fields', () => {
      // Simulate filling all required fields
    });

    and('the customer submits the form', () => {
      // Trigger form submit action
    });

    then(
      'the customer should see the submitted form data in the conversation with all filled entries',
      () => {
        // Check submitted data is shown
      },
    );

    and('the submitted form should be displayed as non-interactive', () => {
      // Verify form is now read-only
    });
  });

  test('Customer submits an incomplete form', ({ given, when, then, and }) => {
    given('the customer receives a form message', () => {
      // Display form with required fields
    });

    when(
      'the customer tries to submit the form without filling all required fields',
      () => {
        // Attempt submission without filling fields
      },
    );

    then(
      'a validation error message should be displayed indicating that all required fields must be filled',
      () => {
        // Assert validation errors are shown
      },
    );

    and('the customer should not be able to submit the form', () => {
      // Ensure submit action is blocked
    });
  });


    test('Disable actionable elements when disableInteraction is set to true', ({
      given,
      and,
      when,
      then,
    }) => {
      given(
        'the controller sends a message containing actionable elements',
        () => {
          // Code to simulate sending a message with actionable elements
        },
      );

      and(
        'the message includes the flag disableInteraction set to true',
        () => {
          // Code to ensure the message has disableInteraction: true
        },
      );

      when('the customer sends a new message', () => {
        // Code to simulate the customer sending a new message
      });

      then(
        'all actionable elements in previous messages should be disabled',
        () => {
          // Code to verify that previous actionable elements are disabled
        },
      );

      and('those elements should no longer trigger any actions', () => {
        // Code to assert no action is triggered on interaction
      });

      and('those elements should be visually indicated as greyed out', () => {
        // Code to check UI for greyed-out state
      });
    });

    test('Persistence of Disabled State of Actionable Elements', ({
      given,
      and,
      then,
    }) => {
      given(
        'the controller sends a message containing actionable elements',
        () => {
          // Code to simulate sending actionable elements
        },
      );

      and(
        'the message includes the flag disableInteraction set to true',
        () => {
          // Set disableInteraction flag
        },
      );

      and(
        'the elements are subsequently disabled after a user interaction',
        () => {
          // Simulate disabling elements after interaction
        },
      );

      and('the customer refreshes their browser session', () => {
        // Code to simulate page refresh
      });

      then(
        'the previously disabled actionable elements in the chat history should remain visually disabled',
        () => {
          // Assert elements are still disabled after refresh
        },
      );

      and('clicking on them should still not trigger any action', () => {
        // Assert interaction does not trigger actions
      });
    });

    test('Persistence of Enabled State of Actionable Elements', ({
      given,
      and,
      then,
    }) => {
      given(
        'the controller sends a message containing actionable elements',
        () => {
          // Send message with actionable elements
        },
      );

      and(
        'the message includes the flag disableInteraction set to true',
        () => {
          // Ensure disableInteraction is true
        },
      );

      and('the customer refreshes their browser session', () => {
        // Simulate browser refresh
      });

      then(
        'the previously enabled actionable elements in the chat history should remain visually enabled',
        () => {
          // Check that elements are still enabled
        },
      );

      and('clicking on them should trigger an action', () => {
        // Assert that actions still work
      });
    });
});
