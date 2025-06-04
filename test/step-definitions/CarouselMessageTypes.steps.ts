import { ChangeDetectorRef } from '@angular/core';
import { defineFeature, loadFeature } from 'jest-cucumber';

import {WidgetComponent} from 'src/app/widget/widget.component'
const feature = loadFeature('./test/features/CarouselMessageTypes.feature');

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
        const mockSdkService = {} as any;
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
      });
    test('Customer selects a button from the carousel', ({ given, when, and, then }) => {
        let mockEvent: any;
        let carousalMessage: any;
        let selectedButton: any;
        given('the customer is in an active conversation with the bot', () => {
            mockEvent = {
                type: 'CHANNEL_SESSION_STARTED',
                data: {
                  header: {
                    conversationId: 'conv-123'
                  }
                }
              };
              component.eventListener(mockEvent);
              expect(component.isChatActive).toBe(true);
              expect(localStorage.getItem('conversationId')).toBe('conv-123');
        });
        
        when('the customer receives a carousel message', () => {
            carousalMessage = {
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
                    }
               }
           }

            jest.spyOn(component, 'handleCimMessage');
            component.eventListener(carousalMessage);
            expect(component.handleCimMessage).toHaveBeenCalledWith(carousalMessage.data);
        })

        and('the customer selects a button from a carousel card', () => {
          });          

        and('the customer submits their selection', () => {
        });

        then('the selected button should be shown as a quoted reply in the conversation', () => {
            const originalMessage = {
                id: 'msg-001',
                body: {
                  markdownText: 'Original message',
                  type: 'Carousal',
                  elements: [
                    {
                      text: 'Text from first card',
                      url: '',
                      buttons: [
                        {
                          title: 'One',
                          payload: 'One',
                          type: 'button',
                          additionalButtonDetails: null
                        }
                      ],
                      defaultAction: { type: '', url: '' },
                      additionalCarouselElementDetails: {
                        title: 'Card 1',
                        image_url: '',
                        alt: '',
                        repeatAble: false
                      }
                    },
                    {
                      text: 'Text from second card',
                      url: '',
                      buttons: [
                        {
                          title: 'Two',
                          payload: 'Two',
                          type: 'button',
                          additionalButtonDetails: null
                        }
                      ],
                      defaultAction: { type: '', url: '' },
                      additionalCarouselElementDetails: {
                        title: 'Card 2',
                        image_url: '',
                        alt: '',
                        repeatAble: false
                      }
                    }
                  ]
                },
                header: {
                  timestamp: '2023-01-01T12:00:00Z'
                }
              };
            
              const quotedMessage = {
                header: {
                  sender: {
                    type: 'Customer'
                  },
                  originalMessageId: 'msg-001',
                  intent: 'Two'
                },
                body: {
                  markdownText: 'Reply message',
                  type: 'PLAIN'
                }
              };
            

              const scrollSpy = jest.spyOn(component, 'scrollToBottom');
              const reportSpy = jest.spyOn(component, 'handleMessageReport');
              component.cimMessage = [originalMessage];
              component.handleCimMessage(quotedMessage);

              const lastMessage = component.cimMessage[component.cimMessage.length - 1];
              expect(lastMessage.body.quotedText).toBe('Text from second card');
              expect(lastMessage.body.quotedTime).toBe('2023-01-01T12:00:00Z');
              expect(lastMessage.header.quotedType).toBe('Carousal');
              expect(lastMessage.body.quotedCardTitle).toBe('Card 2');

              expect(scrollSpy).toHaveBeenCalled();
              expect(reportSpy).toHaveBeenCalledWith(quotedMessage);
            
        });
    });

    

    test('Customer selects a list from the carousel', ({ given, when, and, then }) => {
        given('the customer is in an active conversation with the bot', () => {

        });

        when('the customer receives a carousel message', () => {

        });

        and('the customer selects a list item from a carousel card', () => {

        });

        and('the customer submits their selection', () => {

        });

        then('the selected list item should be shown as a quoted reply', () => {
           
        });
    });

    

    test('Successful carousel response with clickable URL', ({ given, when, then, and }) => {
        given('the customer is in an active conversation with the bot', () => {

        });

        when('the customer receives a carousel message from the bot with a card containing a URL', () => {

        });

        then('the customer should be able to click on the URL', () => {

        });

        and('the URL should open in a new browser tab or window', () => {

        });

        and('the URL should remain clickable', () => {
            
        });
    });

    

    test('Customer attempts to respond to carousel after submitting', ({ given, when, then, and }) => {
        given('the customer has already responded to the carousel message', () => {

        });

        when('the customer tries to interact with the carousel again', () => {

        });

        then('the carousel message should be disabled for further input', () => {

        });

        and('the quoted reply should be visually associated with the carousel card', () => {
            
        });
    });

    
    test('Customer refreshes the browser after submits the carousel response', ({ given, when, then }) => {
        given('the customer has submitted a carousel response', () => {

        });

        when('the customer refreshes the customer widget browser', () => {

        });

        then('the submitted carousel response should be displayed as non interactive', () => {
           
        });
    });
    
});