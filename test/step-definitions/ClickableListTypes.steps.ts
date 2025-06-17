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
      
      test('Customer selects a text option from the list', ({ given, when, and, then }) => {
        given('the customer is in an active conversation with the bot', () => {

        });

        when('the customer receives a list message with text options', () => {

        });

        and('the customer selects a text option', () => {

        });

        then('the selected option text should appear as a text in the chat', () => {

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