import { ChangeDetectorRef } from '@angular/core';
import { ComponentFixture } from '@angular/core/testing';
import { defineFeature, loadFeature } from 'jest-cucumber';

import { WidgetComponent } from 'src/app/widget/widget.component';
const feature = loadFeature('./test/features/FormMessageType.feature');
import { FormBuilder } from '@angular/forms';

defineFeature(feature, (test) => {
  const fb = new FormBuilder();
  let component: WidgetComponent;
  let mockStorageService: any;
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
    const mockFormBuilder = {
      group: jest.fn().mockReturnValue({}),
      array: jest.fn().mockReturnValue([]),
    } as any;


     mockStorageService = {
          setItem: jest.fn(),
          getItem: jest.fn().mockReturnValue('conv-123'),
          removeItem: jest.fn(),
          clear: jest.fn()
        } as any;
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
      mockStorageService,
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
  let formMessage: any;

  test('Customer fills and submits a form', ({ given, when, and, then }) => {
    given('the customer is in an active conversation with the bot', () => {
      mockEvent = {
        type: 'CHANNEL_SESSION_STARTED',
        data: {
          header: {
            conversationId: 'conv-123',
            customer: {
              _id: '123',
            },
          },
        },
      };
      component.eventListener(mockEvent);
      expect(component.isChatActive).toBe(true);
      expect(mockStorageService.setItem).toHaveBeenCalledWith(
              'conversationId',
              'conv-123',
              component.storageType
            );
    });

    when('the customer receives a form message', () => {
      formMessage = {
        type: 'MESSAGE_RECEIVED',
          data: {
          body: {
            type: 'form_data',
            additionalDetails: {
              actionButtons: [
                {
                  type: 'control',
                  text: 'Cancel',
                  action: 'cancel',
                },
                {
                  type: 'control',
                  text: 'OK',
                  action: 'submit',
                },
              ],
              disableInteraction: true,
              status: 'unfilled',
            },

            sections: [
              {
                sectionName:
                  'This is an additional label to let people know * means required',
                sectionDescription: '',
                sectionWeightage: null,
                attributes: [
                  {
                    label: 'Text Input Required Example',
                    helpText: '',
                    key: '62c45618-d270-49ae-8007-841332ac7b59',
                    valueType: 'shortAnswer',
                    attributeType: 'INPUT',
                    isRequired: true,
                  },
                  {
                    label: 'Text Input Validation Pattern Example - 3 letters',
                    helpText: '',
                    key: '232ea53c-d23c-4aad-9c34-d8a07cb1e9b7',
                    valueType: 'shortAnswer',
                    attributeType: 'INPUT',
                    isRequired: true,
                  },
                ],
              },
            ],
          },
          header: {
            timestamp: '2023-01-01T12:00:00Z',
            sender: {
              type: 'bot',
            },
            customer: {
              _id: '789',
            },
        },
      }
      };


      // Spy on constructCimMessage
      jest.spyOn(component, 'constructCimMessage');
      jest.spyOn(component.sdk, 'sendChatMessage');

      jest.spyOn(component, 'handleCimMessage');
      component.eventListener(formMessage);
      expect(component.handleCimMessage).toHaveBeenCalledWith(formMessage.data);
    });

    and('the customer fills in all required fields', () => {});

    and('the customer submits the form', async () => {
      formMessage = {
        id: '123',
          body: {
            type: 'form_data',
            additionalDetails: {
              actionButtons: [
                {
                  type: 'control',
                  text: 'Cancel',
                  action: 'cancel',
                },
                {
                  type: 'control',
                  text: 'OK',
                  action: 'submit',
                },
              ],
              disableInteraction: true,
              status: 'filled',
            },

            sections: [
              {
                sectionName:
                  'This is an additional label to let people know * means required',
                sectionWeightage: null,
                sectionScore: null,
                attributes: [
                  {
                    label: 'Text Input Required Example',
                    valueType: 'shortAnswer',
                    attributeWeightage: null,
                    attributeScore: null,
                    attributeType: 'INPUT',
                    skipType: null,
                    key: '298d6627-277a-4bb2-9480-4e824ed9701c',
                    attributeAttachment: '',
                    answer: ['jkljlkj'],
                  },
                  {
                    label: 'Text Input Validation Pattern Example - 3 letters',
                    valueType: 'shortAnswer',
                    attributeWeightage: null,
                    attributeScore: null,
                    attributeType: 'INPUT',
                    skipType: null,
                    key: '3a4c8011-880a-4ed6-bdfd-3bc74621e9a8',
                    attributeAttachment: '',
                    answer: ['lkjk'],
                  },
                ],
              },
            ],
          },
          header: {
            originalMessageId: '789',
            timestamp: '2023-01-01T12:00:00Z',
            sender: {
              type: 'customer',
            },
        },
      };

      const fakeForm = fb.group({
        sections: fb.array([
          fb.group({
            attributes: fb.array([
              fb.group({ value: ['jkljlkj'] }),
              fb.group({ value: ['lkjk'] }),
            ]),
          }),
        ]),
      });

      component.formGroupsMap['123'] = fakeForm;

      const constructSpy = jest.spyOn(component, 'constructCimMessage');
      await component.onFormMessageTypeSubmit(formMessage);
      expect(constructSpy).toHaveBeenCalled();
      expect(constructSpy).toHaveBeenCalledWith(
        'FORM_DATA',
        null,
        null,
        '123',               // the messageId
        null,
        null,
        null,
        null,
        null,
        null,
        expect.objectContaining({
          id: '123',
          body: expect.objectContaining({
            sections: expect.any(Array),
            formTitle: '',
          }),
        }),
        'filled'
      );
    });

    then(
      'the customer should see the submitted form data in the conversation with all filled entries',
      () => {
        formMessage = {
        id: '123',
          body: {
            type: 'form_data',
            additionalDetails: {
              actionButtons: [
                {
                  type: 'control',
                  text: 'Cancel',
                  action: 'cancel',
                },
                {
                  type: 'control',
                  text: 'OK',
                  action: 'submit',
                },
              ],
              disableInteraction: true,
              status: 'filled',
            },

            sections: [
              {
                sectionName:
                  'This is an additional label to let people know * means required',
                sectionWeightage: null,
                sectionScore: null,
                attributes: [
                  {
                    label: 'Text Input Required Example',
                    valueType: 'shortAnswer',
                    attributeWeightage: null,
                    attributeScore: null,
                    attributeType: 'INPUT',
                    skipType: null,
                    key: '298d6627-277a-4bb2-9480-4e824ed9701c',
                    attributeAttachment: '',
                    answer: ['jkljlkj'],
                  },
                  {
                    label: 'Text Input Validation Pattern Example - 3 letters',
                    valueType: 'shortAnswer',
                    attributeWeightage: null,
                    attributeScore: null,
                    attributeType: 'INPUT',
                    skipType: null,
                    key: '3a4c8011-880a-4ed6-bdfd-3bc74621e9a8',
                    attributeAttachment: '',
                    answer: ['lkjk'],
                  },
                ],
              },
            ],
          },
          header: {
            originalMessageId: '789',
            timestamp: '2023-01-01T12:00:00Z',
            sender: {
              type: 'customer',
            },
        },
      };
      const scrollSpy = jest.spyOn(component, 'scrollToBottom');
      const reportSpy = jest.spyOn(component, 'handleMessageReport');

      component.handleCimMessage(formMessage);

      expect(scrollSpy).toHaveBeenCalled();
      expect(reportSpy).toHaveBeenCalledWith(formMessage);
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

    and('the message includes the flag disableInteraction set to true', () => {
      // Code to ensure the message has disableInteraction: true
    });

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

    and('the message includes the flag disableInteraction set to true', () => {
      // Set disableInteraction flag
    });

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

    and('the message includes the flag disableInteraction set to true', () => {
      // Ensure disableInteraction is true
    });

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
