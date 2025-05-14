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
        const mockBrowserNotificationService = {} as any;
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
        given('the customer is in an active conversation with the bot', () => {
        });

        when('the customer receives a carousel message', () => {
        })

        and('the customer selects a button from a carousel card', () => {

        });

        and('the customer submits their selection', () => {

        });

        then('the selected button should be shown as a quoted reply in the conversation', () => {

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