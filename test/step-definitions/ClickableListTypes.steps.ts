import { ChangeDetectorRef } from '@angular/core';
import { defineFeature, loadFeature } from 'jest-cucumber';

import {WidgetComponent} from 'src/app/widget/widget.component'
const feature = loadFeature('./test/features/ClickableListTypes.feature');

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
            mockTranslateService,
            undefined,
            undefined,
            undefined
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
      
      test('Customer selects a text option from the list', ({ given, when, and, then }) => {

        let mockEvent: any;
        let clickableList: any;
        let selectedOption: any;
        given('the customer is in an active conversation with the bot', () => {
            mockEvent = {
                type: 'CHANNEL_SESSION_STARTED',
                data: {
                  header: {
                    conversationId: 'conv-123',
                    customer: {
                      _id:"123"
                    }
                  }
                }
              };
              component.eventListener(mockEvent);
              expect(component.isChatActive).toBe(true);
              expect(localStorage.getItem('conversationId')).toBe('conv-123');
        });

        when('the customer receives a list message with text options', () => {
          clickableList = {
            type: 'MESSAGE_RECEIVED',
            data: {
                body: {
                    markdownText: "",
                    type:"Button",
                },
                header: {
                 timestamp: '2023-01-01T12:00:00Z',
                 sender: {
                   type: 'customer'
                 },
                 customer: {
                  _id:"789"
                 }
               }
           }
       }
        });

        and('the customer selects a text option', () => {
          selectedOption = {
            title: 'Two',
            payload: 'Two'
          };
        });

        then('the selected option text should appear as a text in the chat', () => {
          const constructSpy = jest.spyOn(component, 'constructCimMessage');
          const originalMessageId = 'msg-001';
          const carousalCardId = 'Card 2';

          component.sendCarousalMessage(selectedOption, originalMessageId, carousalCardId);

          expect(constructSpy).toHaveBeenCalledWith(
            'PLAIN',
            'Two',
            'Two',
            originalMessageId,
            null,
            null,
            null,
            null,
            null,
            'Card 2'
          );
        });

        and('the list message should become non interactive', () => {

        });
    });

    

    test('Customer selects an image option from the list', ({ given, when, and, then }) => {
        given('the customer is in an active conversation with the bot', () => {

        });

        when('the customer receives a list message with image options', () => {

        });

        and('the customer selects an image option', () => {

        });

        then('the selected image should be displayed as an image in the chat', () => {

        });

        and('the list message should become non interactive', () => {
        });
    });

    

    test('Attempting to select multiple options after one selection', ({ given, when, then, and }) => {
        given('the customer is in an active conversation with the bot', () => {

        });

        and('the customer receives a list message from the bot', () => {

        });

        and('the customer has already selected an option from the list', () => {

        });

        when('the customer attempts to click another option in the list', () => {

        });

        then('the customer should not be able to select another option after the initial selection', () => {

        });

        and('the list message should become non interactive', () => {
        });
    });
    
});