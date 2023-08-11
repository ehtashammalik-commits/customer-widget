import { AfterViewInit, Component, OnInit, ElementRef } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
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
export class WidgetComponent implements OnInit, AfterViewInit {
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
  public cimMessage: any[] = [];

  conversationId = '';
  isChatActive = false;
  // Widget Configuration
  title = '';
  subtitle = '';
  theme = '';
  enableFileTransfer = false;
  enableDownloadTranscript = false;
  enableDynamicLink = true;
  enableEmoji = false;
  enableFontResize = false;
  preChatFormId = '';
  enableWebRtc = false;
  messageLimit: number = 300; // Set the desired maximum length

  formData: FormAttribute[] = [];

  constructor(
    private fb: UntypedFormBuilder,
    public sdk: SdkService,
    public __appConfig: ConfigService,
    private el: ElementRef,
  ) { }
  ngAfterViewInit(): void {
    setTimeout(() => {
      (this.el.nativeElement as HTMLElement).style.setProperty("--main-color", this.theme);
    }, 1000);
  }

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
      this.changeScreen('chat');
    } else {
      this.changeScreen('widget');
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

  preChatFormGroup: UntypedFormGroup = new UntypedFormGroup({
    name: new UntypedFormControl('', Validators.required),
    email: new UntypedFormControl('', [Validators.required, Validators.email]),
    phone: new UntypedFormControl('', Validators.required),
    customer_channel_identifier: new UntypedFormControl('', Validators.required),
    enabled_transcript: new UntypedFormControl(false, Validators.required)
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

  private markFormGroupTouched(formGroup: UntypedFormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();

      if (control instanceof UntypedFormGroup) {
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

  changeScreen(screen: any) {
    console.log('Change Screen:', screen);
    switch (screen) {
      case 'widget':
        this.additionalPanel = true;
        this.preChatForm = false;
        this.chatActive = false;
        this.isIconWidget = true;
        this.chatError = false;
        break;
      case 'chat':
        this.additionalPanel = false;
        this.preChatForm = false;
        this.chatActive = true;
        this.isIconWidget = true;
        this.chatError = false;
        break;
      case 'form':
        this.preChatForm = true;
        this.additionalPanel = false;
        this.isIconWidget = true;
        this.chatActive = false;
        this.chatError = false;
        break;
      case 'end':
        this.preChatForm = false;
        this.chatActive = false;
        this.chatError = true;
        this.isIconWidget = true;
        break;
      case 'error':
        this.preChatForm = false;
        this.chatActive = false;
        this.chatError = true;
        this.isIconWidget = true;
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
            this.changeScreen('chat');
            console.log('event response:', this.chatPayLoad);
            break;
          case 'CHANNEL_SESSION_STARTED':
            console.log('event response:', event.data);
            this.conversationId = event.data.header.channelSession.conversationId;
            localStorage.setItem('conversationId', event.data.header.channelSession.conversationId);
            break;
          case 'MESSAGE_RECEIVED':
            console.log('event response:', event.data);
            this.cimMessage.push(event.data);
            console.log('Cim Message Array: ',this.cimMessage);
            break;
          case 'SOCKET_DISCONNECTED':
            console.log('event response:', event.data);
            break;
          case 'CONNECT_ERROR':
            console.log('event response:', event.data);
            break;
          case 'CHAT_ENDED':
            this.changeScreen('form');
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
      console.error('Error on establishing connection: ', error)
    }
  }

}
