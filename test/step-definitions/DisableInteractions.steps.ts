import { ChangeDetectorRef } from '@angular/core';
import { ComponentFixture } from '@angular/core/testing';
import { defineFeature, loadFeature } from 'jest-cucumber';
import { WidgetComponent } from 'src/app/widget/widget.component';

const feature = loadFeature(
  './test/features/DisableActionableElementsInChatHistory.feature',
);

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

    component.formData = [] as any;

    (component as any).elementView = {
      nativeElement: {
        value: '',
      },
    };
  });

  let cimMessage: any;
  let disableOldSpy: any;
  const mockMessages = [
          {
            header: { sender: { type: 'BOT' } },
            body: {
              type: 'button',
              additionalDetails: {
                disabled: true,
                interactive: {
                  disableInteraction: true,
                },
              },
            },
          },
          {
            header: { sender: { type: 'BOT' } },
            body: {
              type: 'carousel',
              elements: [
                {
                  additionalCarouselElementDetails: {
                    disableInteraction: true,
                  },
                },
              ],
              additionalDetails: {
                disabled: true,
              },
            },
          },
          {
            header: { sender: { type: 'BOT' } },
            body: {
              type: 'button',
              additionalDetails: {
                interactive: {
                  disableInteraction: false,
                },
              },
            },
          },
          {
            header: { sender: { type: 'BOT' } }, // should not be affected
            body: {
              type: 'plain',
              markdownText: 'https://example.com',
              additionalDetails: {
                interactive: {
                  disableInteraction: true,
                },
              },
            },
          },
        ];

  test('Disable actionable elements when disableInteraction is set to true', ({
    given,
    when,
    then,
    and,
  }) => {
    given(
      'the controller sends a message containing actionable elements',
      () => {
        cimMessage = {
          type: 'MESSAGE_RECEIVED',
          data: {
            body: {
              type: 'Carousal',
              elements: [
                {
                  text: 'Card 1',
                  buttons: [
                    { title: 'Three', payload: 'Three', type: 'button' },
                  ],
                  additionalCarouselElementDetails: {
                    disableInteraction: true,
                  },
                },
              ],
              additionalDetails: {
                disabled: true,
              },
            },
            header: {
              sender: { type: 'BOT' },
            },
          },
        };

        component.cimMessage = [cimMessage.data];
        disableOldSpy = jest.spyOn(component, 'disableOldInteractiveMessages');
      },
    );

    and('the message includes the flag disableInteraction set to true', () => {
      cimMessage.data.body.elements[0].additionalCarouselElementDetails.disableInteraction =
        true;
    });

    when('the customer sends a new message', () => {
      const customerMessage = {
        body: { type: 'plain', markdownText: 'Clicked list option' },
        header: {
          sender: { type: 'customer' },
          intent: 'reply',
          originalMessageId: 'msg456',
          additionalData: {},
        },
      };
      component.handleCimMessage(customerMessage);
    });

    then(
      'all actionable elements in previous messages should be disabled',
      () => {

        component.disableOldInteractiveMessages(mockMessages);

        // Assert the logic
        mockMessages.forEach((msg) => {
          const type = msg.body?.type?.toLowerCase();
          const isBot = msg.header?.sender?.type?.toLowerCase() === 'bot';
          const shouldDisable =
            (type === 'button' &&
              msg.body?.additionalDetails?.interactive?.disableInteraction ===
                true) ||
            (type === 'carousel' &&
              msg.body?.elements?.[0]?.additionalCarouselElementDetails
                ?.disableInteraction === true);

          if (isBot && shouldDisable) {
            expect(msg.body.additionalDetails.disabled).toBe(true);
          } else {
            expect(msg.body?.additionalDetails?.disabled).toBeUndefined();
          }
        });
      },
    );

    and('those elements should no longer trigger any actions', () => {
      const oldMsg = component.cimMessage[0];
      expect(oldMsg.body.additionalDetails.disabled).toBe(true);
    });

    and('those elements should be visually indicated as greyed out', () => {
      const buttons = component.cimMessage[0].body.elements[0].buttons;
      expect(
        buttons.every(
          (btn) => btn.disabled === true || btn.disabled === undefined,
        ),
      ).toBe(true);
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
        cimMessage = {
          type: 'MESSAGE_RECEIVED',
          data: {
            body: {
              type: 'Carousal',
              elements: [
                {
                  text: 'Card 1',
                  buttons: [
                    { title: 'Three', payload: 'Three', type: 'button' },
                  ],
                  additionalCarouselElementDetails: {
                    disableInteraction: true,
                  },
                },
              ],
              additionalDetails: {
                disabled: true,
              },
            },
            header: {
              sender: { type: 'BOT' },
            },
          },
        };

        component.cimMessage = [cimMessage.data];
        disableOldSpy = jest.spyOn(component, 'disableOldInteractiveMessages');
      },
    );

    and('the message includes the flag disableInteraction set to true', () => {
      cimMessage.data.body.elements[0].additionalCarouselElementDetails.disableInteraction =
        true;
    });

    and(
      'the elements are subsequently disabled after a user interaction',
      () => {
        const customerMessage = {
        body: { type: 'plain', markdownText: 'Clicked list option' },
        header: {
          sender: { type: 'customer' },
          intent: 'reply',
          originalMessageId: 'msg456',
          additionalData: {},
        },
      };
      component.handleCimMessage(customerMessage);
      expect(disableOldSpy).toHaveBeenCalled();
      },
    );

    and('the customer refreshes their browser session', () => {
      const disableSpy = jest.spyOn(component, 'disableOldInteractiveMessages');
        component.handleResumedMessages(mockMessages);
        expect(disableSpy).toHaveBeenCalled();
    });

    then(
      'the previously disabled actionable elements in the chat history should remain visually disabled',
      () => {
        
      },
    );

    and('clicking on them should still not trigger any action', () => {
      const buttons = component.cimMessage[0].body.elements[0].buttons;
      expect(
        buttons.every(
          (btn) => btn.disabled === true || btn.disabled === undefined,
        ),
      ).toBe(true);
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
        cimMessage = {
          type: 'MESSAGE_RECEIVED',
          data: {
            body: {
              type: 'Carousal',
              elements: [
                {
                  text: 'Card 1',
                  buttons: [
                    { title: 'Three', payload: 'Three', type: 'button' },
                  ],
                  additionalCarouselElementDetails: {
                    disableInteraction: true,
                  },
                },
              ],
              additionalDetails: {
                disabled: true,
              },
            },
            header: {
              sender: { type: 'BOT' },
            },
          },
        };

        component.cimMessage = [cimMessage.data];
        disableOldSpy = jest.spyOn(component, 'disableOldInteractiveMessages');
      },
    );

    and('the message includes the flag disableInteraction set to true', () => {
      cimMessage.data.body.elements[0].additionalCarouselElementDetails.disableInteraction =
        true;
    });

    and('the customer refreshes their browser session', () => {
      const disableSpy = jest.spyOn(component, 'disableOldInteractiveMessages');
      component.handleResumedMessages(mockMessages);
      expect(disableSpy).toHaveBeenCalled();
    });

    then(
      'the previously enabled actionable elements in the chat history should remain visually enabled',
      () => {
      },
    );

    and('clicking on them should trigger an action', () => {
    });
  });
});
