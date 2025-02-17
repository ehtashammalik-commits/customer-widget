import {
  AfterViewInit,
  Component,
  OnInit,
  ElementRef,
  Renderer2,
  ViewChild,
  Input,
  ChangeDetectorRef,
} from '@angular/core';
import {
  FormGroup,
  FormBuilder,
  Validators,
  FormControl,
} from '@angular/forms';
import { SdkService } from '../services/sdk.service';
import { ConfigService } from '../services/config.service';
import { BrowserNotificationService } from '../services/browser-notification.service';
import { DeliveryNotificationService } from '../services/delivery-notification.service';
import { PostMessageHandlerService } from '../post-message-handler.service';
import { Subscription } from 'rxjs';
import { CdkTextareaAutosize } from '@angular/cdk/text-field';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { ActivatedRoute } from '@angular/router';
import { TooltipPosition } from '@angular/material/tooltip';
declare var EmojiPicker: any;

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
  private onWebRtcCallSubject: Subscription = new Subscription();
  private onCallbackRequestSubject: Subscription = new Subscription();
  private onDataRequest: Subscription = new Subscription();
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

  // @ViewChild('remoteVideo') remoteVideo!: ElementRef;
  // @ViewChild('localVideo') myVideoLocal!: ElementRef;
  @ViewChild('remoteVideo', { static: false }) remoteVideo!: ElementRef;
  @ViewChild('localVideo', { static: false }) localVideo!: ElementRef;

  scrollTop = 0;
  fontSize = new FormControl('12');
  public scrollCon: any;
  webRtcSecureLink: string | null = null; // variable to store secure link got from URL params
  customerIdentifier: any; // variable to store customer channel identifier got from URL params
  widgetIdentifier: string | null = null; // variable to store widget identifier got from URL params
  serviceIdentifier: any; // variable to store service identifier got from URL params

  sendTypingStartedEventTimer: any = null;
  eventTriggerType = '';

  additionalPanel = false; // If true will show Popup Panel on top of widget icon
  isIconWidget = true; // If true will show widget icon
  preChatFormScreen = false; // If true will show pre chat form screen
  widgetChatScreen = false; // If true will show widget Chat screen
  chatError = false; // If true will show error in case of chat failure.
  chatEndScreen = false; //If true will show chat End Screen at the end of Chat

  callbackFormScreen = false; // If true will show callback form screen to schedule callback
  callbackResponseScreen = false; // If true will show Callback Response screen after receiving response from server

  // if true will enable standalone webRTC video call feature
  webRtcVideoCallScreen: boolean = false;
  // Authentication Token to be used for authenticating the user in case of secure token based webRTC calls.
  sessionCode: string = '';
  // If this flag is set as 'true', then it means that our Session code is invalid
  showInvalidCodeError: boolean = false;
  showAuthenticationResponseMessage: string = '';
  setAuthorizedResponse: any;
  // If this flag is set as 'true' then it means that our Standalone WebRTC Video Call is Active
  // we need not to display anything else apart from the Video Streams
  isWebRtcVideoCallActive: boolean = false;

  // This Popup Screen will only be visible when every any webRTC Call is initiated and call is not connected end-to-end
  callPopUpView = false;
  // Main Screen Views
  // function changeView()
  // (this variables will help us to navigate between views while having active chat session)
  activeChatView = false;
  activeAudioView = false;
  activeVideoView = false;
  activeScreenShareView = false;
  activeCallbackView = false;
  activeCallbackResponseView = false;
  customerData: any;
  preChatFormData: any;
  chatPayLoad: any;
  public cimMessage: any[] = [];
  typingIndicatorTimer: any = null;
  lastSeenMessageId: any = null;
  conversationId = '';
  formValidations: any;
  // If this flag is 'true' than that's mean Chat is Active
  isChatActive = false;
  // If this flag is 'true' than that's mean Audio Call is Active (In Side Chat Screen)
  isAudioCallActive = false;
  // If this flag is 'true' than that's mean Video Call is Active (In Side Chat Screen)
  isVideoCallActive = false;
  // If this flag is 'true' than that's mean ScreenShare Call is Active (In Side Chat Screen)
  isScreenShareActive = false;

  // Variables for Call Controls
  isCallMute = false;
  isVideoHide = false;
  isCallOnHold = false;
  //varibales for MAX MIN length of the attributes (short Answer)
  short_ans_maxLength: number = 0;
  short_ans_minLength: number = 0;
  //(paragraph)
  paragraph_maxLength: number = 0;
  paragraph_minLength: number = 0;

  // remoteVideoActive = true;
  // localVideoActive = true;

  alphaNumeric_maxLength: number = 0;
  alphaNumeric_minLength: number = 0;

  alphaNumericSpecial_maxLength: number = 0;
  alphaNumericSpecial_minLength: number = 0;

  password_maxLength = 0;
  password_minLength = 0;
  // Audio Screen Variables
  counterVar: any; // will be used in count down timer
  agentName: string = 'Expertflow Agent'; // Agent Name during Active call will be pushed in this variable to show on the screen
  callTime: string = '00:00'; //Default value on the timer is set and updated will be added in it
  callText: string = ''; // this variable will contains the value of which type call is initiated ('audio' / 'video')
  maintainDialog: any; // this variable will maintain the dialog payload during video / audio calls.
  dialogId: any; // this variable will maintain the active call dialog ID

  // Variables to check which widget is maximized , so that appropriate icon can be shown
  isChatMax = false;
  isCallbackMax = false;
  isWebRtcMax = false;

  enabledCallback: boolean = false; // If true than show callback button in toolbar
  callbackResponseStatus = ''; // Callback Response Status Text to show on the Callback response Screen
  enabledWebhook: boolean = false; //If true than show webhook is enabled in the widget and will push notification to defined webhook
  file_attribute_key: any;

  standaloneCallback: boolean = false; //If true than it will enable standalone callback
  standaloneWebRtc: boolean = false; //If true than it will enable standalone webRtc Video Call and hide Chat Features
  isSecureWebCall: boolean = false;
  errorDuringWebRTCCall: boolean = false;
  errorMessage: string = "";

  fontDropDown = false;
  positionOptions: TooltipPosition[] = [
    'after',
    'before',
    'above',
    'below',
    'left',
    'right',
  ];
  matToolTipPosition = this.positionOptions[4];
  isMobile = false;

  dictionary: { [key: string]: string } = {
    Alphanum100: 'Alpha Numeric',
    AlphanumSpecial200: 'Alpha Numeric ',
    Boolean: 'Boolean',
    Email: 'Email',
    IP: 'IP',
    Number: 'Number',
    Password: 'Password',
    PositiveNumber: 'Positive Number',
    PhoneNumber: 'Phone Number',
    String50: 'String',
    String100: 'String',
    String2000: 'String',
    URL: 'URL',
    alphaNumeric: 'Alpha Numeric',
    alphaNumericSpecial: 'Alpha Numeric',
    boolean: 'Boolean',
    email: 'Email',
    ip: 'IP',
    number: 'Number',
    password: 'Password',
    positiveNumber: 'Positive Number',
    phoneNumber: 'Phone Number',
    shortAnswer: 'Short Answer',
    paragraph: 'Paragraph',
    url: 'URL',
    date: 'Date',
    time: 'Time',
    dateTime: 'Date and Time',
    file: 'File',
  };



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
  enableWebRtc: boolean = false;
  webRTCConfig: any;
  messageLimit: number = 300; // Set the desired maximum length
  text: string = '';
  composer_input_disabled: boolean = false;
  isTyping: boolean = true;
  surveyTitle: any = 'Survey Form';
  remoteStream: any = [];
  localStream: any = [];

  @Input() formData!: any[];
  @Input() callbackFormData!: any[];
  preChatFormGroup!: FormGroup;
  callbackFormGroup!: FormGroup;
  preChatFormLoader = false;
  callbackLoader = false;
  callbackConfig: any;


  webhookUrl: any;

  // Upload File Variables
  imageUrls: {
    filesPath: SafeUrl;
    fileType: string;
    fileExt: string;
    fileName: string;
  }[] = [];

  fileLoading = false;
  selectedFile!: File;
  fileUrl: any = "";
  fileName: string | null = null;
  // Variables for handling chat messages language and text directions
  selectedLanguage: any;
  browserLang: any;
  textDirection = '';
  logoEnabled: boolean = false;
  isUsernameEnabled: boolean = true;

  browserInfoData: any;
  // Handle Composer Field
  isComposerDisable: boolean = false;
  isSecureLinkExpired: boolean = false;
  IsRegisteredInFreeSwitch: boolean = false;
  constructor(
    private route: ActivatedRoute,
    private fb: FormBuilder,
    public sdk: SdkService,
    public __appConfig: ConfigService,
    private el: ElementRef,
    private renderer: Renderer2,
    private cdRef: ChangeDetectorRef,
    private sanitizer: DomSanitizer,
    private snackBar: MatSnackBar,
    public dialog: MatDialog,
    private browserNotificationService: BrowserNotificationService,
    private deliveryNotificationService: DeliveryNotificationService,
    private __postMessageHandlerService: PostMessageHandlerService,
  ) {
    this.logoEnabled = __appConfig.appConfig.ENABLE_LOGO;
    this.additionalPanel = __appConfig.appConfig.ADDITIONAL_PANEL;
    this.isUsernameEnabled = __appConfig.appConfig.USERNAME_ENABLED
  }

  ngAfterViewInit(): void {
    // Load the standalone webRtc Authentication screen or the active chat screen depending on whether the user is coming from secure link or not.
    if (this.standaloneWebRtc) {
      this.authenticateToken(false);
    } else {
      this.customerChatResumed();
      console.log('Not Secure Chat View');
    }
    // Set the Customer widget Theme Color based on Configurations coming from unified admin's web widget settings
    setTimeout(() => {
      (this.el.nativeElement as HTMLElement).style.setProperty(
        '--main-color',
        this.theme,
      );
    }, 1000);
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe((params: { [x: string]: any }) => {
      this.customerIdentifier = params['channelCustomerIdentifier'];
      this.serviceIdentifier = params['serviceIdentifier'];
      this.widgetIdentifier = params['widgetIdentifier'];

      // Assuming all spaces in the decoded encryptedKey should actually be '+' signs
      const rawEncryptedKey = params['encryptedKey']
        ? params['encryptedKey']
        : null;
      if (rawEncryptedKey !== null) {
        console.log("rawEncrypedKey", rawEncryptedKey)
        // Directly replace spaces with '+' if you're sure there should be no spaces
        this.webRtcSecureLink = rawEncryptedKey;
      } else {
        this.webRtcSecureLink = null;
      }
      if (this.webRtcSecureLink != undefined && this.webRtcSecureLink != '') {
        this.standaloneWebRtc = true;
        if (this.widgetIdentifier == undefined || this.widgetIdentifier == '') {
          alert(
            'Error: Please check with Administrator. Widget identifier is missing!!!',
          );
        }
        console.log(
          'Secure Link:',
          this.webRtcSecureLink,
          this.widgetIdentifier,
        );
      } else {
        this.standaloneWebRtc = false;
        if (
          this.serviceIdentifier == undefined ||
          this.serviceIdentifier == ''
        ) {
          alert(
            'Error: Please check with Administrator. Service identifier is missing!!!',
          );
        }
        if (this.widgetIdentifier == undefined || this.widgetIdentifier == '') {
          alert(
            'Error: Please check with Administrator. Widget identifier is missing!!!',
          );
        }
        if (
          this.__appConfig.appConfig.CHANNEL_IDENTIFIER ===
          'channel_customer_identifier'
        ) {
          if (
            this.customerIdentifier == undefined ||
            this.customerIdentifier == '' ||
            this.customerIdentifier == null
          ) {
            alert(
              "Warning: 'channelCustomerIdentifier' parameter is missing in the url, Required for Customer Identification!!!",
            );
          }
        }
      }
      // Pass parameters to service after you have received them.
      this.passUrlParamsToServices();
    });

    this.preChatFormGroup = this.fb.group({});
    this.callbackFormGroup = this.fb.group({});

    this.widgetConfigsSubscription = this.sdk.widgetConfigs$.subscribe(
      (configs: { form: string }) => {
        this.setWidgetConfigs(configs);

        this.loadBrowserLanguage();
        console.log('Widget configurations:', configs);
        if (this.enabledCallback) {

          this.sdk.renderCallbackForm(this.callbackConfig.callBackForm);
        }
        this.sdk.getFormValidation(() => {
          if (configs.form !== '') this.sdk.renderPreChatForm(this.preChatFormId);
        });

      },
    );

    this.sdk.validationsSubcription.subscribe((res) => {
      this.formValidations = res;
      // this.createFormControls();
    });

    this.preChatFormSubscription = this.sdk.renderPreChatForm$.subscribe(
      (formData: { sections: { attributes: any[] }[] }) => {
        this.formData = formData.sections[0].attributes.filter((item: any) => {
          return item.valueType != 'checkbox';
        });
        this.createFormValidationControls(
          this.formData,
          this.formValidations,
          'preChatForm',
        );
      },
    );
    this.callbackFormSubscription = this.sdk.renderCallbackForm$.subscribe(
      (formData: { sections: { attributes: any[] }[] }) => {
        this.callbackFormData = formData.sections[0].attributes.filter(
          (item: any) => {
            return item.valueType != 'checkbox';
          },
        );
        this.createFormValidationControls(
          this.callbackFormData,
          this.formValidations,
          'callBackForm',
        );
      },
    );

    this.onChatResumedSubject = this.sdk.onChatResumedResponse$.subscribe(
      (data: { isChatAvailable: boolean; data: any[] }) => {
        if (data.isChatAvailable == true) {
          this.changeScreen('chat');
          console.log('on Chat Resumed Response:', data.data);
          this.handleResumedMessages(data.data);
        } else if (data.isChatAvailable == false) {
          localStorage.removeItem('widget-error');
          this.changeScreen('end');
        }
        this.scrollToBottom();
      },
    );

    this.onWebRtcCallSubject = this.sdk.onWebRtcCallResponse$.subscribe(
      (data: any) => {
        this.handleDialogStates(data);
      },
    );

    this.onCallbackRequestSubject =
      this.sdk.onCallbackRequestResponse$.subscribe(
        (data: { status: { name: string } }) => {
          console.log('callback request response events => ', data);

          if (data && data.status && data.status.name) {
            this.callbackResponseStatus = data.status.name.toLowerCase();
          } else {
            this.callbackResponseStatus = 'error';
            console.error('Something Went Wrong Please check logs');
          }
          this.callbackLoader = false;
          this.isChatActive
            ? this.changeView('callbackResponse')
            : this.changeScreen('callbackResponse');
        },
      );

    this.establishConnectionSubject = this.sdk.connectionResponse$.subscribe(
      (response: any) => {
        console.log('Connection Response:', response);
        if (response) {
          this.eventListener(response);
          console.log('event listener:', response);
        }
      },
    );

    this.__postMessageHandlerService.browserInfoData$.subscribe((data) => {
      this.browserInfoData = data;
      console.log('Browser Info Data in Component: ', this.browserInfoData);
    });

    this.loadBrowserLanguage();
    this.setFontFromLocalStorage();
  }

  async passUrlParamsToServices() {
    await this.sdk.receiveUrlParamsValue(
      this.widgetIdentifier,
      this.serviceIdentifier,
    );
  }

  private createFormValidationControls(
    formSchema: any,
    formValidation: any,
    formType: string,
  ): void {
    for (const attribute of formSchema) {
      const matchingValidation = formValidation.find((validation: any) => {
        return validation.type === attribute.valueType;
      });

      const validators = attribute.isRequired ? [Validators.required] : [];
      const controlName = attribute.key;
      let minLength = 1;
      let maxLength = 101;
      let extractedLength;

      if (matchingValidation && matchingValidation.regex) {
        switch (matchingValidation.type.toLowerCase()) {
          case 'phonenumber':
            const phoneNumberRegex = new RegExp(
              '^(\\+\\d{1,3}[\\s-])?\\(?\\d{1,4}\\)?[\\s-]?\\d{1,4}[\\s-]?\\d{1,9}$',
            );
            validators.push(Validators.pattern(phoneNumberRegex));
            break;

          case 'boolean':
          case 'mcq':
          case 'dropdown':
            if (attribute.isRequired) {
              validators.push(Validators.required);
            }
            break;
          case 'shortanswer':
          case 'alphanumeric':
          case 'alphanumericspecial':
          case 'password':
          case 'paragraph':
          case 'number':
          case 'positivenumber':
            extractedLength = this.extractMinMaxLength(
              matchingValidation.regex,
            );
            validators.push(
              Validators.minLength(extractedLength.minLength ?? minLength),
            );
            validators.push(
              Validators.maxLength(extractedLength.maxLength ?? maxLength),
            );
            if (
              matchingValidation.type.toLowerCase() !== 'shortanswer' &&
              matchingValidation.type.toLowerCase() !== 'paragraph'
            ) {
              validators.push(
                Validators.pattern(
                  matchingValidation.type.toLowerCase() === 'password'
                    ? new RegExp(
                      '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[\\W_])[A-Za-z\\d\\W_]{8,256}$',
                    )
                    : matchingValidation.regex,
                ),
              );
            }

            break;

          case 'datetime':
          case 'date':
          case 'time':
            // Skip validation for date/time types
            break;

          default:
            const correctedRegex = new RegExp(matchingValidation.regex);
            validators.push(Validators.pattern(correctedRegex));
            break;
        }
      }

      if (formType === 'preChatForm') {

        this.preChatFormGroup.addControl(
          controlName,
          this.fb.control('', validators),
        );
      }
    }
  }

  isMaxLengthError(controlName: string, valueType: string): boolean {
    // Check both form groups for the control
    const controlPreChat = this.preChatFormGroup.get(controlName);
    const controlCallback = this.callbackFormGroup.get(controlName);

    // Determine which control to use, prioritizing preChatFormGroup
    const control = controlPreChat || controlCallback;

    if (control) {
      // Determine max length based on control type
      let maxLength: number | null = null;

      if (valueType === 'shortAnswer') {
        maxLength = 101;
      } else if (valueType === 'paragraph') {
        maxLength = 2001;
      } else if (valueType === 'alphaNumeric') {
        maxLength = 101;
      } else if (valueType === 'alphaNumericSpecial') {
        maxLength = 101;
      } else if (valueType === 'number') {
        maxLength = 101;
      } else if (valueType === 'positiveNumber') {
        maxLength = 101;
      } else if (valueType === 'password') {
        maxLength = 256;
      }
      else if (valueType === 'email') {
        maxLength = 101;
      }

      // Ensure maxLength is set
      if (maxLength !== null) {
        // Ensure control value is a string and check length
        const value = control.value as string;

        // Check if the control value length exceeds the maximum length
        return value.length == maxLength; // Ensure strict comparison to identify the issue
      }
    } else {
      console.log('Control does not exist for name:', controlName);
    }

    return false;
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
      console.log('List of webRTC Configs: ', this.webRTCConfig);

      // Check if the input string contains a hyphen
      // for extention ranges purposes...


      // if (this.webRTCConfig.sipExtension.includes('-')) {
      //   let selectedSipExtension = this.pickSipExtension(
      //     this.webRTCConfig.sipExtension,
      //   );

      //   if (this.webRTCConfig.sipExtension) {
      //     let selectedSipExtension = this.webRTCConfig.sipExtension
      //   this.webRTCConfig.sipExtension = selectedSipExtension.toString();
      //   console.log(
      //     'sipExtension range: <==',
      //     selectedSipExtension,
      //     this.webRTCConfig,
      //   );
      // }
      // if (this.enableWebRtc) this.sdk.loginSipWebRtc(this.webRTCConfig);

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

  private extractMinMaxLength(regex: string): {
    minLength: number | null;
    maxLength: number | null;
  } {
    // Extract min/max length from regex
    const minMatch = regex.match(/(?<=.{)\d+/);
    const maxMatch = regex.match(/(?<=,)\d+(?=})/);

    return {
      minLength: minMatch ? parseInt(minMatch[0], 10) : null,
      maxLength: maxMatch ? parseInt(maxMatch[0], 10) : null,
    };
  }

  onFormSubmit(): void {
    try {
      if (this.preChatFormGroup.valid) {
        this.preChatFormLoader = true;
        this.preChatFormData = this.preChatFormGroup.value;
        if (
          this.serviceIdentifier !== '' &&
          this.serviceIdentifier !== null &&
          this.serviceIdentifier !== undefined
        ) {
          let eventPayload = this.getEventPayload(this.preChatFormData);
          console.log('Event Payload: ==>', eventPayload);
          // If Error is false than proceed with the start Chat and user data setting
          if (!eventPayload.error) {
            this.setUserData(eventPayload.data, 'startChat');
          }
        } else {
          this.preChatFormLoader = false;
          alert(
            'Please Check with Administrator. Your service identifier is missing!',
          );
        }
      } else {
        // Mark all controls as touched to trigger validation errors
        this.markFormGroupTouched(this.preChatFormGroup);
      }
    } catch (error) {
      alert('Error while submitting the form');
    }
  }

  onCallbackFormSubmit(): void {
    try {
      let callbackData = this.callbackFormGroup.value;
      console.log('Callback Data:', callbackData);
      this.callbackLoader = true;
      this.sdk.sendCallbackRequest(this.callbackConfig, callbackData);
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
      this.preChatFormLoader = false;
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

  checkFieldValue(
    data: { [x: string]: any; hasOwnProperty: (arg0: any) => any },
    field: any,
  ) {
    if (data.hasOwnProperty(field)) {
      const value = data[field];
      // Check if the value is not null, empty, or undefined
      if (value !== null && value !== undefined && value !== '') {
        return { error: false, data: value };
      } else {
        const err = `This Field "${field}" is required.`;
        return { error: true, data: err };
      }
    } else {
      const err = `Error: The field "${field}" does not exist in the pre-chat form.`;
      return { error: true, data: err };
    }
  }

  getEventPayload(preChatFormData: any) {
    const channelIdentifierData = this.checkFieldValue(
      preChatFormData,
      this.__appConfig.appConfig.CHANNEL_IDENTIFIER,
    );
    if (channelIdentifierData.error) {
      this.preChatFormLoader = false;
      alert(channelIdentifierData.data);
      return channelIdentifierData;
    } else {
      return {
        error: false,
        data: {
          serviceIdentifier: this.serviceIdentifier,
          channelCustomerIdentifier: channelIdentifierData.data,
          browserDeviceInfo: {
            browserId: this.browserInfoData?.systemInfo?.browserId
              ? this.browserInfoData.systemInfo.browserId
              : null,
            browserIdExpiryTime: null,
            browserName: this.browserInfoData?.systemInfo?.browserName
              ? this.browserInfoData.systemInfo.browserName
              : null,
            deviceType: this.browserInfoData?.systemInfo?.deviceType
              ? this.browserInfoData.systemInfo.deviceType
              : null,
          },
          queue: '',
          locale: {
            timezone: this.browserInfoData?.geoLocationData?.time_zone?.name
              ? this.browserInfoData.geoLocationData.time_zone.name
              : null,
            language: this.browserInfoData?.geoLocationData?.languages
              ? this.browserInfoData.geoLocationData.languages
              : null,
            country: this.browserInfoData?.geoLocationData?.country_name
              ? this.browserInfoData.geoLocationData.country_name
              : null,
          },
          formData: this.getFormDataByPreChatForm(preChatFormData),
        },
      };
    }
  }

  getFormDataByPreChatForm(preChatFormData: any[]): any {
    return {
      id: Math.random(),
      formId: this.preChatFormId,
      filledBy: 'web-widget',
      attributes: this.convertJsonToArray(preChatFormData),
      createdOn: new Date(),
    };
  }

  convertJsonToArray(jsonObject: any): any {
    return Object.entries(jsonObject).map(([key, value]) => ({
      value: value,
      key: key,
      type: typeof value === 'string' ? 'string' : typeof value,
    }));
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
        if (
          sessionStorage.getItem('wrapper-hide') === 'true' ||
          this.__appConfig.appConfig.ADDITIONAL_PANEL !== true
        ) {
          this.additionalPanel = false;
        } else {
          this.additionalPanel = true;
        }
        this.preChatFormScreen = false;
        this.callbackFormScreen = false;
        this.webRtcVideoCallScreen = false;
        this.callbackResponseScreen = false;
        this.widgetChatScreen = false;
        this.isIconWidget = true;
        this.chatError = false;
        this.chatEndScreen = false;
        this.isChatMax = false;
        this.isCallbackMax = false;
        this.isWebRtcMax = false;
        this.fileName = '';
        break;
      case 'chat':
        this.additionalPanel = false;
        this.preChatFormScreen = false;
        this.callbackFormScreen = false;
        this.webRtcVideoCallScreen = false;
        this.callbackResponseScreen = false;
        this.widgetChatScreen = true;
        this.isIconWidget = true;
        this.chatError = false;
        this.isSecureWebCall = false;
        this.chatEndScreen = false;
        this.isChatMax = true;
        this.isCallbackMax = false;
        this.isWebRtcMax = false;
        this.changeView('chat');
        break;
      case 'chatForm':
        this.preChatFormScreen = true;
        this.callbackFormScreen = false;
        this.webRtcVideoCallScreen = false;
        this.callbackResponseScreen = false;
        this.additionalPanel = false;
        this.isIconWidget = true;
        this.widgetChatScreen = false;
        this.chatError = false;
        this.chatEndScreen = false;
        this.isChatMax = true;
        this.isCallbackMax = false;
        this.isWebRtcMax = false;
        break;
      case 'webRtcScreen':
        this.webRtcVideoCallScreen = true;
        this.isWebRtcMax = true;
        this.preChatFormScreen = false;
        this.callbackFormScreen = false;
        this.callbackResponseScreen = false;
        this.additionalPanel = false;
        this.isIconWidget = true;
        this.widgetChatScreen = false;
        this.chatError = false;
        this.chatEndScreen = false;
        this.isChatMax = false;
        this.isCallbackMax = false;
        break;
      case 'callbackForm':
        this.preChatFormScreen = false;
        this.callbackFormScreen = true;
        this.webRtcVideoCallScreen = false;
        this.callbackResponseScreen = false;
        this.additionalPanel = false;
        this.isIconWidget = true;
        this.widgetChatScreen = false;
        this.chatError = false;
        this.chatEndScreen = false;
        this.isChatMax = false;
        this.isCallbackMax = true;
        this.isWebRtcMax = false;
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
        this.isWebRtcMax = false;
        break;
      case 'end':
        this.preChatFormScreen = false;
        this.callbackFormScreen = false;
        this.webRtcVideoCallScreen = false;
        this.callbackResponseScreen = false;
        this.widgetChatScreen = false;
        this.chatEndScreen = true;
        this.chatError = false;
        this.isIconWidget = true;
        this.isChatMax = true;
        this.isCallbackMax = false;
        this.isWebRtcMax = false;
        break;
      case 'error':
        this.preChatFormScreen = false;
        this.callbackFormScreen = false;
        this.webRtcVideoCallScreen = false;
        this.callbackResponseScreen = false;
        this.widgetChatScreen = false;
        this.chatEndScreen = false;
        this.chatError = true;
        this.isIconWidget = true;
        this.isChatMax = true;
        this.isCallbackMax = false;
        this.isWebRtcMax = false;
        break;
    }
    this.cdRef.detectChanges()
  }

  changeView(view: any) {
    if (this.showInvalidCodeError && this.standaloneWebRtc) {
      this.snackBar.open(this.showAuthenticationResponseMessage, 'Dismiss', {
        duration: 3000,
        panelClass: ['error-snackbar'],
        horizontalPosition: 'right',
      });

      return;
    }

    switch (view) {
      case 'chat':
        this.activeChatView = true;
        this.activeAudioView = false;
        this.activeVideoView = false;
        this.activeScreenShareView = false;
        this.callPopUpView = false;
        this.activeCallbackView = false;
        this.activeCallbackResponseView = false;
        // if(this.isAudioCallActive || this.isVideoCallActive) {
        //   console.log("AUDIO / VIDEO CALL IS ACTIVE NOW")
        // }
        // this.sendDataToService(this.dialogId);
        // if (this.enableEmoji) {
        //   setTimeout(() => {
        //     new EmojiPicker();
        //   }, 500)
        // }

        // this.onDataRequest = this.sdk.onDataResponses$.subscribe(
        //   (response: any) => {
        //     if (response) {
        //       console.log("here is the response now", response)
        //       this.sendRemoteData(response)
        //     }
        //   },
        // );

        // this.onDataRequest = this.sdk.setupRemoteMediaResponse$.subscribe((res) => {
        //   console.log("here are the response from the setupRemoteMediaResponses now", res)
        // })
        // this.assignStreams();
        break;
      case 'callback':
        this.activeChatView = false;
        this.activeAudioView = false;
        this.activeVideoView = false;
        this.activeScreenShareView = false;
        this.callPopUpView = false;
        this.activeCallbackView = true;
        this.activeCallbackResponseView = false;
        break;
      case 'callbackResponse':
        this.activeChatView = false;
        this.activeAudioView = false;
        this.activeVideoView = false;
        this.activeScreenShareView = false;
        this.callPopUpView = false;
        this.activeCallbackView = false;
        this.activeCallbackResponseView = true;
        break;
      case 'audio':
        if (this.isAudioCallActive) {
          //this.assignStreams()
          this.activeChatView = false;
          this.activeAudioView = true;
          this.activeVideoView = false;
          this.activeScreenShareView = false;
          this.callPopUpView = false;
          this.activeCallbackView = false;
          this.activeCallbackResponseView = false;
        } else {
          this.callPopUpView = true;
          this.activeChatView = true;
          this.activeAudioView = false;
          this.activeVideoView = false;
          this.activeScreenShareView = false;
          this.activeCallbackView = false;
          this.activeCallbackResponseView = false;
          this.logInToFreeSwitch();
          this.initiateWebRtcCall(view);
        }
        break;
      case 'video':
        if (this.isVideoCallActive) {
          this.activeChatView = false;
          this.activeAudioView = false;
          this.activeVideoView = true;
          this.activeScreenShareView = false;
          this.callPopUpView = false;
          this.activeCallbackView = false;
          this.activeCallbackResponseView = false;
          if (!this.isSecureWebCall) {
            this.isSecureWebCall = false;
          }
          //this.convertCallView('video');
        } else {
          this.callPopUpView = true;
          this.activeVideoView = true;
          this.activeChatView = false;
          this.activeAudioView = false;
          this.activeScreenShareView = false;
          this.activeCallbackView = false;
          this.activeCallbackResponseView = false;
          this.isSecureWebCall = false;
          this.logInToFreeSwitch();
          this.initiateWebRtcCall(view);
        }
        break;
      case 'screenshare':
        if (!this.isSecureWebCall) {
          if (this.isScreenShareActive) {
            this.activeChatView = false;
            this.activeAudioView = false;
            this.activeVideoView = true;
            this.activeScreenShareView = true;
            this.callPopUpView = false;
            this.activeCallbackView = false;
            this.activeCallbackResponseView = false;
          } else {
            this.callPopUpView = true;
            this.activeChatView = false;
            this.activeAudioView = false;
            this.activeVideoView = false;
            this.activeScreenShareView = true;
            this.activeCallbackView = false;
            this.activeCallbackResponseView = false;
            this.logInToFreeSwitch();
            this.initiateWebRtcCall(view);
          }
        } else {
          console.warn("WebRTC Call Is GOING ON")
        }
        break;
      case 'standaloneVideo':
        if (!this.showInvalidCodeError) {
          if (this.isWebRtcVideoCallActive) {
            this.callPopUpView = false;
          } else {
            this.callPopUpView = true;
            this.initiateWebRtcCall('video');
          }
        } else {
          console.warn("Error : Some Issues in initiating Stand alone Call")
        }
        break;
      case 'secureWebVideoCall':
        if (this.isSecureWebCall) {
          this.activeChatView = false;
          this.activeAudioView = false;
          this.activeVideoView = true;
          this.activeScreenShareView = false;
          this.callPopUpView = false;
          this.activeCallbackView = false;
          this.activeCallbackResponseView = false;
        } else {
          this.callPopUpView = true;
          this.activeChatView = false;
          this.activeAudioView = false;
          this.activeVideoView = true;
          this.isSecureWebCall = true;
          this.activeCallbackView = false;
          this.activeCallbackResponseView = false;
          this.initiateWebRtcCall('video');
        }
        break;
    }
    this.cdRef.detectChanges()
  }

  // assignStreams() {
  //   if (document.getElementById('localVideo')) {
  //   this.localStream = document.getElementById('localVideo')
  //   console.log("here is the localStream")
  //   } 

  //   if(document.getElementById('remoteVide')) {
  //   this.remoteStream = document.getElementById('localVideo')
  //   console.log("here is the remoteStream")
  //   }
  // }
  // sendDataToService(dialogueId: string) {
  //   console.log("sending dialogueId from .ts to service",dialogueId)
  //   this.sdk.testingData(dialogueId);
  // }

  // sendRemoteData(session:any) {
  //   this.sdk.remoteMediaStream(session)
  // }

  convertCallView(view: any) {
    switch (view) {
      case 'audio':
        // if (this.isAudioCallActive) {
        //   this.activeChatView = false;
        //   this.activeAudioView = true;
        //   this.activeVideoView = false;
        //   this.activeScreenShareView = false;
        //   this.callPopUpView = false;
        //   this.activeCallbackView = false;
        //   this.activeCallbackResponseView = false;
        // } else {
        //this.callPopUpView = true;
        this.activeChatView = false;
        this.activeAudioView = true;
        this.activeVideoView = false;
        this.activeScreenShareView = false;
        this.activeCallbackView = false;
        this.activeCallbackResponseView = false;
        this.callPopUpView = true;
        this.convertCallRequest(view);
        // }
        break;
      case 'video':
        // if (this.isVideoCallActive) {
        //   this.activeChatView = false;
        //   this.activeAudioView = false;
        //   this.activeVideoView = true;
        //   this.activeScreenShareView = false;
        //   this.callPopUpView = false;
        //   this.activeCallbackView = false;
        //   this.activeCallbackResponseView = false;
        // } else {
        if (!this.isSecureWebCall) {
          this.callPopUpView = true;
          this.activeVideoView = true;
          this.activeChatView = false;
          this.activeAudioView = false;
          this.activeScreenShareView = false;
          this.activeCallbackView = false;
          this.activeCallbackResponseView = false;
          this.convertCallRequest(view);
        }
        // }
        break;
      case 'screenshare':
        // if (this.isScreenShareActive) {
        //   this.activeChatView = false;
        //   this.activeAudioView = false;
        //   this.activeVideoView = false;
        //   this.activeScreenShareView = true;
        //   this.callPopUpView = false;
        //   this.activeCallbackView = false;
        //   this.activeCallbackResponseView = false;
        // } else {
        this.callPopUpView = true;
        this.activeChatView = false;
        this.activeAudioView = false;
        this.activeVideoView = false;
        this.activeScreenShareView = true;
        this.activeCallbackView = false;
        this.activeCallbackResponseView = false;
        this.convertCallRequest(view);
        // }
        break;
      // case 'standaloneVideo':
      //   if (this.isWebRtcVideoCallActive) {
      //     this.isWebRtcVideoCallActive = true;
      //     this.callPopUpView = false;
      //   } else {
      //     this.callPopUpView = true;
      //     this.isWebRtcVideoCallActive = false;
      //     this.initiateWebRtcCall('video');
      //   }
      //   break;
    }
  }

  eventListener(event: any) {
    try {
      let lastMessage = this.cimMessage[this.cimMessage.length - 1];
      let messageType = lastMessage?.body?.type?.toLowerCase();
      if (event.id !== undefined || event.id !== '' || event.id !== null) {
        switch (event.type) {
          case 'CHANNEL_SESSION_ENDED':
          case 'CHANNEL_SESSION_EXPIRED':
          case 'SOCKET_DISCONNECTED':
            localStorage.removeItem('user');
            if (messageType !== 'survey') {
              this.clearSession();
            }
            this.composerDisable()
            break;
          case 'SOCKET_RECONNECTED':
            console.log(
              '[SOCKET_RECONNECTED] ==> Chat Resume Request Sent: ',
              event.data,
            );
            this.sdk.onChatResumed(
              event.data.serviceIdentifier,
              event.data.channelCustomerIdentifier,
            );
            let error = localStorage.removeItem('widget-error');
            this.changeScreen('chat');
            console.log(
              '[SOCKET_RECONNECTED] ==> Chat Resume event response:',
              this.customerData,
            );
            break;
          case 'SOCKET_CONNECTED':
            console.log(
              '[SOCKET_CONNECTED] ==> New Connection Request Response:',
              event.data,
            );
            if (this.eventTriggerType === 'startChat') {
              this.chatPayLoad = {
                type: 'CHAT_REQUESTED',
                data: this.customerData,
              };
              this.sdk.sendChatRequest(this.chatPayLoad);
              if (this.enabledWebhook)
                this.sdk.sendWebhookNotification(
                  this.webhookUrl,
                  this.chatPayLoad,
                );
              console.log('New Chat Start Request Sent');
            } else if (this.eventTriggerType === '') {
              console.log('[SOCKET_CONNECTED] ==> Chat Resume Request Sent');
              this.sdk.onChatResumed(
                this.customerData.serviceIdentifier,
                this.customerData.channelCustomerIdentifier,
              );
            }
            this.changeScreen('chat');
            break;
          case 'CHANNEL_SESSION_STARTED':
            this.isChatActive = true;
            this.isComposerDisable = false;
            this.preChatFormLoader = false;
            this.conversationId = event.data.header.conversationId;
            localStorage.setItem(
              'conversationId',
              event.data.header.conversationId,
            );

            this.sdk.setConversationDataAgainstCustomerIdentifier(
              this.customerData.channelCustomerIdentifier,
              this.preChatFormData,
            );

            // this.composerDisable()
            break;
          case 'MESSAGE_RECEIVED':
            console.log('event response:', event.data);
            this.handleCimMessage(event.data);
            console.log('Cim Message Array: ', this.cimMessage);
            break;
          // case 'SOCKET_DISCONNECTED':
          //   console.log('event response:', event.data);
          //   localStorage.removeItem('user');
          //   if (messageType !== 'survey') {
          //     this.clearSession();
          //   }
          //   break;
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

        // If timer exists, restart the timer
        if (!this.typingIndicatorTimer) {
          console.log('Timer started for indicator to show ', cimMessage.body);

          this.typingIndicatorTimer = setTimeout(() => {
            console.log('Timer ended for indicator to show ', cimMessage.body);
            this.typingIndicatorTimer = null;
          }, 5000);
        } else {
          clearTimeout(this.typingIndicatorTimer);
          this.typingIndicatorTimer = setTimeout(() => {
            this.typingIndicatorTimer = null;
          }, 5000);
        }
      }
    } else if (
      cimMessage.body.type.toLowerCase() == 'plain' &&
      cimMessage.header.sender &&
      (cimMessage.header.sender.type.toLowerCase() == 'agent' ||
        cimMessage.header.sender.type.toLowerCase() == 'bot')
    ) {


      const urlRegex = /(?:https?:\/\/)?(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(?:\/[^\s]*)?/g;
      const urls = cimMessage.body.markdownText.match(urlRegex);
      if (urls) {
        for (let url of urls) {
          if (url.includes('&type=survey')) {
            cimMessage.body.subType = 'SURVEY';
            cimMessage.body.surveyLink = url;
            const normalText = cimMessage.body.markdownText
              .replace(urlRegex, '')
              .trim();
            cimMessage.body.markdownText = normalText;
            break; // Exit the loop if found
          }
        }
      }
      if (cimMessage.header.intent && cimMessage.header.intent.toLowerCase() === 'update') {
        this.editMessage(cimMessage);
        this.handleMessageReport(cimMessage);
      } else {
        this.cimMessage.push(cimMessage);
        this.browserNotificationService.notify(cimMessage);
        this.scrollToBottom();
        this.handleMessageReport(cimMessage);
      }
    } else {
      if (
        cimMessage.body.type.toLowerCase() != 'notification' &&
        cimMessage.header.sender.type.toLowerCase() == 'agent'
      ) {
        clearTimeout(this.typingIndicatorTimer);
        this.typingIndicatorTimer = null;
      }

      if (cimMessage.body.type.toLowerCase() == 'notification') {
        if (
          cimMessage.body.notificationData.data.agentParticipant &&
          cimMessage.body.notificationData.data.agentParticipant.participant &&
          cimMessage.body.notificationData.data.agentParticipant.participant.keycloakUser
        ) {
          let fullName = this.getAgentDisplayName(cimMessage.body.notificationData.data.agentParticipant.participant.keycloakUser);
          if (!this.isUsernameEnabled) {
            cimMessage.body.notificationData.data.agentParticipant.participant.keycloakUser.username = fullName;
          }
        }

        if (
          cimMessage.body.notificationData.data.conversationParticipant &&
          cimMessage.body.notificationData.data.conversationParticipant.participant &&
          cimMessage.body.notificationData.data.conversationParticipant.participant.keycloakUser
        ) {
          let fullName = this.getAgentDisplayName(cimMessage.body.notificationData.data.conversationParticipant.participant.keycloakUser);
          if (!this.isUsernameEnabled) {
            cimMessage.body.notificationData.data.conversationParticipant.participant.keycloakUser.username = fullName;
          }
        }
      }

      if (cimMessage.header.sender.type.toLowerCase() == "agent") {
        let fullName = this.getAgentDisplayName(cimMessage.header.sender.additionalDetail);
        if (!this.isUsernameEnabled) {
          cimMessage.header.sender.senderName = fullName;
        }
      }

      if (cimMessage && cimMessage.header && cimMessage.header.intent && cimMessage.header.intent.toLowerCase() === 'update') {
        this.editMessage(cimMessage);
        this.handleMessageReport(cimMessage);
      } else {
        this.cimMessage.push(cimMessage);
        this.browserNotificationService.notify(cimMessage);
        this.scrollToBottom();
        this.handleMessageReport(cimMessage);
      }
    }
  }

  editMessage(cimMessage: any) {
    const messageId = cimMessage.header.originalMessageId;

    // Find the message by messageId
    const existingMessageIndex = this.cimMessage.findIndex(msg => msg.id === messageId);

    if (existingMessageIndex !== -1) {
      const newContent = cimMessage.body.markdownText
      this.cimMessage[existingMessageIndex].body.markdownText = newContent;
      this.cimMessage[existingMessageIndex].isEdited = true;

    }
  }


  composerDisable() {
    console.log("message element is ", this.messageElement)
    const messageRef: any = this.messageElement?.nativeElement;
    if (messageRef) {
      this.renderer.setAttribute(messageRef, 'disabled', 'true')
      this.renderer.setAttribute(messageRef, 'placeholder', 'Unable to send message')
      this.renderer.setProperty(messageRef, 'value', '');
      this.isComposerDisable = true;
    }

    // this.renderer.setAttribute(messageRef, 'class', 'composer-disable')
  }

  handleResumedMessages(cimMessages: any[]) {
    cimMessages.forEach((cimMessage) => {
      if (
        cimMessage.body.type.toLowerCase() == 'plain' &&
        cimMessage.header.sender &&
        (cimMessage.header.sender.type.toLowerCase() == 'agent' ||
          cimMessage.header.sender.type.toLowerCase() == 'bot')
      ) {
        const urlRegex = /((https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/[^\s]*)?)/g;

        const urls = cimMessage.body.markdownText.match(urlRegex);
        // Check if any URLs are found
        if (urls) {
          urls.forEach((url: string | string[]) => {
            if (url.includes('&type=survey')) {
              cimMessage.body.subType = 'SURVEY';
              cimMessage.body.surveyLink = url;
              cimMessage.body.markdownText = cimMessage.body.markdownText
                .replace(urlRegex, '')
                .trim();
            }
          });
        }
        if (cimMessage.header.intent && cimMessage.header.intent.toLowerCase() === 'update') {
          this.editMessage(cimMessage);
        } else {
          this.cimMessage.push(cimMessage);
        }
        this.isChatActive = true;
        this.processSeenMessages();
        this.scrollToBottom();
      } else {
        if (
          cimMessage.body.type.toLowerCase() != 'notification' &&
          cimMessage.header.sender.type.toLowerCase() == 'agent'
        ) {
          clearTimeout(this.typingIndicatorTimer);
          this.typingIndicatorTimer = null;
        }
        if (cimMessage.header.intent && cimMessage.header.intent.toLowerCase() === 'update') {
          this.editMessage(cimMessage);
        } else {
          this.cimMessage.push(cimMessage);
        }
        this.isChatActive = true;
        this.processSeenMessages();
        this.scrollToBottom();
      }
    });
  }
  getAgentDisplayName(user: any): string {
    if (user) {
      const { firstName, lastName } = user;
      if (firstName && lastName) {
        return `${firstName} ${lastName}`;
      } else if (firstName) {
        return `${firstName}`;
      } else if (lastName) {
        return `${lastName}`;
      } else {
        return 'Agent';
      }
    } else {
      return 'Agent';
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
    this.scrollCon = this.elementView?.nativeElement.scrollHeight;
    this.scrollContainer = this.scrollContainer?.nativeElement.scrollHeight;
  }

  onSendMessage(replyInputValue: any) {
    if (this.isComposerDisable) return;
    this.cdRef.detectChanges();
    this.scrollToBottom();

    if (this.imageUrls.length > 0) {
      this.fileLoading = true;
      let additionalText = '';
      if (replyInputValue.trim() !== '') {
        additionalText = replyInputValue.trim();
        this.clearMessageData();
      }
      this.uploadFile(this.selectedFile, additionalText);
    } else {
      if (replyInputValue.trim() !== '') {
        console.log('Customer message: ', replyInputValue.trim());

        this.constructCimMessage('PLAIN', replyInputValue.trim(), null, null);
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
    console.log("this.elementView.native", this.elementView)
    this.elementView.nativeElement.value = ''
    this.composer_input_disabled = false;
    this.text = '';
    this.scrollToBottom();
    this.scrollCon = 45;
    this.fileName = ''
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
      header.intent = transformedIntent.intent
        ? transformedIntent.intent
        : null;
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
      this.snackBar.open('unable to process the file', 'X');
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
  uploadFileFromForm(
    event: Event,
    additionalText: string,
    restriction: boolean,
    fileTypes: any,
  ): void {
    const input = event.target as HTMLInputElement;
    let responce: any;
    let availableExtensions: any;
    if (input.files && input.files.length > 0) {
      const files = input.files;
      if (restriction) {
        availableExtensions = fileTypes.map((extension: string) =>
          extension.toLowerCase(),
        );
      } else {
        availableExtensions = [
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
      }
      console.log(availableExtensions, 'available extensions: =>');
      const file = files[0];
      const fileSize = file.size;
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      const fileElem = event.target as HTMLInputElement;
      const fileControl = this.preChatFormGroup.get(additionalText) as FormControl;
      if (fileSize <= 5000000) {
        if (fileExtension && availableExtensions.includes(fileExtension)) {
          const fd = new FormData();
          fd.append('file', file);
          fd.append(
            'conversationId',
            `${Math.floor(Math.random() * 90000) + 10000}`,
          );
          console.log('Ready to upload file:', fileSize, fileExtension);

          // Call to the SDK's file upload function
          this.sdk.moveToFileServer(fd, (res: any) => {
            console.log(res, '=> file uploaded data');
            if (res?.isFileInvalid) {
              this.snackBar.open(res?.errorMesage, 'X', {
                panelClass: 'custom-snackbar',
              });
              this.resetFileValidation(event, additionalText)
              return;
            }
            console.log(res.name, '=> file details');
            this.fileName = res.name;
            this.fileUrl = `${this.__appConfig.appConfig.FILE_SERVER_URL}/api/downloadFileStream?filename=${res.name}`;
            console.log('=> file uploaded url', this.fileUrl);
            fileControl?.setValue(this.fileUrl);
          });
        } else {
          console.log(file.name + ' unsupported file type');
          this.snackBar.open(file.name + ' unsupported file type', 'X', {
            panelClass: 'custom-snackbar',
          });
          this.resetFileValidation(event, additionalText)
        }

      } else {
        console.log(file.name + ' file size should be less than 5MB');
        this.snackBar.open(
          file.name + ' file size should be less than 5MB',
          'X',
          {
            panelClass: 'custom-snackbar',
          },
        );
        this.resetFileValidation(event, additionalText)
      }

      fileElem.value = ''
    }
  }
  resetFileValidation(event: Event, additionalText: string) {
    const fileElem = event.target as HTMLInputElement;
    const fileControl = this.preChatFormGroup.get(additionalText) as FormControl;
    this.removeUploadFile();
    this.fileName = ''
    fileControl?.setValue('');
    if (fileElem?.required) {
      fileControl?.setValidators([Validators.required]);
    } else {
      fileControl?.clearValidators();
    }
    fileControl.updateValueAndValidity()
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
            this.snackBar.open(files[i].name + ' unsupported type', 'X', {
              panelClass: 'custom-snackbar',
            });
            this.removeUploadFile();
          }
        } else {
          console.log(this.preChatFormGroup.get(additionalText))
          console.log(files[i].name + ' File size should be less than 5MB');
          this.snackBar.open(
            files[i].name + ' File size should be less than 5MB',
            'X',
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
        originalMessageId,
      );
    }
  }

  endChat(): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent);
    dialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        this.clearSession();
        if (this.IsRegisteredInFreeSwitch) {
          this.callPopUpView = false;
          this.endCountdown();
          this.sdk.handleCallEnd(this.dialogId);
          this.sdk.handleLogOutAgent(this.dialogId);
          this.IsRegisteredInFreeSwitch = false;
        }
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
    } else {
      localStorage.removeItem('widget-error');
      this.changeScreen('widget');
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


  logInToFreeSwitch() {

    if (this.webRTCConfig.sipExtension) {
      let selectedSipExtension = this.webRTCConfig.sipExtension
      this.webRTCConfig.sipExtension = selectedSipExtension.toString();
    }
    if (this.enableWebRtc) this.sdk.loginSipWebRtc(this.webRTCConfig);
  }
  // Audio Functions
  toggleCallMic() {
    this.isCallMute = !this.isCallMute; // Use assignment operator and logical NOT operator
    const action = this.isCallMute ? 'mute_call' : 'unmute_call';
    this.sdk.handleCallMic(action, this.dialogId);
  }

  convertCallRequest(view: any) {
    this.callText = view;
    console.log('convertCallRequest ==>', view);
    if (view === 'video') {
      this.isVideoCallActive = true;
      // this.activeVideoView = true;
      // this.callPopUpView = false;
      this.sdk.convertCall('on', view, this.dialogId);
    } else if (view === 'screenshare') {
      this.isScreenShareActive = true;
      // this.callPopUpView = false;
      this.sdk.convertCall('on', view, this.dialogId);
    } else {
      this.isAudioCallActive = true;
      this.sdk.convertCall('off', 'video', this.dialogId);
    }
  }

  toggleCallVideo() {
    this.isVideoHide = !this.isVideoHide;
    const cameraStatus = this.isVideoHide ? 'off' : 'on';
    this.sdk.convertCall(cameraStatus, 'video', this.dialogId);
  }

  toggleCallHold() {
    this.isCallOnHold = !this.isCallOnHold; // Use assignment operator and logical NOT operator
    console.log(this.isCallOnHold);
    const action = this.isCallOnHold ? 'holdCall' : 'retrieveCall';
    this.sdk.handleCallHoldState(action, this.dialogId);
  }

  initiateWebRtcCall(callType: any) {
    if (callType === "video" || callType === "audio") {
      this.isVideoHide = false;
      this.isCallMute = false;
    }

    this.callText = callType;
    // standAlone Web RTC Call when the link is clicked other than web.
    if (this.standaloneWebRtc) {
      this.sdk.handleCallStart({
        type: callType,
        authConfigs: this.setAuthorizedResponse,
      });

      if (!this.showInvalidCodeError) {
        this.isWebRtcVideoCallActive = true;
        //this.startCountdown();
      }
    }

    // standAlone Web RTC Call when the link is given in active chat / web session as a message..
    if (this.isSecureWebCall) {

      this.sdk.handleCallStart({
        type: callType,
        authConfigs: this.setAuthorizedResponse,
      });
      if (!this.errorDuringWebRTCCall) {
        this.isSecureWebCall = true;
        this.isVideoCallActive = true;
        //this.startCountdown();
      }
    }

    // In case of simple webRTC call

    else {
      if (callType === 'video' && !this.isSecureWebCall) {
        this.isVideoCallActive = true;
      } else if (callType === 'screenshare') {
        this.isScreenShareActive = true;
      } else {
        this.isAudioCallActive = true;
      }
      this.sdk.handleCallStart({
        type: callType,
        authConfigs: this.webRTCConfig,
      });
    }
  }

  startCountdown(): void {
    const countDownDate = new Date().getTime();
    if (!this.counterVar) {
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
  }

  endCountdown(): void {
    this.callTime = '00:00';
    clearInterval(this.counterVar);
  }

  handleDialogStates(data: any): void {
    this.IsRegisteredInFreeSwitch = false;
    console.log('[handleDialogStates] received dialog: ===> ', data);

    if (data.reasonCode === "NO_ANSWER") {
      this.snackBar.open("Call is not picked up", 'X', {
        duration: 2000,  // 5 seconds
        panelClass: ['error-snackbar'],
        horizontalPosition: 'right',
        verticalPosition: 'top'
      });
    }

    if (data.event === "MEDIA_SERVER_CALL_END") {
      const reasonCode = data.reasonCode ? data.reasonCode : "Unknown Error"
      this.snackBar.open(reasonCode, 'Dismiss', {
        duration: 3000,
        panelClass: ['error-snackbar'],
        horizontalPosition: 'right',
      });
    }
    if (data.event === 'agentInfo') {
      console.log(
        '[handleDialogStates] Inside Agent Info Event: ===> ',
        data.response,
      );
      if (data.response.state === 'LOGIN') {
        this.IsRegisteredInFreeSwitch = true;
        console.log(
          '[handleDialogStates] SIP Connection Established with: ===> ',
          data.response.extension,
        );
      } else {
        console.log(
          '[handleDialogStates] SIP Connection Failed with: ===> ',
          data.response.extension,
        );
      }
    }
    if (data.event === 'outboundDialing') {
      console.log(
        '[handleDialogStates] Inside Outbound Dialing Event: ===> ',
        data.response,
      );
      if (data.response.dialog === null) {
        this.maintainDialog = null;
        this.dialogId = null;
      } else {
        switch (data.response.dialog.state) {
          case 'INITIATING':
            console.log(
              '[outboundDialing] INITIATING CALL DIALOG Event: ===> ',
              data.response.dialog,
            );
            // this.callPopUpView = true;
            this.maintainDialog = data.response.dialog;
            this.dialogId = data.response.dialog.id;
            break;
          case 'INITIATED':
            console.log(
              '[outboundDialing] INITIATED CALL DIALOG Event: ===> ',
              data.response.dialog,
            );
            this.maintainDialog = data.response.dialog;
            this.dialogId = data.response.dialog.id;
            break;
        }
      }
    }
    // outboundDialing
    if (data.event === 'dialogState') {
      if (data.response.dialog === null) {
        this.maintainDialog = null;
        this.dialogId = null;
      } else {
        switch (data.response.dialog.state) {
          case 'INITIATING':
            console.log(
              '[dialogState] INITIATING CALL DIALOG: ===> ',
              data.response.dialog,
            );
            // this.callPopUpView = true;
            this.maintainDialog = data.response.dialog;
            this.dialogId = data.response.dialog.id;
            break;
          case 'INITIATED':
            console.log(
              '[dialogState] INITIATED CALL DIALOG: ===> ',
              data.response.dialog,
            );
            this.maintainDialog = data.response.dialog;
            this.dialogId = data.response.dialog.id;
            break;
          case 'ALERTING':
            console.log(
              '[dialogState] ALERTING CALL DIALOG: ===> ',
              data.response.dialog,
            );
            this.maintainDialog = data.response.dialog;
            this.dialogId = data.response.dialog.id;
            break;
          case 'ACTIVE':
            console.log(
              '[dialogState] ACTIVE CALL DIALOG: ===> ',
              data.response.dialog,
            );
            this.startCountdown();
            // this.callPopUpView = false;
            this.maintainDialog = data.response.dialog;
            this.dialogId = data.response.dialog.id;

            if (this.standaloneWebRtc) {
              this.changeView('standaloneVideo');
            }
            if (this.isAudioCallActive) {
              this.changeView('audio');
            } else if (this.isVideoCallActive) {
              this.changeView('video');
            } else if (this.isScreenShareActive) {
              this.changeView('screenshare');
            } else if (this.isChatActive) {
              this.changeView('chat')
            } else if (this.isSecureWebCall) {

              this.changeView('secureWebVideoCall');
            }
            break;
          case 'FAILED':
            console.log(
              '[dialogState] FAILED CALL DIALOG: ===> ',
              data.response.dialog,
            );
            if (this.standaloneWebRtc) {
              this.endCountdown();
              this.changeScreen('error');
            } else {
              this.isAudioCallActive = false;
              this.isVideoCallActive = false;
              this.isScreenShareActive = false;
              this.endCountdown();
              this.changeView('chat');
            }
            break;
          case 'DROPPED':
            console.log(
              '[dialogState] DROPPED CALL DIALOG: ===> ',
              data.response.dialog,
            );
            if (this.standaloneWebRtc) {
              this.callPopUpView = false;
              this.isWebRtcVideoCallActive = false;
              this.endCountdown();
              this.changeScreen('end');
            } else {
              this.callPopUpView = false;
              this.isAudioCallActive = false;
              this.isVideoCallActive = false;
              this.isScreenShareActive = false;
              this.endCountdown();
              this.changeView('chat');
            }
            break;
        }
      }
    }

    if (data.event === 'mediaConversion') {
      if (data.status === 'success') {
        console.log(
          '[mediaConversion] ACTIVE CALL mediaConversion: ===> ',
          data.dialog.stream,
        );

        // if (data.dialog.stream === 'audio') {
        //   this.isVideoCallActive = false;
        //   this.isScreenShareActive = false;
        // } else
        // this.changeView(data.dialog.stream);
        if (data.dialog.stream === 'video') {
          this.isAudioCallActive = false;
          this.isScreenShareActive = false;
          this.callPopUpView = false;
        } else if (data.dialog.stream === 'screenshare') {
          this.isAudioCallActive = false;
          this.isVideoCallActive = false;
          this.callPopUpView = false;
        }
        if (
          data.dialog.eventRequest === 'remote' &&
          data.dialog.streamStatus === 'off'
        ) {
          // this.remoteVideoActive = false;
          console.log('Remote Camera Off');
        } else if (
          data.dialog.eventRequest === 'remote' &&
          data.dialog.streamStatus === 'on'
        ) {
          console.log('Remote Camera On');
        }
      }
    }

    if (data.event === 'Error') {
      // this.errorDuringWebRTCCall = true;
      // This dialoguId we got in reponse once the call starts ringing on agent side 
      // If share end / mute / hold / unhold events on the basis of this Id. 
      // If we do not have this id, we might face unexpected errors / behavour. 
      // That is why it is necessary that if an error occurs while initiating a call we make this Id undefined 
      // so that while initiating a new call it is overridden easily. 
      this.dialogId = undefined;
      let errorMessage = '';
      switch (data.response.type) {
        case 'generalError':
          errorMessage = `Error: ${data.response.description}`;
          console.log('[Error] Call terminated:', errorMessage);
          break;
        case 'subscriptionFailed':
          errorMessage = `Subscription Failed: ${data.response.description}`;
          console.log('[Error] Call terminated:', errorMessage);
          break;
        case 'invalidState':
          errorMessage = `Invalid State: User is not registered`;
          console.log('[Error] Call terminated:', errorMessage);
          break;
        default:
          console.log(`[Error] Unknown:', ${data.response.description}`);
          errorMessage = 'An unknown error occurred.';
      }
      this.showAuthenticationResponseMessage = errorMessage;
      this.activeVideoView = false;
      if (this.standaloneWebRtc) {
        this.showInvalidCodeError = true;
        this.callPopUpView = false;
        this.activeVideoView = false;
        this.isWebRtcVideoCallActive = false;
        this.snackBar.open(this.showAuthenticationResponseMessage, 'Dismiss', {
          duration: 3000,
          panelClass: ['error-snackbar'],
          horizontalPosition: 'right',
        });
      }
      else {
        this.snackBar.open(this.showAuthenticationResponseMessage, 'Dismiss', {
          duration: 3000,
          panelClass: ['error-snackbar'],
          horizontalPosition: 'right',
        });
        this.isSecureWebCall = false;
        this.isVideoCallActive = false;
        this.activeVideoView = false;
        this.errorDuringWebRTCCall = true;
        this.changeView('chat')
      }
    }
  }

  callEnd() {
    if (!this.dialogId) {
      console.warn("Call cannot be ended because dialogId is missing.");
      return;
    }

    this.callPopUpView = false;
    this.isSecureWebCall = false;
    this.endCountdown();
    this.sdk.handleCallEnd(this.dialogId);
    this.sdk.handleLogOutAgent(this.dialogId);
    this.changeView("chat");
  }

  changeFont() {
    console.log('font dropdown clicked');
    this.fontDropDown = !this.fontDropDown; // Toggle the fontDropDown variable
  }

  setFontSize(e: any) {
    console.log('Set fontsize', e);
    try {
      localStorage.setItem('fontSize', e);
      this.changeFont();
      this.setFontFromLocalStorage();
    } catch (error) { }
  }

  private setFontFromLocalStorage() {
    try {
      if (localStorage.getItem('fontSize') !== null) {
        this.fontSize.setValue(localStorage.getItem('fontSize'));
      }
    } catch (error) { }
  }

  clearSession() {
    this.preChatFormLoader = false;
    if (
      this.isAudioCallActive ||
      this.isVideoCallActive ||
      this.isScreenShareActive
    ) {
      this.callEnd();
    }
    this.cimMessage = [];
    this.isChatActive = false;
    this.changeScreen('end');
    this.sdk.handleChatEnd(this.customerData);
    this.clearMessageData();
    this.fileLoading = false;
    this.fileUrl = '';
    this.imageUrls = [];
    this.selectedFile = null as any;
  }

  transformPayload(input: any) {
    // Remove the first '/'
    if (input) {
      const trimmedInput = input.replace(/^\//, '');
      // Check if the input contains a JSON-like string
      const entitiesMatch = trimmedInput.match(/\{.*\}/);
      const entities = entitiesMatch ? JSON.parse(entitiesMatch[0]) : null;
      // Remove the JSON-like string from the trimmed input
      const intent = entitiesMatch
        ? trimmedInput.replace(entitiesMatch[0], '')
        : trimmedInput;
      return { intent, entities };
    }
    return { intent: null, entities: null };
  }

  authenticateToken(isAuthenticated: boolean): void {
    this.dialogId = undefined;
    const roomId = this.webRtcSecureLink;
    this.sdk.authenticateRoomId({ roomId }, (res: any) => {
      if (res.error) {
        this.isSecureLinkExpired = true;
        this.showAuthenticationResponseMessage = res.data.message
          ? "The link has expired"
          : res.message;
          this.isSecureLinkExpired=true;
        this.showInvalidCodeError = true;
      }
      else {
        this.logInToFreeSwitch();
        this.agentName = res.data.agentName;
        res.data.diallingUri = this.webRTCConfig.diallingUri;
        this.showAuthenticationResponseMessage = res.message;
        this.showInvalidCodeError = false;
        this.setAuthorizedResponse = res.data; // Now includes diallingUri
        if (isAuthenticated) {
          this.changeView('secureWebVideoCall');
        }
        else {
          if (this.setAuthorizedResponse) {
            this.standaloneWebRtc = true;
            this.changeScreen('webRtcScreen');
          }
        }
      }
    });
  }

  processSecureLinkMessage(message: any) {

    this.isSecureWebCall = false;
    const mediaUrl = message.body.mediaUrl
    const queryString = mediaUrl.split('?')[1];
    const urlParams = new URLSearchParams(queryString);
    const encryptedKey = urlParams.get('encryptedKey');
    this.webRtcSecureLink = encryptedKey;
    const widgetIdentifier = urlParams.get('widgetIdentifier')
    if (widgetIdentifier === this.widgetIdentifier && !this.errorDuringWebRTCCall) {
      this.authenticateToken(true);
    } else {
      console.warn('[Warning] Widget Identifiers do not match or there was an error during WebRTC call.');

      this.snackBar.open(
        this.showAuthenticationResponseMessage || 'Authentication failed!',
        'Dismiss',
        {
          duration: 3000,
          panelClass: ['error-snackbar'],
          horizontalPosition: 'right',
        }
      );
    }
    return;
  }

  pickSipExtension(sipExtensions: any) {
    const [startExt, endExt] = sipExtensions.split('-');
    const minExt = parseInt(startExt, 10);
    const maxExt = parseInt(endExt, 10);
    return Math.floor(Math.random() * (maxExt - minExt)) + minExt;
  }
  getLabel(valueType: string): string {
    return this.dictionary[valueType] || valueType; // Return the  to valueType matchinf value from the dict
  }
}
