import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { SdkService } from "../services/sdk.service";
import { ConfigService } from "../services/config.service";
import { Subscription } from 'rxjs';

interface FormAttribute {
  _id: string;
  attributeType: string;
  helpText: string;
  isRequired: boolean;
  key: string;
  label: string;
  valueType: string;
}

@Component({
  selector: 'app-widget',
  templateUrl: './widget.component.html',
  styleUrls: ['./widget.component.scss']
})
export class WidgetComponent implements OnInit {
  private widgetConfigsSubscription: Subscription = new Subscription;
  private preChatFormSubscription: Subscription = new Subscription;
  private establishConnectionSubject: Subscription = new Subscription;
  additionalPanel = false;
  isIconWidget = true;
  preChatForm = false;
  chatActive = false;
  chatError = false;

  customerData: any;
  chatPayLoad: any;
  cimMessage: [] = [];

  // Widget Configuration
  title = '';
  subtitle = '';
  theme = '';
  enableFileTransfer = false;
  enableDownloadTranscript = false;
  enableDynamicLink = false;
  enableEmoji = false;
  enableFontResize = false;
  preChatFormId = '';
  enableWebRtc = false;

  formData: FormAttribute[] = [];

  constructor(
    private fb: FormBuilder,
    public sdk: SdkService,
    public __appConfig: ConfigService,
  ) { }

  ngOnInit(): void {

    this.widgetConfigsSubscription = this.sdk.widgetConfigs$.subscribe((configs) => {
      this.setWidgetConfigs(configs)
      console.log('Widget configurations:', configs);
      if (configs.form !== '') {
        this.sdk.renderPreChatForm(configs.form);
      }
    });

    this.preChatFormSubscription = this.sdk.renderPreChatForm$.subscribe((formData) => {
      this.formData = formData.attributes;
      console.log('Widget configurations:', formData.attributes);
    });

    this.establishConnectionSubject = this.sdk.connectionResponse$.subscribe((response) => {
      console.log('Connection Response:', response);
      this.eventListener(response);
    });

    // Load the pre-chat form or the active chat screen depending on whether the user is already authenticated or not.
    const userAuthenticated = false; // Replace with your own authentication logic
    if (userAuthenticated) {
      this.showActiveChatScreen();
    } else {
      this.showWelcomePanel();
    }

    this.preChatFormGroup = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^[\d-+\s()]+$/)]],
      customer_channel_identifier: ['', Validators.required],
      enabled_transcript: [false]
    });
  }

  validationMessages = {
    name: {
      required: "This field is required",
      minlength: "More characters required",
      maxlength: "Max 40 characters allowed",
      pattern: 'Allowed special characters "[!@#$%^&*()-_=+~`"]+"',
    },
    email: {
      required: "This field is required",
      maxlength: "Max 256 characters allowed",
      pattern: 'Allowed special characters "[!@#$%^&*()-_=+~`"]+"',
    },
    phone: {
      required: "This field is required",
      minlength: "More characters required",
      maxlength: "Max 40 characters allowed",
      pattern: 'Allowed special characters "[!@#$%^&*()-_=+~`"]+"',
    },
    customer_channel_identifier: {
      required: "This field is required",
      maxlength: "Max 256 characters allowed",
      pattern: 'Allowed special characters "[!@#$%^&*()-_=+~`"]+"',
    },
  };

  preChatFormGroup: FormGroup = new FormGroup({
    name: new FormControl('', Validators.required),
    email: new FormControl('', [Validators.required, Validators.email]),
    phone: new FormControl('', Validators.required),
    customer_channel_identifier: new FormControl('', Validators.required),
    enabled_transcript: new FormControl(false, Validators.required)
  });

  setWidgetConfigs(configs: any) {
    this.title = configs.title;
    this.subtitle = configs.subTitle;
    this.theme = configs.theme;
    this.enableFileTransfer = configs.enableFileTransfer;
    this.enableDownloadTranscript = configs.enableDownloadTranscript;
    this.enableDynamicLink = configs.enableDynamicLink;
    this.enableEmoji = configs.enableEmoji;
    this.enableFontResize = configs.enableFontResize;
    this.preChatFormId = configs.form;
    this.enableWebRtc = configs.enableWebRtc;
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  onSubmit(): void {
    try {
      let preChatData = this.preChatFormGroup.value;
      if (preChatData.customer_channel_identifier && this.__appConfig.appConfig.SERVICE_IDENTIFIER) {
        let eventPayload = this.getEventPayload(preChatData);
        console.log('Event Payload: ==>', eventPayload);
        this.setUserData(eventPayload, 'startChat');
      }
      // Proceed with form submission
      console.log(this.preChatFormGroup.value);
    } catch (error) {
      alert("Error while submitting the form");
    }
  }

  setUserData(data: any, eventType: any) {
    this.customerData = data;
    if (
      this.customerData.channelCustomerIdentifier == '' ||
      this.customerData.serviceIdentifier == '' ||
      this.customerData.browserDeviceInfo.deviceType == ''
    ) {
      let Response = {
        type: 'ERROR',
        data: {
          code: 400,
          description: 'BAD REQUEST',
          message: 'Mandatory attributes are missing'
        }
      }
      console.log(Response);

    } else if (eventType == 'startChat') {
      let user = { data: this.customerData }
      localStorage.setItem('user', JSON.stringify(user));
      if (localStorage.getItem('user')) {
        this.sdk.makeConnection(this.customerData.serviceIdentifier, this.customerData.channelCustomerIdentifier);
      }
    }
  }

  getEventPayload(preChatFormData: any) {
    return {
      serviceIdentifier: this.__appConfig.appConfig.SERVICE_IDENTIFIER,
      channelCustomerIdentifier: preChatFormData.customer_channel_identifier,
      browserDeviceInfo: {
        browserId: '123456',
        browserIdExpiryTime: '9999',
        browserName: 'chrome',
        deviceType: 'desktop'
      },
      queue: '',
      locale: {
        timezone: 'asia/karachi',
        language: 'english',
        country: 'pakistan'
      },
      formData: this.getFormDataByPreChatForm(preChatFormData),
    }
  }

  getFormDataByPreChatForm(preChatFormData: any[]): any {
    // const modifiedFormData = preChatFormData.map(formData => {
    //   const modifiedData = {
    //     key: formData.name,
    //     type: 'string',
    //     // Copy other properties from the original data if needed
    //   };
    //   return modifiedData;
    // });

    return {
      id: Math.random(),
      formId: this.preChatFormId,
      filledBy: 'web-widget',
      attributes: preChatFormData,
      createdOn: new Date(),
    };
  }

  closeWrapper() {
    console.log("wrapper closed");
  }

  showWelcomePanel() {
    this.preChatForm = false;
    this.additionalPanel = true;
    this.isIconWidget = true;
  }

  showPreChatForm() {
    this.preChatForm = true;
    this.additionalPanel = false;
    this.isIconWidget = true;
    this.chatActive = true;
    this.chatError = false;
  }

  showActiveChatScreen() {
    this.additionalPanel = false;
    this.preChatForm = false;
    this.chatActive = true;
    this.chatError = false;
  }

  showEndChatScreen() {
    this.preChatForm = false;
    this.chatActive = false;
    this.chatError = true;
  }

  changeScreen(screen: any) {
    console.log('Change Screen:', screen);
    switch (screen) {
      case 'chat':

        break;
      case 'form':

        break;
      case 'error':

        break;
    }
  }

  eventListener(event: any) {
    try {
      if (event.id !== undefined || event.id !== '' || event.id !== null) {
        switch (event.type) {
          case 'SOCKET_CONNECTED':
            this.chatPayLoad = { type: "CHAT_REQUESTED", data: this.customerData };
            this.sdk.sendChatRequest(this.chatPayLoad);
            // this.changeScreen('chat');
            this.showActiveChatScreen();
            console.log('event response:', this.chatPayLoad);
            break;
          case 'CHANNEL_SESSION_STARTED':
            console.log('event response:', event.data);

            break;
          case 'MESSAGE_RECEIVED':
            console.log('event response:', event.data);
            break;
          case 'SOCKET_DISCONNECTED':
            console.log('event response:', event.data);
            break;
          case 'CONNECT_ERROR':
            console.log('event response:', event.data);
            break;
          case 'CHAT_ENDED':
            console.log('event response:', event.data);
            break;
          case 'ERRORS':
            if (event.data.task.toUpperCase() == 'CHAT_REQUESTED') {
              if (event.data.code == 408) {
                alert('Unable to connect with end server');
              } else if (event.data.code == 400) {
                alert('data is invalid');
              } else if (event.data.code == 500) {
                alert('Internal error with end server');
              } else {
                alert('Unable to send request');
              }
            }
            break;
          default:
            break;
        }
      }
    } catch (error) {

    }
  }

}
