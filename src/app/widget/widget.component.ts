import {
  AfterViewInit,
  Component,
  OnInit,
  ElementRef,
  ViewChild,
  Input,
  ChangeDetectorRef
} from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { SdkService } from '../services/sdk.service';
import { ConfigService } from '../services/config.service';
import { browserNotificationService } from '../services/browser-notification.service';
import { DeliveryNotificationService } from '../services/delivery-notification.service';
import { Subscription } from 'rxjs';
import { CdkTextareaAutosize } from '@angular/cdk/text-field';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { ActivatedRoute } from '@angular/router';
import { TooltipPosition } from '@angular/material/tooltip';

@Component({
  selector: 'app-widget',
  templateUrl: './widget.component.html',
  styleUrls: ['./widget.component.scss'],
})
export class WidgetComponent implements OnInit, AfterViewInit {
  private widgetConfigsSubscription: Subscription = new Subscription();
  private preChatFormSubscription: Subscription = new Subscription();
  private callbackFormSubscription: Subscription = new Subscription();
  private establishConnectionSubject: Subscription = new Subscription();
  private onChatResumedSubject: Subscription = new Subscription();
  private onCallSubject: Subscription = new Subscription();
  private onCallbackRequestSubject: Subscription = new Subscription();
  @ViewChild('autosize')
  autosize!: CdkTextareaAutosize;
  @ViewChild('myFileInput')
  myInputVariable!: ElementRef;
  @ViewChild('message')
  messageElement!: ElementRef;
  @ViewChild('messageComposer')
  elementView!: ElementRef;
  @ViewChild('scrollMe')
  private scrollContainer!: ElementRef;
  @Input() conversation: any;
  scrollTop = 0;
  fontSize = new FormControl("12");
  public scrollCon: any;
  customerIdentifier: any;

  widgetIdentifier: any;
  serviceIdentifier: any;

  sendTypingStartedEventTimer: any = null;
  additionalPanel = false;
  isIconWidget = true;
  preChatFormScreen = false;
  widgetChatScreen = false;
  chatError = false;
  chatEndScreen = false;

  callbackFormScreen = false;
  callbackResponseScreen = false;

  // Main Screen Views
  activeChatView = false;
  activeAudioView = false;
  activeVideoView = false;

  callPopUpView = false;
  activeCallbackView = false;
  activeCallbackResponseView = false;
  callbackResponseStatus = '';

  customerData: any;
  preChatFormData: any;
  chatPayLoad: any;
  public cimMessage: any[] = [];
  typingIndicatorTimer: any = null;
  lastSeenMessageId: any = null;
  conversationId = '';
  isChatActive = false;
  isCallActive = false;
  eventTriggerType = '';
  isCallMute = false;
  isCallOnHold = false;

  isChatMax = false;
  isCallbackMax = false;

  fontDropDown = false;
  positionOptions: TooltipPosition[] = ['after', 'before', 'above', 'below', 'left', 'right'];
  matToolTipPosition = this.positionOptions[4];
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
  enableWebRtc: Boolean = false;
  webRTCConfig: any;
  messageLimit: number = 300; // Set the desired maximum length
  text: string = '';
  composer_input_disabled: boolean = false;
  isTyping: boolean = true;

  @Input() formData!: any[];
  @Input() callbackFormData!: any[];
  preChatFormGroup!: FormGroup;
  callbackFormGroup!: FormGroup;
  callbackLoader = false;
  callbackConfig: any;
  enabledCallback: Boolean = false;
  standaloneCallback: Boolean = false;

  enabledWebhook: Boolean = false;
  webhookUrl: any;

  isMobile = false;

  imageUrls: {
    filesPath: SafeUrl;
    fileType: string;
    fileExt: string;
    fileName: string;
  }[] = [];
  fileLoading = false;
  selectedFile!: File;

  selectedLanguage: any;
  browserLang: any;

  textDirection = '';

  // Audio Screen Variables
  counterVar: any;
  callTime: string = '00:00';

  constructor(
    private route: ActivatedRoute,
    private fb: FormBuilder,
    public sdk: SdkService,
    public __appConfig: ConfigService,
    private el: ElementRef,
    private cdRef: ChangeDetectorRef,
    private sanitizer: DomSanitizer,
    private snackBar: MatSnackBar,
    public dialog: MatDialog,
    private browserNotificationService: browserNotificationService,
    private deliveryNotificationService: DeliveryNotificationService,
  ) { }

  ngAfterViewInit(): void {
    this.customerChatResumed();
    setTimeout(() => {
      (this.el.nativeElement as HTMLElement).style.setProperty(
        '--main-color',
        this.theme,
      );
    }, 1000);
  }

  ngOnInit(): void {

    this.route.queryParams.subscribe((params) => {
      this.customerIdentifier = params['channelCustomerIdentifier'];
      this.serviceIdentifier = params['serviceIdentifier'];
      this.widgetIdentifier = params['widgetIdentifier'];

      console.log(
        'parameters from iframe url',
        this.customerIdentifier,
        this.serviceIdentifier,
        this.widgetIdentifier,
      );
      // Pass parameters to service after you have received them.
      this.passUrlParamsToServices();
    });

    this.preChatFormGroup = this.fb.group({});
    this.callbackFormGroup = this.fb.group({});

    this.widgetConfigsSubscription = this.sdk.widgetConfigs$.subscribe(
      (configs) => {
        this.setWidgetConfigs(configs);
        this.loadBrowserLanguage();
        console.log('Widget configurations:', configs);
        if (this.enabledCallback) this.sdk.renderCallbackForm(this.callbackConfig.callBackForm);
        if (configs.form !== '') this.sdk.renderPreChatForm(this.preChatFormId);
      },
    );

    this.preChatFormSubscription = this.sdk.renderPreChatForm$.subscribe(
      (formData) => {
        this.formData = formData.attributes;
        this.createFormControls();
        console.log('Widget configurations:', formData.attributes);
      },
    );

    this.callbackFormSubscription = this.sdk.renderCallbackForm$.subscribe(
      (formData) => {
        this.callbackFormData = formData.attributes;
        this.createCallbackFormControls();
        console.log('Widget configurations:', formData.attributes);
      },
    );

    this.onChatResumedSubject = this.sdk.onChatResumedResponse$.subscribe(
      (data) => {
        if (data.isChatAvailable == true) {
          this.changeScreen('chat');
          console.log('on Chat Resumed Response:', data);
          this.cimMessage = data.data;
          this.isChatActive = true;
          this.processSeenMessages();
        }
        this.scrollToBottom();
      },
    );

    this.onCallSubject = this.sdk.onCallResponse$.subscribe((data) => {
      console.log('call response events => ', data);
      this.processCallResponses(data);
    });

    this.onCallbackRequestSubject = this.sdk.onCallbackRequestResponse$.subscribe((data) => {
      console.log('callback request response events => ', data);

      if (data && data.status && data.status.name) {
        this.callbackResponseStatus = data.status.name.toLowerCase();
      } else {
        this.callbackResponseStatus = 'error';
        console.error('Something Went Wrong Please check logs');
      }
      this.callbackLoader = false;
      this.isChatActive ? this.changeView('callbackResponse') : this.changeScreen('callbackResponse');
    });

    this.establishConnectionSubject = this.sdk.connectionResponse$.subscribe(
      (response) => {
        console.log('Connection Response:', response);
        if (response) {
          this.eventListener(response);
          console.log('event listener:', response);
        }
      },
    );

    // Load the pre-chat form or the active chat screen depending on whether the user is already authenticated or not.
    const userAuthenticated = false; // Replace with your own authentication logic
    if (userAuthenticated) {
      this.changeScreen('chat');
    } else {
      this.changeScreen('widget');
    }

    this.loadBrowserLanguage();
    this.setFontFromLocalStorage();
  }

  async passUrlParamsToServices() {
    await this.sdk.receiveUrlParamsValue(
      this.widgetIdentifier,
      this.serviceIdentifier,
    );
  }

  private createFormControls(): void {
    for (const attribute of this.formData) {
      const validators = attribute.isRequired ? [Validators.required] : [];
      this.preChatFormGroup.addControl(
        attribute.key,
        this.fb.control('', validators),
      );
    }
  }

  private createCallbackFormControls(): void {
    for (const attribute of this.callbackFormData) {
      const validators = attribute.isRequired ? [Validators.required] : [];
      this.callbackFormGroup.addControl(
        attribute.key,
        this.fb.control('', validators),
      );
    }
  }

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
    this.webRTCConfig = configs.webRtc;
    if (this.webRTCConfig !== null) {
      this.enableWebRtc = configs.webRtc.enableWebRtc;
    }
    this.callbackConfig = configs.callback;
    if (this.callbackConfig !== null) {
      this.enabledCallback = configs.callback.enableCallback;
      this.standaloneCallback = configs.callback.standaloneCallback;
    }
    if (configs.webhook !== null) {
      this.webhookUrl = configs.webhook.webhookUrl;
      this.enabledWebhook = configs.webhook.enableWebhook;
    }
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach((control) => {
      control.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  onFormSubmit(): void {
    try {
      // let preChatData = this.preChatFormGroup.value;
      this.preChatFormData = this.preChatFormGroup.value;
      this.preChatFormData.customer_channel_identifier = this.preChatFormData.phone ? this.preChatFormData.phone : null;
      if (this.preChatFormData.customer_channel_identifier && this.serviceIdentifier) {
        let eventPayload = this.getEventPayload(this.preChatFormData);
        console.log('Event Payload: ==>', eventPayload);
        this.setUserData(eventPayload, 'startChat');
      }
      // Proceed with form submission
      console.log(this.preChatFormGroup.value);
    } catch (error) {
      alert('Error while submitting the form');
    }
  }

  onCallbackFormSubmit(): void {
    try {
      let callbackData = this.callbackFormGroup.value;
      console.log('Callback Data:', callbackData);
      this.callbackLoader = true;
      this.sdk.sendCallbackRequest(this.callbackConfig, callbackData)
    } catch {
      alert('Error while submitting the form');
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
          message: 'Mandatory attributes are missing',
        },
      };
      console.log(Response);
    } else if (eventType == 'startChat') {
      this.eventTriggerType = 'startChat';
      let user = { data: this.customerData };
      localStorage.setItem('user', JSON.stringify(user));
      if (localStorage.getItem('user')) {
        this.sdk.makeConnection(
          this.customerData.serviceIdentifier,
          this.customerData.channelCustomerIdentifier,
        );
        this.customerIdentifier = this.customerData.channelCustomerIdentifier;
        this.serviceIdentifier = this.customerData.serviceIdentifier;
      }
    }
  }

  getEventPayload(preChatFormData: any) {
    return {
      serviceIdentifier: this.serviceIdentifier,
      channelCustomerIdentifier: preChatFormData.customer_channel_identifier,
      browserDeviceInfo: {
        browserId: null,
        browserIdExpiryTime: null,
        browserName: null,
        deviceType: null,
      },
      queue: '',
      locale: {
        timezone: null,
        language: null,
        country: null,
      },
      formData: this.getFormDataByPreChatForm(preChatFormData),
    };
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
    console.log('wrapper closed');
    this.additionalPanel = false;
    sessionStorage.setItem('wrapper-hide', 'true');
  }

  changeScreen(screen: any) {
    console.log('Change Screen:', screen);
    switch (screen) {
      case 'widget':
        if (sessionStorage.getItem('wrapper-hide') === 'true') {
          this.additionalPanel = false;
        } else {
          this.additionalPanel = true;
        }
        this.preChatFormScreen = false;
        this.callbackFormScreen = false;
        this.callbackResponseScreen = false;
        this.widgetChatScreen = false;
        this.isIconWidget = true;
        this.chatError = false;
        this.chatEndScreen = false;
        this.isChatMax = false;
        this.isCallbackMax = false;
        break;
      case 'chat':
        this.additionalPanel = false;
        this.preChatFormScreen = false;
        this.callbackFormScreen = false;
        this.callbackResponseScreen = false;
        this.widgetChatScreen = true;
        this.isIconWidget = true;
        this.chatError = false;
        this.chatEndScreen = false;
        this.isChatMax = true;
        this.isCallbackMax = false;
        this.changeView('chat');
        break;
      case 'chatForm':
        this.preChatFormScreen = true;
        this.callbackFormScreen = false;
        this.callbackResponseScreen = false;
        this.additionalPanel = false;
        this.isIconWidget = true;
        this.widgetChatScreen = false;
        this.chatError = false;
        this.chatEndScreen = false;
        this.isChatMax = true;
        this.isCallbackMax = false;
        break;
      case 'callbackForm':
        this.preChatFormScreen = false;
        this.callbackFormScreen = true;
        this.callbackResponseScreen = false;
        this.additionalPanel = false;
        this.isIconWidget = true;
        this.widgetChatScreen = false;
        this.chatError = false;
        this.chatEndScreen = false;
        this.isChatMax = false;
        this.isCallbackMax = true;
        break;
      case 'callbackResponse':
        this.additionalPanel = false;
        this.preChatFormScreen = false;
        this.callbackResponseScreen = true;
        this.widgetChatScreen = false;
        this.isIconWidget = true;
        this.chatError = false;
        this.chatEndScreen = false;
        this.isChatMax = false;
        this.isCallbackMax = true;
        // this.changeView('chat');
        break;
      case 'end':
        this.preChatFormScreen = false;
        this.callbackFormScreen = false;
        this.callbackResponseScreen = false;
        this.widgetChatScreen = false;
        this.chatEndScreen = true;
        this.chatError = false;
        this.isIconWidget = true;
        this.isChatMax = true;
        this.isCallbackMax = false;
        break;
      case 'error':
        this.preChatFormScreen = false;
        this.callbackFormScreen = false;
        this.callbackResponseScreen = false;
        this.widgetChatScreen = false;
        this.chatEndScreen = false;
        this.chatError = true;
        this.isIconWidget = true;
        this.isChatMax = true;
        this.isCallbackMax = false;
        break;
    }
  }

  changeView(view: any) {
    console.log('Change Screen:', view);
    switch (view) {
      case 'chat':
        this.activeChatView = true;
        this.activeAudioView = false;
        this.activeVideoView = false;
        this.callPopUpView = false;
        this.activeCallbackView = false;
        this.activeCallbackResponseView = false;
        break;
      case 'callback':
        this.activeChatView = false;
        this.activeAudioView = false;
        this.activeVideoView = false;
        this.callPopUpView = false;
        this.activeCallbackView = true;
        this.activeCallbackResponseView = false;
        break;
      case 'callbackResponse':
        this.activeChatView = false;
        this.activeAudioView = false;
        this.activeVideoView = false;
        this.callPopUpView = false;
        this.activeCallbackView = false;
        this.activeCallbackResponseView = true;
        break;
      case 'audio':
        if (this.isCallActive) {
          this.activeChatView = false;
          this.activeAudioView = true;
          this.activeVideoView = false;
          this.callPopUpView = false;
          this.activeCallbackView = false;
          this.activeCallbackResponseView = false;
          // this.startCountdown();
        } else {
          this.callPopUpView = true;
          this.activeChatView = true;
          this.activeAudioView = false;
          this.activeVideoView = false;
          this.activeCallbackView = false;
          this.activeCallbackResponseView = false;
          this.initiateVoiceCall(view);
        }
        break;
      case 'video':
        this.activeChatView = false;
        this.activeAudioView = false;
        this.activeVideoView = true;
        this.activeCallbackView = false;
        this.activeCallbackResponseView = false;
        break;
    }
  }
  eventListener(event: any) {
    try {
      if (event.id !== undefined || event.id !== '' || event.id !== null) {
        switch (event.type) {
          case 'SOCKET_CONNECTED':
            if (this.eventTriggerType === 'startChat') {
              this.chatPayLoad = {
                type: 'CHAT_REQUESTED',
                data: this.customerData,
              };
              this.sdk.sendChatRequest(this.chatPayLoad);
              if (this.enabledWebhook) this.sdk.sendWebhookNotification(this.webhookUrl, this.chatPayLoad);
              console.log('New Chat Start Request Sent');
            } else if (this.eventTriggerType === '') {
              console.log('Chat Resume Request Sent');
              this.sdk.onChatResumed(
                this.customerData.serviceIdentifier,
                this.customerData.channelCustomerIdentifier,
              );
            }
            this.changeScreen('chat');
            console.log('event response:', this.customerData);
            break;
          case 'CHANNEL_SESSION_STARTED':
            this.isChatActive = true;
            console.log('event response:', event.data);
            this.conversationId = event.data.header.conversationId;
            localStorage.setItem(
              'conversationId',
              event.data.header.conversationId,
            );
            this.sdk.setConversationDataAgainstCustomerIdentifier(this.customerData.channelCustomerIdentifier, this.preChatFormData);
            break;
          case 'MESSAGE_RECEIVED':
            console.log('event response:', event.data);
            this.handleCimMessage(event.data);
            console.log('Cim Message Array: ', this.cimMessage);
            break;
          case 'SOCKET_DISCONNECTED':
            console.log('event response:', event.data);
            localStorage.removeItem('user');
            this.clearSession();
            break;
          case 'CONNECT_ERROR':
            this.changeScreen('error');
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
      console.error('Error on establishing connection: ', error);
    }
  }

  handleCimMessage(cimMessage: any) {
    if (
      cimMessage.body.type.toLowerCase() == 'deliverynotification' &&
      cimMessage.header.sender &&
      (cimMessage.header.sender.type.toLowerCase() == 'agent' ||
        cimMessage.header.sender.type.toLowerCase() == 'bot')
    ) {
      this.updateStatusOfCustomerMessage(
        cimMessage.body.messageId,
        cimMessage.body.status.toLowerCase(),
      );
    } else if (
      cimMessage.body.type.toLowerCase() == 'notification' &&
      cimMessage.body.notificationType.toLowerCase() == 'typing_started'
    ) {
      if (cimMessage.header.sender.type.toLowerCase() == 'agent') {
        console.log('Event  received with data  ', cimMessage.body);

        //if timer exist restart the timer
        if (!this.typingIndicatorTimer) {
          console.log('timer started for indicator to show ', cimMessage.body);

          this.typingIndicatorTimer = setTimeout(() => {
            console.log('timer ended for indicator to show ', cimMessage.body);
            this.typingIndicatorTimer = null;
          }, 5000);
        } else {
          clearTimeout(this.typingIndicatorTimer);
          this.typingIndicatorTimer = setTimeout(() => {
            this.typingIndicatorTimer = null;
          }, 5000);
        }
      }
    } else {
      if (
        cimMessage.body.type.toLowerCase() != 'notification' &&
        cimMessage.header.sender.type.toLowerCase() == 'agent'
      ) {
        clearTimeout(this.typingIndicatorTimer);
        this.typingIndicatorTimer = null;
      }
      this.cimMessage.push(cimMessage);
      this.browserNotificationService.notify(cimMessage);
      this.scrollToBottom();
      this.handleMessageReport(cimMessage);
    }
  }

  updateStatusOfCustomerMessage(messageId: string, status: string) {
    // Implement your logic to update the message status
    let msgStatus;
    if (status.toLowerCase() == 'read') {
      msgStatus = 'seen';
      this.markMessageStatusToSeenOrSucceed(messageId, msgStatus);
    } else if (status.toLowerCase() == 'failed') {
      msgStatus = 'failed';
      this.changeMessageStatusToFailed(messageId, msgStatus);
    }
  }

  markMessageStatusToSeenOrSucceed(msgId: any, msgStatus: string) {
    // find index of the message for the delivery notification
    let index = this.cimMessage.findIndex(
      (message: { id: any }) => message.id == msgId,
    );
    // mark all the previous messages as 'seen' or 'successed' before that message except failed messages
    this.cimMessage.forEach(
      (message: { header: { sender: { type: string } } }, i: number) => {
        if (
          i <= index &&
          (message.header.sender.type.toLowerCase() == 'customer' ||
            message.header.sender.type.toLowerCase() == 'connector')
        ) {
          if (
            !this.cimMessage[i]['sendStatus'] ||
            (this.cimMessage[i]['sendStatus'] &&
              this.cimMessage[i]['sendStatus'] != 'failed')
          ) {
            this.cimMessage[i]['sendStatus'] = msgStatus;
          }
        }
      },
    );
  }

  changeMessageStatusToFailed(msgId: any, msgStatus: string) {
    // find index of the message for the notification
    let index = this.cimMessage.findIndex(
      (message: { id: any }) => message.id == msgId,
    );

    if (index != -1) {
      if (
        this.cimMessage[index].header.sender.type.toLowerCase() == 'customer'
      ) {
        this.cimMessage[index]['sendStatus'] = msgStatus;
      }
    } else {
      if (msgStatus.toLowerCase() == 'failed') {
        alert('unable to start chat');
      }
    }
  }

  handleMessageReport(cimMessage: {
    header: { sender: { type: string } };
    body: { type: string };
    id: any;
  }) {
    if (
      document.hasFocus() &&
      (cimMessage.header.sender.type.toLowerCase() == 'agent' ||
        cimMessage.header.sender.type.toLowerCase() == 'bot')
    ) {
      if (cimMessage.body.type.toLowerCase() != 'notification') {
        this.constructAndPublishMessageSeenNotification(cimMessage.id);
      }
    }
  }

  constructAndPublishMessageSeenNotification(msgId: any) {
    if (this.lastSeenMessageId != msgId) {
      let header = { originalMessageId: null, intent: null };
      let body = {
        markdownText: '',
        type: 'DELIVERYNOTIFICATION',
        messageId: msgId,
        status: 'READ',
        reasonCode: 200,
      };

      this.sdk.sendChatMessage({
        type: 'DELIVERYNOTIFICATION',
        header: header,
        body: body,
        customer: this.customerData,
      });
      this.lastSeenMessageId = msgId;
    }
  }

  processSeenMessages() {
    let latestMessage = this.cimMessage[this.cimMessage.length - 1];
    if (latestMessage) {
      // mark all the message Successed
      this.markMessageStatusToSeenOrSucceed(latestMessage.id, 'successed');

      // mark all the message to seen which are seen by agent or bot
      let latestReadNotificationMessage = this.getLatestDeliveryMessage();
      if (
        latestReadNotificationMessage &&
        latestReadNotificationMessage.body.status.toLowerCase() == 'read'
      ) {
        this.markMessageStatusToSeenOrSucceed(
          latestReadNotificationMessage.body.messageId,
          'seen',
        );
      }
    }
    // mark failed status

    this.cimMessage.forEach((message: any) => {
      if (
        message.body.type.toLowerCase() == 'deliverynotification' &&
        message.body.status.toLowerCase() == 'failed'
      ) {
        this.changeMessageStatusToFailedInHistoryMessages(
          message.body.messageId,
        );
      }
    });
  }

  getLatestDeliveryMessage() {
    for (let i = this.cimMessage.length - 1; i >= 0; i--) {
      const message = this.cimMessage[i];
      if (
        message &&
        message.body.type.toLowerCase() == 'deliverynotification' &&
        message.header.sender &&
        (message.header.sender.type.toLowerCase() == 'agent' ||
          message.header.sender.type.toLowerCase() == 'bot')
      ) {
        return message;
      }
    }
  }

  changeMessageStatusToFailedInHistoryMessages(msgId: any) {
    // find index of the message for the notification
    let index = this.cimMessage.findIndex(
      (message: { id: any }) => message.id == msgId,
    );

    if (index != -1) {
      if (
        this.cimMessage[index].header.sender.type.toLowerCase() == 'customer'
      ) {
        this.cimMessage[index]['sendStatus'] = 'failed';
      }
    }
  }

  textChanged() {
    this.messageElement.nativeElement.focus();
    const el: any = document.getElementById('messageTextarea');
    this.text = el.value;
    this.scrollCon = this.elementView.nativeElement.scrollHeight;
    this.scrollContainer = this.scrollContainer.nativeElement.scrollHeight;
  }

  onSendMessage() {
    this.cdRef.detectChanges();
    this.scrollToBottom();

    if (this.imageUrls.length > 0) {
      this.fileLoading = true;
      let additionalText = '';
      if (this.text.trim() !== '') {
        additionalText = this.text.trim();
        this.clearMessageData();
      }
      this.uploadFile(this.selectedFile, additionalText);
    } else {
      if (this.text.trim() !== '') {
        console.log('Customer message: ', this.text.trim());

        this.constructCimMessage('PLAIN', this.text.trim(), null, null);
        this.clearMessageData();
      }
    }
  }

  scrollToBottom(): void {
    setTimeout(() => {
      try {
        this.scrollContainer.nativeElement.scrollTop =
          this.scrollContainer.nativeElement.scrollHeight;
      } catch (err) { }
    }, 350);
  }

  clearMessageData() {
    this.composer_input_disabled = false;
    this.text = '';
    this.scrollToBottom();
    this.scrollCon = 45;
  }

  constructCimMessage(
    msgType: string,
    text?: string,
    intent?: null | string,
    originalMessageId?: null | string,
    fileMimeType?: string,
    fileName?: string,
    fileSize?: number,
    additionalText?: string,
    fileType?: string,
  ) {
    let header = {
      originalMessageId: null as null | string,
      intent: null as null | string,
      entities: null as null | string,
      sender: {
        id: '460df46c-adf9-11ed-afa1-0242ac120002',
        type: 'CUSTOMER',
        senderName: 'JANE DOE',
        additionalDetail: null,
      },
    };
    let body: {
      markdownText: string;
      type: string;
      caption?: string;
      additionalDetails?: any;
      attachment?: any;
    } = {
      markdownText: '',
      type: '',
    };

    if (msgType.toLowerCase() == 'plain') {
      let transformedIntent = this.transformPayload(intent);
      header.originalMessageId = originalMessageId ? originalMessageId : null;
      header.intent = transformedIntent.intent ? transformedIntent.intent : null;
      if (transformedIntent.entities) {
        header.entities = transformedIntent.entities;
      }
      body.type = 'PLAIN';
      body.markdownText = text!.trim();
    } else if (
      msgType.toLowerCase() == 'application' ||
      msgType.toLowerCase() == 'text'
    ) {
      body.type = 'FILE';
      body.markdownText = additionalText || '';
      body['caption'] = ''; // Here is the 'caption' property
      body['additionalDetails'] = { fileName: fileName };
      body['attachment'] = {
        mediaUrl: `${this.__appConfig.appConfig.FILE_SERVER_URL}/api/downloadFileStream?filename=${fileName}`,
        type: fileMimeType || '',
        size: fileSize || 0,
        extType: fileType || '',
        mimeType: fileMimeType || '',
      };
    } else if (msgType.toLowerCase() == 'image') {
      body.type = 'IMAGE';
      body.markdownText = additionalText || '';
      body['caption'] = fileName;
      body['additionalDetails'] = {};
      body['attachment'] = {
        mediaUrl: `${this.__appConfig.appConfig.FILE_SERVER_URL}/api/downloadFileStream?filename=${fileName}`,
        type: fileMimeType,
        size: fileSize,
        thumbnail: '',
      };
    } else if (msgType.toLowerCase() == 'video') {
      body.type = 'VIDEO';
      body.markdownText = additionalText || '';
      body['caption'] = fileName;
      body['additionalDetails'] = {};
      body['attachment'] = {
        mediaUrl: `${this.__appConfig.appConfig.FILE_SERVER_URL}/api/downloadFileStream?filename=${fileName}`,
        type: fileMimeType,
        size: fileSize,
        thumbnail: '',
      };
    } else if (msgType.toLowerCase() == 'audio') {
      body.type = 'AUDIO';
      body.markdownText = additionalText || '';
      body['caption'] = fileName;
      body['additionalDetails'] = {};
      body['attachment'] = {
        mediaUrl: `${this.__appConfig.appConfig.FILE_SERVER_URL}/api/downloadFileStream?filename=${fileName}`,
        type: fileMimeType,
        size: fileSize,
        thumbnail: '',
      };
    } else {
      console.log('Unable to process the file');
      this.snackBar.open('unable to process the file', 'err');
      return;
    }

    let msgPayload = {
      type: msgType,
      header: header,
      body: body,
      customer: this.customerData,
    };
    this.sdk.sendChatMessage(msgPayload);
    this.clearMessageData();
    this.fileLoading = false;
    this.imageUrls = [];
    this.selectedFile = null as any;
  }

  previewFile(event: any) {
    if (event.target.files && event.target.files[0]) {
      var filesAmount = event.target.files;
    } else if (event.dataTransfer.files.length > 0) {
      filesAmount = event.dataTransfer.files;
    }

    if (filesAmount) {
      this.selectedFile = filesAmount;
      for (let i = 0; i < filesAmount.length; i++) {
        const reader = new FileReader();
        reader.onload = (event: any) => {
          console.log(this.imageUrls, 'urlssssssss');
          this.imageUrls.push({
            filesPath: this.sanitizer.bypassSecurityTrustUrl(
              event.target.result,
            ),
            fileType: event.target.result.split(':')[1].split('/')[0],
            fileExt: event.target.result
              .split(':')[1]
              .split('/')[1]
              .split(';')[0],
            fileName: filesAmount[i].name,
          });
        };
        reader.readAsDataURL(filesAmount[i]);
      }
    }
  }

  uploadFile(files: any, additionalText: string) {
    let availableExtensions = [
      'txt',
      'png',
      'jpg',
      'jpeg',
      'pdf',
      'ppt',
      'pptx',
      'xlsx',
      'xls',
      'doc',
      'docx',
      'rtf',
      'mp3',
      'mp4',
      'webp',
    ];
    let ln = files.length;
    if (ln > 0) {
      for (var i = 0; i < ln; i++) {
        const fileSize = files[i].size;
        const fileMimeType = files[i].name.split('.').pop();

        if (fileSize <= 5000000) {
          if (availableExtensions.includes(fileMimeType.toLowerCase())) {
            let fd = new FormData();
            fd.append('file', files[i]);
            fd.append(
              'conversationId',
              `${Math.floor(Math.random() * 90000) + 10000}`,
            );
            console.log('ready to Upload File', fileSize, fileMimeType);

            this.sdk.moveToFileServer(
              fd,
              (res: { type: string; name: string; size: any }) => {
                this.constructCimMessage(
                  res.type.split('/')[0],
                  '',
                  null,
                  null,
                  res.type,
                  res.name,
                  res.size,
                  additionalText,
                  res.name.split('.').pop(),
                );
              },
            );
          } else {
            console.log(files[i].name + ' File size should be less than 5MB');
            this.snackBar.open(files[i].name + ' unsupported type', 'err', {
              panelClass: 'custom-snackbar',
            });
            this.removeUploadFile();
          }
        } else {
          console.log(files[i].name + ' File size should be less than 5MB');
          this.snackBar.open(
            files[i].name + ' File size should be less than 5MB',
            'err',
            {
              panelClass: 'custom-snackbar',
            },
          );
          this.removeUploadFile();
        }
      }
    }
  }

  removeUploadFile() {
    this.imageUrls = [];
    this.selectedFile = null as any;
  }

  sendButtonMessage(
    data: { title: string; payload: any },
    originalMessageId: any,
  ) {
    if (data.title.trim() !== '') {
      this.constructCimMessage(
        'PLAIN',
        data.title.trim(),
        data.payload,
        originalMessageId
      );
    }
  }

  endChat(): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent);

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.clearSession();
      }
    });
  }

  customerChatResumed() {
    let userData: string | null = localStorage.getItem('user');

    if (userData !== null) {
      let parsedUserData = JSON.parse(userData);
      this.customerData = parsedUserData.data;
      console.log(
        'Checking data ',
        parsedUserData.data.channelCustomerIdentifier,
        parsedUserData.data.serviceIdentifier,
      );
      this.sdk.makeConnection(
        parsedUserData.data.serviceIdentifier,
        parsedUserData.data.channelCustomerIdentifier,
      );
    }
  }
  onTyping() {
    this.isTyping = this.text.trim().length > 0;
  }
  //on every key press
  onKeyPress(event: { key: string }) {
    //not to sent typing started event on enter key
    if (event.key !== 'Enter') {
      this.sendTypingStartedEvent();
    }
  }

  //when enter key is pressed
  onEnterKey(event: { preventDefault: () => void }) {
    if (!this.isMobile) {
      event.preventDefault();
    }
    // clear the timer on enter key press so that we can send fresh typing started event
    //on next key press as receiving message on another end will stop its typing indication
    clearTimeout(this.sendTypingStartedEventTimer);
    this.sendTypingStartedEventTimer = null;
  }

  //to send typing started event
  sendTypingStartedEvent() {
    //if timer is true not to send the event
    if (!this.sendTypingStartedEventTimer) {
      let header = { originalMessageId: null, intent: null };
      let body = {
        markdownText: '',
        type: 'NOTIFICATION',
        notificationType: 'TYPING_STARTED',
      };

      this.sdk.sendChatMessage({
        type: 'NOTIFICATION',
        header: header,
        body: body,
        customer: this.customerData,
      });
      this.sendTypingStartedEventTimer = setTimeout(() => {
        this.sendTypingStartedEventTimer = null;
      }, 3000);
    }
  }

  onTextAreaFocus() {
    let latestAgentMessage = this.getLatestAgentMessage();

    if (latestAgentMessage && latestAgentMessage.body.type != 'notification') {
      this.constructAndPublishMessageSeenNotification(latestAgentMessage.id);
    }
  }

  getLatestAgentMessage() {
    for (let index = this.cimMessage.length - 1; index >= 0; index--) {
      const message = this.cimMessage[index];
      if (message.header.sender.type.toLowerCase() == 'agent') {
        return message;
      }
    }
  }

  chatTranscript() {
    if (localStorage.getItem('conversationId') !== '') {
      window.open(
        `widget-assets/chat-transcript/?ccmUrl=${this.__appConfig.appConfig.CCM_URL
        }&customerIdentifier=${this.customerIdentifier}&serviceIdentifier=${this.serviceIdentifier
        }&conversationId=${localStorage.getItem(
          'conversationId',
        )}&browserLang=${this.browserLang}`,
        '_blank',
      );
      localStorage.removeItem('conversationId');
    }
  }

  loadBrowserLanguage() {
    this.browserLang = navigator.language;
    console.log('Browser language is :' + this.browserLang);
    this.selectedLanguage = this.browserLang;

    if (this.selectedLanguage == 'ar') {
      this.textDirection = 'right-direction';
    }
  }

  // Audio Functions
  toggleCallMic() {
    this.isCallMute = !this.isCallMute; // Use assignment operator and logical NOT operator
    console.log(this.isCallMute);
    this.sdk.handleCallMic();
  }

  toggleCallHold() {
    this.isCallOnHold = !this.isCallOnHold; // Use assignment operator and logical NOT operator
    console.log(this.isCallOnHold);
  }

  initiateVoiceCall(callType: any) {
    this.startCountdown();
    this.sdk.handleCallStart();
    this.isCallActive = true;
  }

  startCountdown(): void {
    const countDownDate = new Date().getTime();
    this.counterVar = setInterval(() => {
      const now = new Date().getTime();
      const distance = now - countDownDate;
      const minutes = (
        '0' + Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
      ).slice(-2);
      const seconds = ('0' + Math.floor((distance % (1000 * 60)) / 1000)).slice(
        -2,
      );
      this.callTime = `${minutes}:${seconds}`;
    }, 1000);
  }

  endCountdown(): void {
    this.callTime = '00:00';
    clearInterval(this.counterVar);
  }

  processCallResponses(data: any): void {
    console.log('sip.js events => ', JSON.stringify(data.event));
    switch (data.event) {
      case 'registered':
        console.log('customer_data', this.customerData);
        let userData = {
          phone: this.customerData.formData.attributes.phone,
          name: this.customerData.formData.attributes.name,
          email: this.customerData.formData.attributes.email,
          // 'message': 'hello world'
        };
        this.sdk.sendCallRequest('audio', 'remoteAudio', '', userData);
        break;
      case 'unregistered':
        console.log('unregistered');
        break;
      case 'registrationFailed':
        console.log('registrationFailed');
        break;
      case 'get_dynamic_ext':
        console.log('get dynamic ext');
        break;
      case 'Channel Creating':
        console.log('Channel Creating');
        break;
      case 'session-accepted':
        console.log('session-accepted');
        this.changeView('audio');
        break;
      case 'session-progress':
        console.log('session-progress ->' + data.response);
        break;
      case 'session-rejected':
        console.log(
          'session-rejected->' + data.response + '------' + data.cause,
        );
        break;
      case 'session-failed':
        console.log('session-failed ->');
        break;
      case 'session-terminated':
        console.log('testing->' + data.response + '------' + data.cause);
        this.isCallActive = false;
        this.endCountdown();
        this.changeView('chat');
        break;
      case 'session-bye':
        console.log('testing->' + data.response);
        break;
      case 'session-session_ended':
        console.log('session-session_ended ->');
        this.isCallActive = false;
        this.endCountdown();
        this.changeView('chat');
        break;
      case 'session-SessionDescriptionHandler-Media acquire start':
        console.log('session-SessionDescriptionHandler-Media acquire start ->');
        break;
      case 'session-SessionDescriptionHandler-Media acquire end':
        console.log('session-SessionDescriptionHandler-Media acquire end ->');
        break;
    }
  }

  callEnd() {
    this.endCountdown();
    this.sdk.handleCallEnd();
  }

  changeFont() {
    console.log('font dropdown clicked');
    this.fontDropDown = !this.fontDropDown; // Toggle the fontDropDown variable
  }
  setFontSize(e: any) {
    console.log("Set fontsize", e);
    try {
      localStorage.setItem("fontSize", e);
      this.changeFont();
      this.setFontFromLocalStorage();
    } catch (error) { }
  }

  private setFontFromLocalStorage() {
    try {
      if (localStorage.getItem("fontSize") !== null) {
        this.fontSize.setValue(localStorage.getItem("fontSize"));
      }
    } catch (error) { }
  }

  clearSession() {
    if (this.isCallActive) {
      this.callEnd();
    }
    this.cimMessage = [];
    this.isChatActive = false;
    this.changeScreen('end');
    this.sdk.handleChatEnd(this.customerData);
    this.clearMessageData();
  }

  transformPayload(input: any) {
    // Remove the first '/'
    if (input) {
      const trimmedInput = input.replace(/^\//, '');
      // Check if the input contains a JSON-like string
      const entitiesMatch = trimmedInput.match(/\{.*\}/);
      const entities = entitiesMatch ? JSON.parse(entitiesMatch[0]) : null;
      // Remove the JSON-like string from the trimmed input
      const intent = entitiesMatch ? trimmedInput.replace(entitiesMatch[0], '') : trimmedInput;
      return { intent, entities };
    }
    return { intent: null, entities: null }
  }
}
