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
  FormArray,
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
import { HttpClient } from '@angular/common/http';
import { TranslateService } from '@ngx-translate/core';
declare var EmojiPicker: any;

interface Shift {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
}

interface EventData {
  id: string;
  name: string;
  startTime: string;
  endTime: string | null;
  type: string;
  shifts?: Shift[];
  validityPeriod: string;
  calendar: string[];
  eventColor: string;
}
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
  customerId: string = ''
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
  preChatformTitle: string = ''
  preChatformDescription: string = ''
  preChatFormInfo: any;

  @Input() formData!: any[];
  @Input() callbackFormData!: any[];
  preChatFormGroup!: FormGroup;
  callbackFormGroup!: FormGroup;
  preChatFormLoader = false;
  callbackLoader = false;
  callbackConfig: any;
  todayShifts: { eventId: string, shiftName: string | null, startTime: string, endTime: string }[] = [];
  events: EventData[] = [];
  orderedEvents: any[] = [];
  daySummary: { startOfDay: Date | null; endOfDay: Date | null } | null = null;


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
  source: any;


  // file preview 
  filePreviewUrl: { [key: string]: any } = {};
  fileHistory: { [key: string]: { isImage: boolean } } = {}
  // Add a new property to store text content
  fileContent: { [key: string]: string } = {};
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
    private _http: HttpClient,
    private translate: TranslateService
  ) {
    this.logoEnabled = __appConfig.appConfig.ENABLE_LOGO;
    this.additionalPanel = __appConfig.appConfig.ADDITIONAL_PANEL;
    this.isUsernameEnabled = __appConfig.appConfig.USERNAME_ENABLED

    translate.setDefaultLang('en');
    translate.use('en');
  }

  ngAfterViewInit(): void {
    // Load the standalone webRtc Authentication screen or the active chat screen depending on whether the user is coming from secure link or not.
    if (this.standaloneWebRtc) {
      this.changeScreen('webRtcScreen');
      console.log('Secure Link webRtc View');
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
    this.initPrechatform()
    this.route.queryParams.subscribe((params: { [x: string]: any }) => {
      this.customerIdentifier = params['channelCustomerIdentifier'];
      this.serviceIdentifier = params['serviceIdentifier'];
      this.widgetIdentifier = params['widgetIdentifier'];
      this.source = params['Source'] ? params['Source'] : 'Web';

      // Assuming all spaces in the decoded encryptedKey should actually be '+' signs
      const rawEncryptedKey = params['encryptedKey']
        ? params['encryptedKey']
        : null;
      if (rawEncryptedKey !== null) {
        // Directly replace spaces with '+' if you're sure there should be no spaces
        this.webRtcSecureLink = rawEncryptedKey.replace(/ /g, '+');
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
      this.getCalendarEvents()
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
      this.preChatFormSubscription = this.sdk.renderPreChatForm$.subscribe(
        (formData: { sections: { attributes: any[] }[], formTitle: string, formDescription: string }) => {
          this.preChatFormInfo = formData;
          console.log('preChatFormInfo========>', this.preChatFormInfo)
          this.formData = formData.sections;
          this.preChatformTitle = formData?.formTitle;
          this.preChatformDescription = formData?.formDescription;
          this.createFormValidationControls(
            this.formData,
            this.formValidations,
            'preChatForm',
          );
        },
      );
    });


    this.callbackFormSubscription = this.sdk.renderCallbackForm$.subscribe(
      (formData: { sections: { attributes: any[] }[] }) => {
        this.callbackFormData = formData.sections[0].attributes.filter(
          (item: any) => {
            return item.valueType != 'checkbox';
          },
        );
        console.log('Widget configurations:', formData.sections);
        console.log('regex:', this.formValidations);
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
    this.getCalendarEvents()
  }

  initPrechatform() {
    this.preChatFormGroup = this.fb.group({
      sections: this.fb.array([])
    })
  }

  async getCalendarEvents() {
    this.sdk
      .fetchBusinessCalendarId()
      .then((calendarId: string) => {

        return this.sdk.getCalendarEvents(calendarId);
      })
      .then((events) => {
        this.events = events.events;
        this.getTodayEvent();
      })
      .catch((error) => {
        console.error('Error:', error);
      });
  }

  getTodayEvent(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      try {

        const today = new Date();
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()); // Start of today in local time
        const todayEnd = new Date(todayStart);
        todayEnd.setDate(todayStart.getDate() + 1); // Start of tomorrow in local time


        // Filter events happening today and of type BUSINESS_HOURS
        const todayEvents = this.events.filter(
          (event) =>
            event.type === 'BUSINESS_HOURS' &&
            event.shifts?.some((shift) => {
              const shiftStart = new Date(shift.startTime);
              const shiftEnd = new Date(shift.endTime);

              // Check if either start or end time falls within today's local date range
              return (
                (shiftStart >= todayStart && shiftStart < todayEnd) ||
                (shiftEnd >= todayStart && shiftEnd < todayEnd)
              );
            })
        );

        // Flatten all shifts into a single array
        const allShifts = todayEvents.flatMap((event) =>
          event.shifts?.map((shift) => ({
            type: event.type,
            shiftName: shift.name,
            startTime: shift.startTime,
            endTime: shift.endTime,
          }))
        );

        // If no shifts are available, handle accordingly
        if (!allShifts.length) {
          this.daySummary = null;
          return resolve([]);
        }
        const minStartTime = new Date(
          Math.min(
            ...allShifts
              .map((shift) => (shift?.startTime ? new Date(shift.startTime).getTime() : Infinity))
          )
        );

        const maxEndTime = new Date(
          Math.max(
            ...allShifts
              .map((shift) => (shift?.endTime ? new Date(shift.endTime).getTime() : -Infinity))
          )
        );

        // Set the day summary with the minimum and maximum times
        this.daySummary = {
          startOfDay: minStartTime,
          endOfDay: maxEndTime,
        };

        ///this.orderedEvents = allShifts;

        resolve(this.orderedEvents);
      } catch (error) {
        reject("Error processing Business Hours events: " + error);
      }
    });
  }







  formatTime(dateTime: string): string {
    const date = new Date(dateTime);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  }


  async passUrlParamsToServices() {
    await this.sdk.receiveUrlParamsValue(
      this.widgetIdentifier,
      this.serviceIdentifier,
    );
  }

  private createFormValidationControls(
    formSchema: any[],
    formValidation: any[],
    formType: string
  ): void {
    const sectionsArray: FormArray = this.fb.array([]); // Create the main sections FormArray

    formSchema.forEach((section) => {

      const sectionGroup = this.fb.group({}); // Create a FormGroup for each section
      section.attributes.forEach((attribute: any) => {
        const matchingValidation = formValidation.find(
          (validation: any) => validation.type === attribute.valueType
        );

        // Initialize validators array
        const validators = [];
        console.log(attribute.isRequired)
        if (attribute.isRequired) {
          validators.push(Validators.required);
        }

        let minLength = 1;
        let maxLength = 101;
        let extractedLength;

        if (matchingValidation?.regex) {
          switch (matchingValidation.type.toLowerCase()) {

            case 'boolean':
            case 'mcq':
            case 'dropdown':
              break;
            case 'shortanswer':
            case 'alphanumeric':
            case 'alphanumericspecial':
            case 'password':
            case 'paragraph':
            case 'number':
            case 'positivenumber':
            case 'phonenumber':
              extractedLength = this.extractMinMaxLength(matchingValidation.regex);
              validators.push(Validators.minLength(extractedLength.minLength ?? minLength));
              validators.push(Validators.maxLength(extractedLength.maxLength ?? maxLength));

              if (!['shortanswer', 'paragraph'].includes(matchingValidation.type.toLowerCase())) {
                validators.push(
                  Validators.pattern(
                    matchingValidation.type.toLowerCase() === 'password'
                      ? /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])[A-Za-z\d\W_]{8,256}$/
                      : new RegExp(matchingValidation.regex)
                  )

                );
              }
              break;

            case 'datetime':
            case 'date':
            case 'time':
              break; // No validation needed

            default:
              validators.push(Validators.pattern(new RegExp(matchingValidation.regex)));
              break;
          }
        }


        // console.log('Adding control:', attribute.key, 'with validators:', validators);

        // Add the control to the section group
        sectionGroup.addControl(attribute.key, this.fb.control('', validators));
      });
      console.log('section', section)

      // Add the section group to the sections FormArray
      sectionsArray.push(sectionGroup);
    });
    if (formType === 'preChatForm') {
      this.preChatFormGroup.setControl('sections', sectionsArray);
    }
    // Set the sections array inside the main form grou
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
      if (this.webRTCConfig.sipExtension.includes('-')) {
        let selectedSipExtension = this.pickSipExtension(
          this.webRTCConfig.sipExtension,
        );
        this.webRTCConfig.sipExtension = selectedSipExtension.toString();
        console.log(
          'sipExtension range: <==',
          selectedSipExtension,
          this.webRTCConfig,
        );
      }
      if (this.enableWebRtc) this.sdk.loginSipWebRtc(this.webRTCConfig);
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

  checkFieldValue(formData: any, field: string) {
    console.log('formData--------->', formData.sections);

    for (const section of formData.sections) {
      if (Object.prototype.hasOwnProperty.call(section, field) && section[field] !== null) {
        return { error: false, data: section[field] }; // Field is found in at least one section with a non-null value
      }
    }

    return { error: true, data: `Error: The field "${field}" is required or does not exist in the pre-chat form.` };
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

  getFormDataAsConversationData(jsonObject: any) {
    const attributes: any = {};
    jsonObject.sections.forEach((section: any, index: number) => {
      Object.entries(section).forEach(([key, value]) => {
        if (attributes.hasOwnProperty(key)) {
          // Conflict: key already exists, add with index
          attributes[`${key}_${index}`] = value;
        } else {
          attributes[key] = value;
        }
      });
    });

    return attributes;
  }



  pushPrechatDataAsActivity() {
    let finalPayload = this.createFormDataObject();
    finalPayload.body.sections = this.creatingSectionsforSchema();

    this.calculateAttributeScore(finalPayload);
    this.calculateSectionScores(finalPayload);
    this.calculateFormScore(finalPayload);
    this.sdk.postFormDataAsActivity(finalPayload)

  }

  calculateAttributeScore(formData: any) {
    console.log('calculate attribute score ===========>')
    formData.body.sections.forEach((section: any) => {
      // console.log(section); 
      section.attributes.forEach((attribute: any) => {
        //  console.log(attribute);
        let selectedOption = attribute?.answer.find((option: any) => option?.isSelected === true);
        // console.log(selectedOption.additionalAttributes.optionWeightage, "SELECTED OPTIONS");
        if (selectedOption) {
          let selectedOptionWeightage = selectedOption?.additionalAttributes?.optionWeightage;
          attribute.attributeScore = parseFloat(((selectedOptionWeightage / 100) * attribute?.attributeWeightage).toFixed(1));
        } else {
          attribute.attributeScore = 0
        }

        // console.log(attribute.attributeScore, "ATTRIBUTE SCORE");
      })
    });
  }


  calculateSectionScores(formData: any) {
    formData.body.sections.forEach((section: any) => {
      let totalAttributeWeightage = 0
      section.attributes.forEach((attribute: any) => {
        totalAttributeWeightage += attribute.attributeScore;
      })
      // console.log('totalAttributeWeightage', totalAttributeWeightage)
      section.sectionScore = parseFloat(((totalAttributeWeightage / 100) * section.sectionWeightage).toFixed(1));
    })
  }

  calculateFormScore(formData: any): any {
    // console.log(sections);
    if (!formData) return;

    let totalSectionWeightages = 0
    formData.body.sections.forEach((section: any) => {
      console.log(section)
      totalSectionWeightages += section.sectionScore;
    })

    formData.body.formScore = parseFloat(((totalSectionWeightages / 100) * formData?.body?.formWeightage).toFixed(1)) || null
  }
  createFormDataObject() {
    return {
      header: {
        channelData: {
          channelCustomerIdentifier: this.customerIdentifier,
          serviceIdentifier: this.serviceIdentifier,
          requestPriority: 0,
          additionalAttributes: [],
        },
        language: {},
        timestamp: Date.now(),
        securityInfo: {},
        stamps: [],
        intent: "WIDGET_FORM_ACTIVITY",
        entities: {},
        channelSessionId: "",
        conversationId: this.conversationId,
        customer: {
          _id: this.customerId
        },
        schedulingMetaData: null,
        originalMessageId: null,
        providerMessageId: null,
        sender: {
          id: "f1370ff7-43fa-496e-9966-e64061d35f5c",
          type: "APP",
          senderName: "WIDGET_PRECHAT_FORM",
          additionalDetail: null,
        },
      },
      body: {
        formId: this.preChatFormInfo?.id,
        formTitle: this.preChatFormInfo?.formTitle,
        type: "FORM_DATA",
        formWeightage: this.preChatFormInfo?.formWeightage,
        formScore: '',
        additionalDetail: {
          actor: {
            type: 'Customer',
            id: this.customerId
          },
          submissionSource: 'Pre-chat',
          review: null,
          reviewer: null,
          agentReviewed: null

        },
        sentiment: {
          result: null,
          color: null,
        },
        sections: [],
      },
    };
  }


  creatingSectionsforSchema(): any {
    let finalSections: any = [];
    const formValues = this.preChatFormGroup.value;


    this.formData.forEach((section: any, sectionIndex: number) => {
      let newSection: any = {
        sectionId: section._id,
        sectionName: section.sectionName,
        sectionWeightage: section.sectionWeightage || null,
        sectionScore: null,
        attributes: []
      };

      const sectionIndexNumber = `section_${sectionIndex}`;
      const sectionAttributes = formValues['sections'];
      const currentSectionAttributes = sectionAttributes[sectionIndex]


      if (currentSectionAttributes) {
        section.attributes.forEach((attribute: any) => {
          // console.log("ATTRIBUte", attribute);

          const attributeData = attribute.attributeOptions?.attributeData || [];
          const possibleValues = attributeData.length > 0 ? attributeData[0].values : [];
          const selectedValue = currentSectionAttributes[attribute.key] || null;

          let newAttribute: any = {
            id: attribute._id,
            label: attribute.label,
            valueType: attribute.valueType,
            attributeWeightage: attribute.attributeWeightage || null,
            attributeScore: null,
            attributeType: attribute.attributeType || "OPTIONS",
            skipType: attribute.skipType || null,
            attributeAttachment: attribute.attributeAttachment || "",
            answer: this.getAnswerObj(attribute, possibleValues, selectedValue)
          };
          newSection.attributes.push(newAttribute);
        });
      }
      finalSections.push(newSection);
    });
    return finalSections;
  }
  getAnswerObj(attribute: any, possibleValues: any, selectedValue: any) {

    if (attribute.attributeType == 'INPUT' || attribute.attributeType == 'TEXTAREA') {
      return [selectedValue]
    }
    else {
      selectedValue = selectedValue ? (selectedValue.value ?? selectedValue) : null;

      return possibleValues.map(
        (option: any) => ({
          label: option.label,
          value: option.value || option.label, // Use `value` if available, fallback to `label`
          isSelected: option.label === selectedValue || option.value === selectedValue,
          additionalAttributes: {
            optionWeightage: option.optionWeightage || null,
            enableStyle: attribute.attributeOptions?.enableStyle || false,
            optionStyle: option.optionStyle || null,

          }
        }))
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

  convertJsonToArray(jsonObject: any): any[] {
    const attributesArray: any[] = [];

    jsonObject.sections.forEach((section: any) => {
      const attributes = Object.entries(section).map(([key, value]) => ({
        value: value,
        key: key,
        type: typeof value === 'string' ? 'string' : typeof value,
      }));
      attributesArray.push(...attributes); // Corrected: using push instead of concat
    });

    console.log(attributesArray);
    return attributesArray;
  }


  closeWrapper() {
    console.log('wrapper closed');
    this.additionalPanel = false;
    this.resizeWidget('icon-view');
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
          this.resizeWidget('icon-view');
        } else {
          this.additionalPanel = true;
          this.resizeWidget('wraper-view');

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
        this.fileName = ''
        if (this.source === 'UApp') {
          this.additionalPanel = false;
          this.isIconWidget = false;
        } else {
          this.additionalPanel = false;
          this.isIconWidget = true;
          this.resizeWidget('icon-view');
        }

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
        this.chatEndScreen = false;
        this.isChatMax = true;
        this.isCallbackMax = false;
        this.isWebRtcMax = false;
        this.changeView('chat');
        this.resizeWidget('form-view');
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
        this.resizeWidget('form-view');

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
    console.log('Change Screen:', view);
    switch (view) {
      case 'chat':
        this.activeChatView = true;
        this.activeAudioView = false;
        this.activeVideoView = false;
        this.activeScreenShareView = false;
        this.callPopUpView = false;
        this.activeCallbackView = false;
        this.activeCallbackResponseView = false;
        if (this.enableEmoji) {
          setTimeout(() => {
            new EmojiPicker();
          }, 500)
        }
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
        } else {
          this.callPopUpView = true;
          this.activeVideoView = true;
          this.activeChatView = false;
          this.activeAudioView = false;
          this.activeScreenShareView = false;
          this.activeCallbackView = false;
          this.activeCallbackResponseView = false;
          this.initiateWebRtcCall(view);
        }
        break;
      case 'screenshare':
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
          this.initiateWebRtcCall(view);
        }
        break;
      case 'standaloneVideo':
        if (this.isWebRtcVideoCallActive) {
          this.isWebRtcVideoCallActive = true;
          this.callPopUpView = false;
        } else {
          this.callPopUpView = true;
          this.isWebRtcVideoCallActive = false;
          this.initiateWebRtcCall('video');
        }
        break;
    }
    this.cdRef.detectChanges()
  }

  convertCallView(view: any) {
    console.log('Change Screen:', view);
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
        this.callPopUpView = true;
        this.activeChatView = false;
        this.activeAudioView = true;
        this.activeVideoView = false;
        this.activeScreenShareView = false;
        this.activeCallbackView = false;
        this.activeCallbackResponseView = false;
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
        this.callPopUpView = true;
        this.activeVideoView = true;
        this.activeChatView = false;
        this.activeAudioView = false;
        this.activeScreenShareView = false;
        this.activeCallbackView = false;
        this.activeCallbackResponseView = false;
        this.convertCallRequest(view);
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

  resizeWidget(state: string): void {
    window.parent.postMessage({ state: state }, '*');
  }

  eventListener(event: any) {
    try {
      let lastMessage = this.cimMessage[this.cimMessage.length - 1];
      let messageType = lastMessage?.body?.subType?.toLowerCase();
      console.log("mesage type ================>", messageType)
      console.log("event.type", event.type)
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
            this.customerId = event.data.header.customer._id;
            localStorage.setItem(
              'conversationId',
              event.data.header.conversationId,
            );
            this.sdk.setConversationDataAgainstCustomerIdentifier(
              this.customerData.channelCustomerIdentifier,
              this.getFormDataAsConversationData(this.preChatFormData),
            );
            this.pushPrechatDataAsActivity()

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

    if (this.elementView?.nativeElement) {
      this.elementView.nativeElement.value = ''
    }
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


  isFileSelected: any;

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
              (res: any) => {
                if (res?.isFileInvalid) {
                  this.snackBar.open(res.errorMesage, 'X', {
                    panelClass: 'custom-snackbar',
                  });
                  this.removeUploadFile();
                  return;
                }

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

  uploadPrechatFile(sectionIndex: number, controlName: any, fileInput: any, id: any) {
    console.log('file uploading ===========>')
    this.isFileUploading[`${controlName}`] = true
    if (fileInput.files && fileInput.files.length > 0) {
      const file = fileInput.files[0]
      const formData = new FormData();
      formData.append('file', file);

      this._http.post(`${this.__appConfig.appConfig.FILE_SERVER_URL}/api/uploadFileStream`, formData).subscribe((res: any) => {
        const fileName = `${this.__appConfig.appConfig.FILE_SERVER_URL}/api/downloadFileStream?filename=${res.name}`;
        this.setFileControl(sectionIndex, fileName, controlName)

        this.snackBar.open('File uploaded successfully', 'X', {
          panelClass: 'custom-snackbar',
        });

        this.isFileUploading[`${controlName}`] = false
        this.disableUploadBtn(id);
      }, (error) => {


        this.snackBar.open(error.message, 'X', {
          panelClass: 'custom-snackbar',
        });

        this.isFileUploading[`${controlName}`] = false
      })
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

  // Audio Functions
  toggleCallMic() {
    this.isCallMute = !this.isCallMute; // Use assignment operator and logical NOT operator
    console.log(this.isCallMute);
    const action = this.isCallMute ? 'mute_call' : 'unmute_call';
    this.sdk.handleCallMic(action, this.dialogId);
  }

  convertCallRequest(view: any) {
    console.log('this function is called ', this.activeVideoView);
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
    console.log(this.isVideoHide);
    this.sdk.convertCall(cameraStatus, 'video', this.dialogId);
  }

  toggleCallHold() {
    this.isCallOnHold = !this.isCallOnHold; // Use assignment operator and logical NOT operator
    console.log(this.isCallOnHold);
    const action = this.isCallOnHold ? 'holdCall' : 'retrieveCall';
    this.sdk.handleCallHoldState(action, this.dialogId);
  }

  initiateWebRtcCall(callType: any) {
    this.callText = callType;
    this.startCountdown();

    if (this.standaloneWebRtc) {
      console.log('standalone webrtc call <==');
      this.sdk.handleCallStart({
        type: callType,
        authConfigs: this.setAuthorizedResponse,
      });
      this.isWebRtcVideoCallActive = true;
    } else {
      if (callType === 'video') {
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

  handleDialogStates(data: any): void {
    console.log('[handleDialogStates] received dialog: ===> ', data);

    if (data.event === 'agentInfo') {
      console.log(
        '[handleDialogStates] Inside Agent Info Event: ===> ',
        data.response,
      );
      if (data.response.state === 'LOGIN') {
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
            // this.callPopUpView = false;
            this.maintainDialog = data.response.dialog;
            this.dialogId = data.response.dialog.id;
            if (this.standaloneWebRtc) {
              this.changeView('standaloneVideo');
            } else if (this.isAudioCallActive) {
              this.changeView('audio');
            } else if (this.isVideoCallActive) {
              this.changeView('video');
            } else if (this.isScreenShareActive) {
              this.changeView('screenshare');
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
      switch (data.response.type) {
        case 'generalError':
          console.log(
            '[Error] Call terminated by customer: ===>',
            `Error Type: ${data.response.type} with description: ${data.response.description}`,
          );
          break;
      }
    }
  }

  callEnd() {
    this.endCountdown();
    this.sdk.handleCallEnd(this.dialogId);
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

  authenticateToken(): void {
    const roomId = this.webRtcSecureLink;
    const secureToken = this.sessionCode;
    this.sdk.authenticateRoomId({ roomId, secureToken }, (res: any) => {
      if (res.error) {
        console.log('Authentication Response not okay: ', res);
        this.showAuthenticationResponseMessage = res.data.message
          ? res.data.message
          : res.message;
        this.showInvalidCodeError = true;
      } else {
        console.log('Authentication response success:', res);
        this.agentName = res.data.agentName;

        // Append diallingUri key to res.data object
        res.data.diallingUri = this.webRTCConfig.diallingUri;

        this.showAuthenticationResponseMessage = res.message;
        this.showInvalidCodeError = false;
        this.setAuthorizedResponse = res.data; // Now includes diallingUri
        console.log('<===>Auth Data:', this.setAuthorizedResponse);
        setTimeout(() => {
          this.changeView('standaloneVideo');
        }, 1000);
      }
    });
  }

  pickSipExtension(sipExtensions: any) {
    const [startExt, endExt] = sipExtensions.split('-');
    const minExt = parseInt(startExt, 10);
    const maxExt = parseInt(endExt, 10);
    return Math.floor(Math.random() * (maxExt - minExt)) + minExt;
  }
  getLabel(valueType: string): string {
    const label = this.dictionary[valueType] || valueType;
    return label.charAt(0).toUpperCase() + label.slice(1);
  }




  isMaxLengthError(sectionIndex: number, controlName: string, valueType: string): boolean {
    // Get the sections array from preChatFormGroup
    const sections = this.preChatFormGroup.get('sections') as FormArray;

    // Validate section existence
    if (!sections || !sections.at(sectionIndex)) {
      console.error(`Section at index ${sectionIndex} does not exist.`);
      return false;
    }

    // Get the control from the specified section in preChatFormGroup
    const controlPreChat = sections.at(sectionIndex).get(controlName);


    // Prioritize the preChatFormGroup control
    const control = controlPreChat;

    if (control && control.value) {
      // Define max length for each value type
      const maxLengthMap: { [key: string]: number } = {
        shortAnswer: 101,
        paragraph: 2001,
        alphaNumeric: 101,
        alphaNumericSpecial: 101,
        number: 101,
        positiveNumber: 101,
        password: 256,
        email: 101,
      };

      const maxLength = maxLengthMap[valueType] || null;

      if (maxLength !== null) {
        // Ensure control value is a string before checking length
        const value = String(control.value);
        return value.length >= maxLength;
      }
    }

    return false;
  }


  Selected5starOption(
    controlName: string,
    sectionIndex: number,
    attributeIndex: number,
    itemIndex: number,
    type: string,
    value: string
  ) {
    console.log('controlName:', controlName);

    // Get the sections array from preChatFormGroup
    const sections = this.preChatFormGroup.get('sections') as FormArray;

    // Validate section existence
    if (!sections || !sections.at(sectionIndex)) {
      console.error(`Section at index ${sectionIndex} does not exist.`);
      return;
    }
    // Get the form control from the specific section
    const control = sections.at(sectionIndex).get(controlName);
    if (!control) {
      console.error(`Control "${controlName}" not found in section ${sectionIndex}.`);
      return;
    }

    // Update the star rating UI
    const svgElements = document.querySelectorAll(
      `.option-${sectionIndex}-${attributeIndex}-${type}`
    );

    if (type === "star") {
      svgElements.forEach((svg, index) => {
        const paths = svg.getElementsByTagName("path");
        const fillColor = index <= itemIndex ? "#FFB100" : "#E6E6E6";
        for (let i = 0; i < paths.length; i++) {
          paths[i].setAttribute("fill", fillColor);
        }
      });
    } else {
      svgElements.forEach((svg: any, index: number) => {
        const paths = svg.getElementsByTagName("path");

        if (!svg?.dataset.originalColors) {
          // Store original colors if not already stored
          const originalColors = [];
          for (let i = 0; i < paths.length; i++) {
            originalColors.push(paths[i].getAttribute("fill"));
          }
          svg.dataset.originalColors = JSON.stringify(originalColors);
        }

        if (index === itemIndex) {
          // Restore the original colors for the clicked SVG
          const originalColors = JSON.parse(svg.dataset.originalColors);
          for (let i = 0; i < paths.length; i++) {
            paths[i].setAttribute("fill", originalColors[i]);
          }
        } else {
          const fillColor = "gray"; // Change to gray for SVGs that are not clicked
          for (let i = 0; i < paths.length; i++) {
            paths[i].setAttribute("fill", fillColor);
          }
        }
      });
    }

    control.setValue(value);
    console.log(`Updated control "${controlName}" in section ${sectionIndex} with value: ${value}`);
  }

  selectedIndices: { [key: number]: number } = {};

  changeNpsColor(controlName: any, sectionIndex: number, attributeIndex: number, currentIndex: number, value: string): void {
    const sections = this.preChatFormGroup.get('sections') as FormArray;

    if (!sections || !sections.at(sectionIndex)) {
      console.error(`Section at index ${sectionIndex} does not exist.`);
      return;
    }

    const control = sections.at(sectionIndex).get(controlName);

    if (!control) {
      console.error(`Control "${controlName}" not found in section ${sectionIndex}.`);
      return;
    }

    // Create a new object reference to trigger change detection
    this.selectedIndices = { ...this.selectedIndices, [attributeIndex]: currentIndex };

    control.setValue(value);
    console.log(`Updated control "${controlName}" in section ${sectionIndex} with value: ${value}`);
  }


  ChangeScaleStyle(
    controlName: string,
    sectionIndex: number,
    attributeIndex: number,
    itemIndex: number,
    type: string,
    value: string
  ) {
    // Get the sections array from preChatFormGroup
    const sections = this.preChatFormGroup.get('sections') as FormArray;

    // Validate section existence
    if (!sections || !sections.at(sectionIndex)) {
      console.error(`Section at index ${sectionIndex} does not exist.`);
      return;
    }

    // Get the form control from the specific section
    const control = sections.at(sectionIndex).get(controlName);

    if (!control) {
      console.error(`Control "${controlName}" not found in section ${sectionIndex}.`);
      return;
    }

    // Update the scale UI (NPS style)
    const svgElements = document.querySelectorAll(
      `.npsOption-${sectionIndex}-${attributeIndex}-${type}`
    );

    svgElements.forEach((svg, index) => {
      const paths = svg.getElementsByTagName("path");
      const fillColor = index === itemIndex ? "#E57032" : "gray";
      for (let i = 0; i < paths.length; i++) {
        paths[i].setAttribute("fill", fillColor);
      }
    });
    control.setValue(value);
    console.log(`Updated control "${controlName}" in section ${sectionIndex} with value: ${value}`);
  }

  ChangeBarColor(controlName: any, sectionIndex: number, attributeIndex: number, buttonIndex: number, attributeKey: string, value: string) {

    const sections = this.preChatFormGroup.get('sections') as FormArray;

    // Validate section existence
    if (!sections || !sections.at(sectionIndex)) {
      console.error(`Section at index ${sectionIndex} does not exist.`);
      return;
    }

    // Get the form control from the specific section
    const control = sections.at(sectionIndex).get(controlName);

    if (!control) {
      console.error(`Control "${controlName}" not found in section ${sectionIndex}.`);
      return;
    }

    const iconElements = document.querySelectorAll(`#arrow-${attributeIndex}`);

    // Selecting all radio input elements for the given attributeKey
    const radioInputs = document.querySelectorAll(
      `input[name="${attributeKey}"]`
    );

    // Loop through all icon elements
    iconElements.forEach((iconElement: any) => {
      // Check if the data-bar-index matches the buttonIndex
      if (parseInt(iconElement.getAttribute("data-bar-index")) === buttonIndex) {
        // Show the matching icon element
        iconElement.classList.remove("bar-icon-hide");
        iconElement.classList.add("bar-icon-show");
      } else {
        // Hide all other icon elements
        iconElement.classList.remove("bar-icon-show");
        iconElement.classList.add("bar-icon-hide");
      }
    });

    // Set the corresponding radio input as checked
    radioInputs.forEach((radioInput: any, index) => {
      if (index === buttonIndex) {
        radioInput.checked = true;
      } else {
        radioInput.checked = false;
      }
    });

    control.setValue(value);
    console.log(`Updated control "${controlName}" in section ${sectionIndex} with value: ${value}`);
  }

  onCheckboxChange(
    event: Event,
    controlName: string,
    sectionIndex: number,
    optionValue: string | null,
    categoryLabel: string,
    hasCategory: boolean
  ): void {
    if (!optionValue) return;

    const checkbox = event.target as HTMLInputElement;
    const isChecked = checkbox.checked;

    const controlPath = `sections.${sectionIndex}.${controlName}`;
    const control = this.preChatFormGroup.get(controlPath);

    if (!control) {
      console.warn(`Control '${controlPath}' not found.`);
      return;
    }

    control.markAsTouched();

    //  Get existing value and parse
    let selectedValues = this.parseCheckboxValue(control.value);

    if (isChecked) {
      // Add value
      if (!selectedValues[categoryLabel]) {
        selectedValues[categoryLabel] = [];
      }
      if (!selectedValues[categoryLabel].includes(optionValue)) {
        selectedValues[categoryLabel].push(optionValue);
      }
    } else {
      // Remove value
      const updated = selectedValues[categoryLabel]?.filter(v => v !== optionValue) || [];
      if (updated.length > 0) {
        selectedValues[categoryLabel] = updated;
      } else {
        delete selectedValues[categoryLabel];
      }
    }

    //  Update form control with stringified object
    const newValue = Object.keys(selectedValues).length > 0 ? JSON.stringify(selectedValues) : '';
    control.setValue(newValue, { emitEvent: true });
  }
  parseCheckboxValue(val: string): { [key: string]: string[] } {
    try {
      return val ? JSON.parse(val) : {};
    } catch {
      return {};
    }
  }



  isChecked(
    controlName: string,
    sectionIndex: number,
    optionValue: string,
    categoryLabel: string
  ): boolean {
    const controlPath = `sections.${sectionIndex}.${controlName}`;
    const control = this.preChatFormGroup.get(controlPath);

    if (!control || !control.value) return false;

    const parts: string[] = control.value
      .split(',')
      .map((p: any) => p.trim())
      .filter((p: any) => p);

    let currentCategory: string | null = null;

    for (const part of parts) {
      if (part.startsWith('Category')) {
        currentCategory = part;
      } else if (currentCategory === categoryLabel && part === optionValue) {
        return true;
      }
    }

    return false;
  }




  booleanEmojiSet(sectionIndex: number, attributeIndex: number, itemIndex: number) {
    console.log("boooean emoji set", itemIndex);
    // Select all SVG elements within the booleanOption container
    const svgElements = document.querySelectorAll(
      `#booleanOption-${sectionIndex}-${attributeIndex} svg`
    );

    console.log('svgElements', svgElements)
    // Iterate through all SVG elements
    svgElements.forEach((svg: any, index) => {
      const paths = svg.getElementsByTagName("path");

      if (!svg.dataset.originalColors) {
        // Store original colors in data attribute if not already stored
        const originalColors = [];
        for (let i = 0; i < paths.length; i++) {
          originalColors.push(paths[i].getAttribute("fill"));
        }
        svg.dataset.originalColors = JSON.stringify(originalColors);
      }

      if (index === itemIndex) {
        // Restore the original colors for the clicked SVG
        const originalColors = JSON.parse(svg.dataset.originalColors);
        for (let i = 0; i < paths.length; i++) {
          paths[i].setAttribute("fill", originalColors[i]);
        }
      } else {
        // Change to gray for SVGs that are not clicked
        const fillColor = "gray";
        for (let i = 0; i < paths.length; i++) {
          paths[i].setAttribute("fill", fillColor);
        }
      }
    });
  }

  handleFileChange(input: any, sectionIndex: number, attributeIndex: number, fileSize: any, id: any, allowed: any, attribute: any
  ) {
    const file = input.files[0];

    if (!file) {
      return;
    }

    console.log('file', file)
    const errorDiv: any = document.getElementById(`${id}-error`);
    const uploadBtn: any = document.getElementById(`upload-btn-${id}`);
    uploadBtn.disabled = true;


    if (file) {
      console.log('file', file)
      const allowedTypesString: any[] = allowed;
      const allowedTypes = allowedTypesString.map(ext => ext.trim().toLowerCase());

      const fileExtension = file.name.slice(file.name.lastIndexOf(".") + 1).toLowerCase(); // Improved extension extraction
      console.log('allowedTypes', allowedTypes)
      console.log('fileExtension', fileExtension)

      if (allowedTypes.length > 0 && !allowedTypes.includes(fileExtension)) {

        console.log('fileExtension not allowed', fileExtension)
        this.snackBar.open("File extension not allowed'", 'X', {
          panelClass: 'custom-snackbar',
        });

        return;
      }
    }
    const fileName = file.name;
    console.log('fileName', fileName)
    const truncatedName = fileName.length > 10
      ? fileName.substring(0, 7) + '...' + fileName.split('.').pop()
      : fileName;
    // displayElement.textContent = truncatedName;


    // Validate file size
    const maxSize = fileSize * 1024 * 1024; // Convert to bytes
    if (file.size > maxSize) {
      errorDiv.textContent = `File size exceeds ${fileSize}MB limit`;
      errorDiv.style.display = 'block';
      // displayElement.textContent = '';
      input.value = '';
      return;
    }

    // Enable upload button
    this.setFileControl(sectionIndex, fileName, attribute.key)
    this.previewFileForm(file, sectionIndex, attributeIndex)
    uploadBtn.disabled = false;
  }

  setFileControl(sectionIndex: number, fileName: string, controlName: string) {
    const sections = this.preChatFormGroup.get('sections') as FormArray;
    if (!sections || !sections.at(sectionIndex)) {
      console.error(`Section at index ${sectionIndex} does not exist.`);
      return;
    }

    // Get the form control from the specific section
    const control: any = sections.at(sectionIndex).get(controlName);
    control.setValue(fileName);
    control.markAsTouched();
    control.markAsDirty();


  }
  getFileName(sectionIndex: number, controlName: any) {
    const sections = this.preChatFormGroup.get('sections') as FormArray;
    const currentSection = sections.at(sectionIndex);
    return currentSection.get(controlName)?.value || ''

  }
  isFileUploading: any = {};
  uploadFileFromPrechat(sectionIndex: number, controlName: any, fileInput: any, id: any) {
    this.isFileUploading[`${controlName}`] = true
    if (fileInput.files && fileInput.files.length > 0) {
      const file = fileInput.files[0]
      const formData = new FormData();
      formData.append('file', file);

      this._http.post(`${this.__appConfig?.appConfig?.FILE_ENGINE_URL}/api/uploadFileStream`, formData).subscribe((res: any) => {
        const fileName = `${this.__appConfig.appConfig?.FILE_SERVER_URL}/api/downloadFileStream?filename=${res.name}`;
        this.setFileControl(sectionIndex, fileName, controlName)
        // this.snackBar.("success-snackbar", 'file uploaded successfully', 3)
        this.snackBar.open('File uploaded successfully', 'X', {
          panelClass: 'custom-snackbar',
        });
        console.log(res)
        this.isFileUploading[`${controlName}`] = false
        this.disableUploadBtn(id);
      }, (error) => {
        console.log(error)
        // this.snackBar.snackbarMessage("error-snackbar", error.message, 3)
        this.snackBar.open(error.message, 'X', {
          panelClass: 'custom-snackbar',
        });
        this.isFileUploading[`${controlName}`] = false
      })
    }
  }
  disableUploadBtn(buttonId: any) {
    const uploadedBtn = document.querySelector(`#upload-btn-${buttonId}`);
    // uploadedBtn.textContent = 'Uploaded'
    console.log('uploadedBtn', uploadedBtn)
    this.renderer.setAttribute(uploadedBtn, 'disabled', 'true'); // Correct way


  }

  previewFileForm(file: File, sectionIndex: number, attributeIndex: number) {
    if (!file) return;

    const reader = new FileReader();
    const key = `${sectionIndex}-${attributeIndex}`;
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const isTextOrJson = !fileExtension || ['txt', 'json'].includes(fileExtension);


    if (isTextOrJson) {
      reader.onload = (e: ProgressEvent<FileReader>) => {
        let content = e.target?.result as string;

        if (!this.fileContent) this.fileContent = {};

        // If JSON, parse it before saving
        if (fileExtension === 'json') {
          try {
            content = JSON.stringify(content);
          } catch (error) {
            console.error('Error parsing JSON:', error);
            return;
          }
        }

        this.fileContent[key] = content;
        this.filePreviewUrl[key] = content;
      };
      reader.readAsText(file);
    } else {
      reader.onload = (e: ProgressEvent<FileReader>) => {
        const fileResult = e.target?.result as string;
        const isImage = file.type.startsWith('image/');

        if (!this.fileHistory) this.fileHistory = {};
        if (!this.filePreviewUrl) this.filePreviewUrl = {};

        this.fileHistory[key] = { isImage };

        if (isImage) {
          this.filePreviewUrl[key] = this.sanitizer.bypassSecurityTrustUrl(fileResult);
        } else {
          this.filePreviewUrl[key] = this.sanitizeFileContent(file, fileResult);
        }
      };
      reader.readAsDataURL(file);
    }
  }

  sanitizeFileContent(file: File, fileResult: string): SafeUrl {
    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    // All data URLs use bypassSecurityTrustUrl
    return this.sanitizer.bypassSecurityTrustUrl(fileResult);
  }


  clearFile(sectionIndex: number, attributeIndex: number, controlName: string, id: any) {
    const key = `${sectionIndex}-${attributeIndex}`;
    const uploadBtn: any = document.getElementById(`upload-btn-${id}`);
    const input: any = document.getElementById(`${id}`);
    uploadBtn.disabled = true;
    uploadBtn.textContent = 'Upload'
    input.value = '';

    delete this.filePreviewUrl[key];
    delete this.fileHistory[key];
    this.setFileControl(sectionIndex, '', controlName)
  }

  getFileType(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    switch (extension) {
      case 'txt': return 'text';
      case 'json': return 'json';
      case 'pdf':
      case 'doc':
      case 'docx': return 'document';
      case 'mp3':
      case 'wav': return 'audio';
      case 'mp4':
      case 'webm': return 'video';
      case 'png':
      case 'jpg':
      case 'jpeg': return 'image';
      default: return 'unknown';
    }
  }

  sanitizeFileUrl(fileName: string, fileUrl: string): SafeUrl {
    const fileExtension = fileName.split('.').pop()?.toLowerCase();

    if (!fileExtension) {
      return this.sanitizer.bypassSecurityTrustUrl(fileUrl); // Default sanitization
    }

    const imageExtensions = ['jpeg', 'jpg', 'png', 'gif', 'webp', 'svg'];
    const documentExtensions = ['pdf', 'doc', 'docx', 'ppt', 'txt', 'json'];
    const audioExtensions = ['mp3', 'wav', 'ogg'];
    const videoExtensions = ['mp4', 'webm', 'avi'];
    const textExtensions = ['txt', 'log', 'csv']; // For text file previews
    const zipExtensions = ['zip', 'rar', 'tar', '7z']; // Zip or archive files
    const executableExtensions = ['exe', 'bat', 'sh']; // Executable or script files

    // Check for image file
    if (imageExtensions.includes(fileExtension)) {
      return this.sanitizer.bypassSecurityTrustUrl(fileUrl); // Safe for image URLs
    }

    // Check for document file
    if (documentExtensions.includes(fileExtension)) {
      return this.sanitizer.bypassSecurityTrustResourceUrl(fileUrl); // Safe for document resource URLs
    }

    // Check for audio file
    if (audioExtensions.includes(fileExtension)) {
      return this.sanitizer.bypassSecurityTrustUrl(fileUrl); // Safe for audio URLs
    }

    // Check for video file
    if (videoExtensions.includes(fileExtension)) {
      return this.sanitizer.bypassSecurityTrustUrl(fileUrl); // Safe for video URLs
    }

    // Handle text files (e.g. .txt, .log)
    if (textExtensions.includes(fileExtension)) {
      return this.sanitizer.bypassSecurityTrustUrl(fileUrl); // Safe for text files, or display them
    }

    // Handle zip or archive files
    if (zipExtensions.includes(fileExtension)) {
      return this.sanitizer.bypassSecurityTrustUrl(fileUrl); // Offer for download instead
    }

    // Handle executable files (don't show them)
    if (executableExtensions.includes(fileExtension)) {
      return this.sanitizer.bypassSecurityTrustUrl(fileUrl); // Return safe URL, but don't open them in browser
    }

    // If no match, just return as a normal URL (fallback)
    return this.sanitizer.bypassSecurityTrustUrl(fileUrl);
  }
  isErrorExist(sectionIndex: number, attributeIndex: number, controlName: string) {
    const sections: any = this.preChatFormGroup.get('sections');
    const control = sections.at(sectionIndex).get(controlName);
    console.log('error control ', control)

  }
  disableTooltip(titleElement: any): boolean {
    if (!titleElement) return true; // Ensure the element exists to avoid errors
    return titleElement.scrollWidth <= titleElement.clientWidth;
  }

  openFileInNewTab(fileUrl: string) {
    if (!fileUrl) return;
    window.open(fileUrl, '_blank');
  }

  hasRequiredError(controlName: string, sectionIndex: number): boolean {
    const control = this.preChatFormGroup.get(['sections', sectionIndex])?.get(controlName);
    console.log('control===>', control)
    return !!(
      control &&
      control.hasError('required') &&
      (control.touched || control.dirty)
    );
  }


  getTextAlignment(alignment: string | undefined) {
    // by default, the text alignment is center from scss
    alignment = alignment?.toLowerCase();
    switch (alignment) {
      case 'left': return 'left';
      case 'right': return 'right';
      default: return null;
    }
  }
}
