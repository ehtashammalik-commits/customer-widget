import { ChangeDetectorRef } from '@angular/core';
import { ComponentFixture } from '@angular/core/testing';
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
        const mockSdkService = {
          sendChatMessage: jest.fn(),
          setConversationDataAgainstCustomerIdentifier: jest.fn()
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

          component.preChatFormData = {};

          (component as any).elementView = {
            nativeElement: {
              value: '',
            },
          };
      });


      let mockEvent: any;
      let carousalMessage: any;
      let selectedButton: any;

    test('Customer selects a button from the carousel', ({ given, when, and, then }) => {  
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
                    },
                    header: {
                     additionalData: {
                      carousalCardId:"123"
                     },
                     timestamp: '2023-01-01T12:00:00Z',
                     sender: {
                       type: 'customer'
                     }
                   }
               }
           }

            jest.spyOn(component, 'handleCimMessage');
            component.eventListener(carousalMessage);
            expect(component.handleCimMessage).toHaveBeenCalledWith(carousalMessage.data);
        })

        and('the customer selects a button from a carousel card', () => {
            selectedButton = {
              title: 'Two',
              payload: 'Two'
            };
          });          

        and('the customer submits their selection', () => {
          const constructSpy = jest.spyOn(component, 'constructCimMessage');
          const originalMessageId = 'msg-001';
          const carousalCardId = 'Card 2';

          component.sendCarousalMessage(selectedButton, originalMessageId, carousalCardId);

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
                  id: 'card-1',
                  title: 'Card 1',
                  image_url: 'https://example.com/card1.jpg',
                  alt: 'Card 1 image',
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
                  id: 'card-2',
                  title: 'Card 2',
                  image_url: 'https://example.com/card2.jpg',
                  alt: 'Card 2 image',
                  repeatAble: false
                }
              }
            ]
          },
          header: {
            timestamp: '2023-01-01T12:00:00Z',
            sender: {
              type: 'BOT'
            }
          }
        };
      
        const quotedMessage = {
          header: {
            sender: {
              type: 'Customer'
            },
            originalMessageId: 'msg-001',
            intent: 'Two',
            additionalData: {
              carousalCardId: 'card-2'
            }
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
        expect(lastMessage.body.quotedCardImage).toBe('https://example.com/card2.jpg');
        expect(lastMessage.body.quotedAltImage).toBe('Card 2 image');
        expect(lastMessage.body.quotedButtons).toEqual([
          {
            title: 'Two',
            payload: 'Two',
            type: 'button',
            additionalButtonDetails: null
          }
        ]);
        expect(scrollSpy).toHaveBeenCalled();
        expect(reportSpy).toHaveBeenCalledWith(quotedMessage);
      });      
    });

    

    test('Customer selects a list from the carousel', ({ given, when, and, then }) => {
          
        given('the customer is in an active conversation with the bot', () => {
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
                                { "title": "One","payload": "One","type": "clickableList" },
                                { "title": "Two", "payload": "Two","type": "clickableList" }
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
                    type: 'customer'
                  }
                }
              }
          }

        jest.spyOn(component, 'handleCimMessage');
        component.eventListener(carousalMessage);
        expect(component.handleCimMessage).toHaveBeenCalledWith(carousalMessage.data);

        });

        and('the customer selects a list item from a carousel card', () => {
          selectedButton = {
            title: 'Two',
            payload: 'Two'
          };
        });

        and('the customer submits their selection', () => {
          const constructSpy = jest.spyOn(component, 'constructCimMessage');
          const originalMessageId = 'msg-001';
          const carousalCardId = 'Card 2';

          component.sendCarousalMessage(selectedButton, originalMessageId, carousalCardId);

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

        then('the selected list item should be shown as a quoted reply', () => {
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
                      type: 'clickableList',
                      additionalButtonDetails: null
                    }
                  ],
                  defaultAction: { type: '', url: '' },
                  additionalCarouselElementDetails: {
                    id: 'card-1',
                    title: 'Card 1',
                    image_url: 'https://example.com/card1.jpg',
                    alt: 'Card 1 image',
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
                      type: 'clickableList',
                      additionalButtonDetails: null
                    }
                  ],
                  defaultAction: { type: '', url: '' },
                  additionalCarouselElementDetails: {
                    id: 'card-2',
                    title: 'Card 2',
                    image_url: 'https://example.com/card2.jpg',
                    alt: 'Card 2 image',
                    repeatAble: false
                  }
                }
              ]
            },
            header: {
              timestamp: '2023-01-01T12:00:00Z',
              sender: {
                type: 'customer'
              }
            }
          };
        
          const quotedMessage = {
            header: {
              sender: {
                type: 'Customer'
              },
              originalMessageId: 'msg-001',
              intent: 'Two',
              additionalData: {
                carousalCardId: 'card-2'
              }
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
          expect(lastMessage.body.quotedCardImage).toBe('https://example.com/card2.jpg');
          expect(lastMessage.body.quotedAltImage).toBe('Card 2 image');
          expect(lastMessage.body.quotedButtons).toEqual([
            {
              title: 'Two',
              payload: 'Two',
              type: 'clickableList',
              additionalButtonDetails: null
            }
          ]);
          expect(scrollSpy).toHaveBeenCalled();
          expect(reportSpy).toHaveBeenCalledWith(quotedMessage);
        }); 
     });

    

    test('Successful carousel response with clickable URL', ({ given, when, then, and }) => {
      let container: HTMLDivElement;
        given('the customer is in an active conversation with the bot', () => {
          const mockEvent = {
          type: 'CHANNEL_SESSION_STARTED',
          data: { header: { conversationId: 'conv-123' } },
        };
        component.eventListener(mockEvent);
        expect(component.isChatActive).toBe(true);
        });

        when('the customer receives a carousel message from the bot with a card containing a URL', () => {
          carousalMessage = {
            type: 'MESSAGE_RECEIVED',
            data: {
              body: {
                markdownText: "",
                type: "Carousal",
                elements: [
                  {
                    text: 'Some description for card',
                    additionalCarouselElementDetails: {
                      title: 'Sample Card Title',
                      image_url: 'https://example.com/image.png',
                      id: 'card-101',
                    },
                    buttons: [ 
                      {
                        type: 'linkButton',
                        payload: 'Visit A1',
                        additionalButtonDetails: {
                          url: 'https://www.a1.bg/bg',
                          target: '_blank'
                        }
                      },
                      {
                        type: 'linkButton',
                        payload: 'More Info',
                        additionalButtonDetails: {
                          url: 'https://www.a1.bg/bg',
                          target: '_blank'
                        }
                      }
                    ]
                  }
                ]
              },
              header: {
                additionalData: {
                 carousalCardId:"123"
                },
                timestamp: '2023-01-01T12:00:00Z',
                sender: {
                  type: 'customer'
                }
              }
            }
          };          

        jest.spyOn(component, 'handleCimMessage');
        component.eventListener(carousalMessage);
        expect(component.handleCimMessage).toHaveBeenCalledWith(carousalMessage.data);
        });

        then('the customer should be able to click on the URL', () => {
          container = document.createElement('div');
          document.body.appendChild(container);
      
          carousalMessage.data.body.elements.forEach((item) => {
            const card = document.createElement('div');
      
            item.buttons.forEach((button) => {
              if (button.type === 'linkButton') {
                const anchor = document.createElement('a');
                anchor.href = button.additionalButtonDetails.url;
                anchor.target = button.additionalButtonDetails.target;
                anchor.textContent = button.payload;
                anchor.className = 'link-button';
                card.appendChild(anchor);
              }
            });
      
            container.appendChild(card);
          });
      
          const anchors = container.querySelectorAll('a.link-button');
          expect(anchors.length).toBe(2);
        });

        and('the URL should open in a new browser tab or window', () => {
          const anchors = container.querySelectorAll('a.link-button');
      
          expect(anchors[0].getAttribute('href')).toBe('https://www.a1.bg/bg');
          expect(anchors[0].getAttribute('target')).toBe('_blank');
      
          expect(anchors[1].getAttribute('href')).toBe('https://www.a1.bg/bg');
          expect(anchors[1].getAttribute('target')).toBe('_blank');
        });

        and('the URL should remain clickable', () => {
          const anchors = container.querySelectorAll('a.link-button');
          document.body.removeChild(container);
        });
    });

    

    test('Customer attempts to respond to carousel after submitting', ({ given, when, then, and }) => {
      let submittedCarousal: any;
      let newMessage: any;
    
      given('the customer has already responded to the carousel message', () => {
        submittedCarousal = {
          id: 'card-123',
          body: {
            type: 'plain',
            markdownText: 'hello',
            elements: [
              {
                text: 'Text from first card',
                url: '',
                buttons: [
                  {
                    title: 'One',
                    payload: 'One',
                    type: 'clickableList',
                    additionalButtonDetails: null
                  }
                ],
                defaultAction: { type: '', url: '' },
                additionalCarouselElementDetails: {
                  id: 'card-123',
                  title: 'Card 1',
                  image_url: 'https://example.com/card1.jpg',
                  alt: 'Card 1 image',
                  repeatAble: false
                }
              }
            ]
          },
          header: {
            additionalData: {
              carousalCardId:"123"
            },
            intent: 'text',
            originalMessageId: '2',
            sender: {
              type: 'customer',
            },
          },
        };
      });
    
      when('the customer tries to interact with the carousel again', () => {
        component.cimMessage.push(submittedCarousal);
    
        newMessage = {
          header: {
            originalMessageId: 'card-123',
            additionalData: {
              carousalCardId: 'card-123',
            },
            sender: {
              type: 'customer',
            }
          },
          id: '1',
          body: {},
        };        
      });
    
      then('the carousel message should be disabled for further input', () => {
        const spy = jest.spyOn(component, 'handleCarousalQuotedMessage');
        component.handleCarousalQuotedMessage(newMessage);
    
        expect(spy).toHaveBeenCalledWith(newMessage);
        expect(component.cimMessage[0].body.disableAllButtons).toBe(true);
      });
    
      and('the quoted reply should be visually associated with the carousel card', () => {
        const quotedMessage = component.cimMessage[1]; // newMessage gets pushed in handleCarousalQuotedMessage
        expect(quotedMessage.body.quotedCardTitle).toBe('Card 1');
        expect(quotedMessage.body.quotedCardImage).toBe('https://example.com/card1.jpg');
        expect(quotedMessage.body.quotedText).toBe('Text from first card');
      });
    });
    

    
    test('Customer refreshes the browser after submits the carousel response', ({ given, when, then }) => {
      const cimMessage: any = {
        id: '1',
        body: {
          type: 'plain',
          markdownText: 'hello',
        },
        header: {
          additionalData:{
            carousalCardId:'3'
          },
          intent: 'text',
          originalMessageId: '2',
          sender: {
            type: 'customer',
          },
        },
      };
        given('the customer has submitted a carousel response', () => {
          const constructSpy = jest.spyOn(component, 'constructCimMessage');
          const originalMessageId = 'msg-001';
          const carousalCardId = 'Card 2';

          component.sendCarousalMessage(selectedButton, originalMessageId, carousalCardId);

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

        when('the customer refreshes the customer widget browser', () => {
          jest.spyOn(component, 'handleCarousalQuotedMessage');
          component.handleResumedMessages([cimMessage]);
        });

        then('the submitted carousel response should be displayed as non interactive', () => {
          expect(component.handleCarousalQuotedMessage).toHaveBeenLastCalledWith(cimMessage)
        });
    });
    
});