import { ChangeDetectorRef } from '@angular/core';
import { ComponentFixture } from '@angular/core/testing';
import { defineFeature, loadFeature } from 'jest-cucumber';
import { WidgetComponent } from 'src/app/widget/widget.component';

const feature = loadFeature('./test/features/DisableActionableElementsInChatHistory.feature');

defineFeature(feature, (test) => {

    let component: WidgetComponent;
    let spy: jest.SpyInstance;
    beforeEach(() => {
        const mockChangeDetectorRef = {
          detectChanges: jest.fn()
        } as unknown as ChangeDetectorRef;
    
        const mockTranslateService = {
            setDefaultLang: jest.fn(),
            use: jest.fn()
          } as any;
        const mockActivatedRoute = { snapshot: { params: {} } } as any;
        const mockFormBuilder = { group: jest.fn() } as any;

        const mockSdkService = {
          sendChatMessage: jest.fn(),
          setConversationDataAgainstCustomerIdentifier: jest.fn(),
          postFormDataAsActivity: jest.fn()
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
            mockTranslateService
          );

          component.customerData = {
            channelCustomerIdentifier: 'cust‑123',
            serviceIdentifier: 'svc‑999'
          } as any;

          component.preChatFormData = {
            sections: []
          } as any;


          component.preChatFormGroup = {
            value: { sections: [] }
          } as any;
          
          component.formData = [] as any;

          (component as any).elementView = {
            nativeElement: {
              value: '',
            },
          };
      });

      let mockEvent: any;
      let cimMessage: any;
      let newMessage: any;
      let selectedButton: any;

  test('Disable actionable elements when disableInteraction is set to true', ({ given, when, then, and }) => {

    given('the controller sends a message containing actionable elements', () => {
      cimMessage = {
                type: 'MESSAGE_RECEIVED',
                data: {
                    body: {
                        markdownText: "",
                        type:"Carousal",
                        elements: [
                            {
                                "text": "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt.",
                                "url": "",
                                "buttons": [
                                    { "title": "One","payload": "One","type": "button" },
                                    { "title": "Two", "payload": "Two","type": "button" }
                                ],
                            }
                        ]
                    },
                    header: {
                     additionalData: {
                      carousalCardId:"123"
                     },
                     timestamp: '2023-01-01T12:00:00Z',
                     sender: {
                       type: 'BOT'
                     },
                     customer: {
                      _id:"789"
                     }
                   }
               }
           }
    });

    and('the message includes the flag disableInteraction set to true', () => {
        cimMessage.data.header.additionalData = cimMessage.data.header.additionalData || {};
        cimMessage.data.header.additionalData.disableInteraction = true;
    });

    when('the customer sends a new message', () => {
    newMessage = {
        body: {
            type: 'plain',
            markdownText: 'Clicked list option',
        },
        header: {
            sender: {
            type: 'customer',
            },
            intent: 'reply',
            originalMessageId: 'msg456',
            additionalData: {}
        }};
    });

    then('all actionable elements in previous messages should be disabled', () => {
        component.disableOldInteractiveMessages(component.cimMessage);
        const lastMessage = component.cimMessage[component.cimMessage.length - 1];
        expect(lastMessage.data.header.additionalData.disableInteraction).toBe(true);
    });

    and('those elements should no longer trigger any actions', () => {
      
    });

    and('those elements should be visually indicated as greyed out', () => {
        const lastMessage = component.cimMessage[component.cimMessage.length - 1];
        expect(lastMessage.data.body.elements[0].buttons[0].disabled).toBe(true);
        expect(lastMessage.data.body.elements[0].buttons[1].disabled).toBe(true);
    });
  });

  test('Persistence of Disabled State of Actionable Elements', ({ given, and, then }) => {

    given('the controller sends a message containing actionable elements', () => {
      // TODO: Send interactive message
    });

    and('the message includes the flag disableInteraction set to true', () => {
      // TODO: Message has disableInteraction: true
    });

    and('the elements are subsequently disabled after a user interaction', () => {
      // TODO: Simulate disabling through interaction
    });

    and('the customer refreshes their browser session', () => {
      // TODO: Simulate component reload or page refresh
    });

    then('the previously disabled actionable elements in the chat history should remain visually disabled', () => {
      // TODO: Validate persistence of disabled state after refresh
    });

    and('clicking on them should still not trigger any action', () => {
      // TODO: Try to click and confirm no handler/action is called
    });
  });

  test('Persistence of Enabled State of Actionable Elements', ({ given, and, then }) => {

    given('the controller sends a message containing actionable elements', () => {
      // TODO: Simulate interactive message
    });

    and('the message includes the flag disableInteraction set to true', () => {
      // TODO: But message should not be marked for disabling
    });

    and('the customer refreshes their browser session', () => {
      // TODO: Simulate component or page reload
    });

    then('the previously enabled actionable elements in the chat history should remain visually enabled', () => {
      // TODO: Validate that enabled buttons remain enabled
    });

    and('clicking on them should trigger an action', () => {
      // TODO: Simulate click and ensure action handler is triggered
    });
  });
});
