import {
  AfterViewInit,
  Component,
  OnInit,
  ElementRef,
  Renderer2,
  ViewChild,
  Input,
  ChangeDetectorRef,
  HostListener
} from '@angular/core';
import {
  FormGroup,
  FormBuilder,
  Validators,
  FormControl,
  FormArray,
  AbstractControl,
} from '@angular/forms';
import { SdkService } from '../services/sdk.service';
import { ConfigService } from '../services/config.service';
import { StorageService } from '../services/storage.service';
import { StorageType } from './../services/storage.service';
import { BrowserNotificationService } from '../services/browser-notification.service';
import { DeliveryNotificationService } from '../services/delivery-notification.service';
import { PostMessageHandlerService } from '../post-message-handler.service';
import { lastValueFrom, Subscription } from 'rxjs';
import { CdkTextareaAutosize } from '@angular/cdk/text-field';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { ActivatedRoute, Router } from '@angular/router';
import { MatTooltip, TooltipPosition } from '@angular/material/tooltip';
import { TranslateService } from '@ngx-translate/core';
import { DOCUMENT } from '@angular/common';
import { Inject } from '@angular/core';
import { FormMessageTypeService } from '../services/form-message-type.service';
import { NgxSpinnerService } from "ngx-spinner";

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
  customerId: string = '';
  formValidations: any;
  // If this flag is 'true' than that's mean Chat is Active
  isChatActive = false;
  // If this flag is 'true' than that's mean Audio Call is Active (In Side Chat Screen)
  isAudioCallActive = false;
  // If this flag is 'true' than that's mean Video Call is Active (In Side Chat Screen)
  isVideoCallActive = false;
  // If this flag is 'true' than that's mean ScreenShare Call is Active (In Side Chat Screen)
  isScreenShareActive = false;


  // Teneo
  formatLabel(value: number): string {
    if (value >= 1000) {
      return Math.round(value / 1000) + 'k';
    }

    return `${value}`;
  }
  INTERACTIVE_TYPES = ['button', 'carousel','form_data'];
  // Variables for Call Controls
  isCallMute = false;
  isVideoHide = false;
  isCallOnHold = false;
  remoteStreamStatus = false;
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
  counterVar: any = null; // will be used in count down timer
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
  errorMessage: string = '';

  fontDropDown = false;
  positionOptions: TooltipPosition[] = [
    'after',
    'before',
    'above',
    'below',
    'left',
    'right',
  ];
  matToolTipPosition = this.positionOptions[3];
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

  private formStateMap = new Map<string, { values: any; status: string; schema: any }>();


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
  preChatformTitle: string = '';
  preChatformDescription: string = '';
  preChatFormInfo: any;
  remoteStream: any = [];
  localStream: any = [];
  isMinimizeIconDisable: boolean = false;
  isExitIconDisable: boolean = false;

  // Image Overlay properties
  isImageOverlayOpen: boolean = false;
  overlayImageUrl: string = '';
  overlayImageAlt: string = '';


  @Input() formData!: any[];
  @Input() callbackFormData!: any[];
  preChatFormGroup!: FormGroup;
  callbackFormGroup!: FormGroup;
  preChatFormLoader = false;
  callbackLoader = false;
  callbackConfig: any;
  todayShifts: {
    eventId: string;
    shiftName: string | null;
    startTime: string;
    endTime: string;
  }[] = [];
  events: EventData[] = [];
  orderedEvents: any[] = [];
  daySummary: { startOfDay: Date | null; endOfDay: Date | null } | null = null;

  webhookUrl: any;
  isChatTranscriptVisible = false;

  formMessageTypeData: any;
  // Upload File Variables
  imageUrls: {
    filesPath: SafeUrl;
    fileType: string;
    fileExt: string;
    fileName: string;
  }[] = [];

  fileLoading = false;
  selectedFile: any;
  fileUrl: any = '';
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
  storageType: StorageType = 'localStorage';

  // file preview
  filePreviewUrl: { [key: string]: any } = {};
  fileHistory: { [key: string]: { isImage: boolean } } = {};
  // Add a new property to store text content
  fileContent: { [key: string]: string } = {};
  isSecureLinkExpired: boolean = false;
  IsRegisteredInFreeSwitch: boolean = false;
  currentTypeIndex = 1;
  private messageMap: Map<string, any> = new Map();

  // file properties
  fileExtensons: any[] = [
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

  isFileSelected: any;
  isFileUploading: any = {};
  formGroupsMap: { [messageId: string]: FormGroup } = {};
  stars = [1, 2, 3, 4, 5];

  isStarRating = true;
  isCarouselView = true;
  
  // Additional Schema and Values from Widget Config
  additionalSchema: any[] = [];
  additionalValues: any[] = [];
  additionalValuesMap: { [key: string]: any } = {};
  widgetType = "COMPACT";
  appliedColorTheme: string = '';
  avaClientId: string = '';
  defaultWidgetLanguage: string = 'en';

  reconnectAttemptsConfig = {
    currentAttempt: 0,
    maxAttempts: 5,
  }
  
  constructor(
    private route: ActivatedRoute,
    private fb: FormBuilder,
    public sdk: SdkService,
    public __appConfig: ConfigService,
    private storageService: StorageService,
    private el: ElementRef,
    private renderer: Renderer2,
    private cdRef: ChangeDetectorRef,
    private sanitizer: DomSanitizer,
    private snackBar: MatSnackBar,
    public dialog: MatDialog,
    private browserNotificationService: BrowserNotificationService,
    private deliveryNotificationService: DeliveryNotificationService,
    private __postMessageHandlerService: PostMessageHandlerService,
    private translate: TranslateService,
    private router: Router,
    @Inject(DOCUMENT) private doc: Document,
    private formMessageTypeService: FormMessageTypeService,
    private spinner: NgxSpinnerService
  ) {
    this.logoEnabled = __appConfig.appConfig.ENABLE_LOGO;
    this.additionalPanel = __appConfig.appConfig.ADDITIONAL_PANEL;
    this.isUsernameEnabled = __appConfig.appConfig.USERNAME_ENABLED;
    this.storageType = this.__appConfig.appConfig.AUTO_RESUME_ON_NEW_TAB
      ? 'localStorage'
      : 'sessionStorage';

    translate.setDefaultLang('en');
    translate.use('en');
  }

  async ngAfterViewInit(): Promise<void> {
    if (!this.standaloneWebRtc) {
      this.customerChatResumed();
      console.log('Not Secure Chat View');
    }

    // Set the Customer Widget Theme Color based on Configurations from Unified Admin's Web Widget settings
    setTimeout(() => {
      (this.el.nativeElement as HTMLElement).style.setProperty(
        '--main-color',
        this.theme,
      );
    }, 1000);
  }

  ngOnInit(): void {
    this.initPrechatform();
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
        const preservedKey = decodeURIComponent(rawEncryptedKey);
        this.webRtcSecureLink = preservedKey;
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
      this.getCalendarEvents();
    });

    this.preChatFormGroup = this.fb.group({});
    this.callbackFormGroup = this.fb.group({});

    this.widgetConfigsSubscription = this.sdk.widgetConfigs$.subscribe(
      (configs: any) => {
        console.log("SUBSCRIBERS: Widget configs received", configs);
        this.setWidgetConfigs(configs);

        this.loadBrowserLanguage();
        console.log('Widget configurations:', configs);
        
        // Log additional schema and values processing
        if (configs.additionalSchema || configs.additionalValues) {
          console.log('Processing additional schema and values...');
          this.changeScreen('widget');
        }

        if (this.enabledCallback) {
          this.sdk.renderCallbackForm(this.callbackConfig.callBackForm);
        }
        this.sdk.getFormValidation(() => {
          if (configs.form !== '')
            this.sdk.renderPreChatForm(this.preChatFormId);
        });

        window.parent.postMessage({
          state: "EF_WIDGET_LOADED",
          message: "Customer Widget Loaded Successfully",
				}, "*");

      },
    );

    this.sdk.validationsSubcription.subscribe((res) => {
      this.formValidations = res;
      this.preChatFormSubscription = this.sdk.renderPreChatForm$.subscribe(
        (formData: {
          sections: { attributes: any[] }[];
          formTitle: string;
          formDescription: string;
        }) => {
          this.preChatFormInfo = formData;
          console.log('preChatFormInfo========>', this.preChatFormInfo);
          this.formData = formData.sections;
          this.preChatformTitle = formData?.formTitle;
          this.preChatformDescription = formData?.formDescription;
          this.createFormValidationControls(
            this.formData,
            this.formValidations,
            'preChatForm',
          );
          let userData: string | null = this.storageService.getItem(
            'user',
            this.storageType,
            false,
          );
          if (this.getAdditionalValue('AUTO_MAXIMIZE_WIDGET') === true && userData == null) {
            this.changeScreen('chatForm');
          }
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
          if (data.data && data.data.length > 0) {
            this.handleResumedMessages(data.data);
          } else {
            this.clearSession();
          }
        } else if (data.isChatAvailable == false) {
          this.clearSession();
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
    this.getCalendarEvents();
    window.addEventListener('message', this.receiveMessage.bind(this), false);

  }

  initPrechatform() {
    this.preChatFormGroup = this.fb.group({
      sections: this.fb.array([]),
    });
  }

  receiveMessage(event: MessageEvent): void {
    const action = event.data?.action?.toLowerCase();
    
    switch (action) {
      case 'initialize_chat':
        if (this.isChatActive === false) {
          this.changeScreen('chatForm');
        } else if (this.isChatActive === true) {
          this.changeScreen('chat');
        }
        break;
        
      case 'update_input_params':
        let inputParams = event.data?.inputParams;
        // verify input params is not null or empty
        if (inputParams != null && Object.keys(inputParams).length > 0) {
          let storedInputParams = this.getAdditionalValue('INPUT_PARAMS') || {};
          Object.keys(inputParams).forEach(element => {
            storedInputParams[element] = inputParams[element];
          });
          this.setAdditionalValue('INPUT_PARAMS', storedInputParams);
          console.log('Updated INPUT_PARAMS:', this.getAdditionalValue('INPUT_PARAMS'));
        }
        break;

      case 'update_theme':
        let themeColor = event.data?.value.toLowerCase();
        console.log('Updating theme color to:', themeColor);
        this.appliedColorTheme = themeColor;
        break;

      case 'set_ava_client_id':
        let avaClientId = event.data?.value.toLowerCase();
        console.log('Setting AVA Client ID to:', avaClientId);
        this.avaClientId = avaClientId;
        break;
    }
    
  }

  async getCalendarEvents() {
    this.sdk
      .fetchBusinessCalendarId()
      .then((calendarId: string) => {
        return this.sdk.getCalendarEvents(calendarId);
      })
      .then((events) => {
        this.events = events.events;
        if (this.events?.length > 0) {
          this.getTodayEvent();
        }
      })
      .catch((error) => {
        console.log('Business Calendar Api Response:', error);
      });
  }

  getTodayEvent(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      try {
        const today = new Date();
        const todayStart = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate(),
        ); // Start of today in local time
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
            }),
        );

        // Flatten all shifts into a single array
        const allShifts = todayEvents.flatMap((event) =>
          event.shifts?.map((shift) => ({
            type: event.type,
            shiftName: shift.name,
            startTime: shift.startTime,
            endTime: shift.endTime,
          })),
        );

        // If no shifts are available, handle accordingly
        if (!allShifts.length) {
          this.daySummary = null;
          return resolve([]);
        }
        const minStartTime = new Date(
          Math.min(
            ...allShifts.map((shift) =>
              shift?.startTime ? new Date(shift.startTime).getTime() : Infinity,
            ),
          ),
        );

        const maxEndTime = new Date(
          Math.max(
            ...allShifts.map((shift) =>
              shift?.endTime ? new Date(shift.endTime).getTime() : -Infinity,
            ),
          ),
        );

        // Set the day summary with the minimum and maximum times
        this.daySummary = {
          startOfDay: minStartTime,
          endOfDay: maxEndTime,
        };

        ///this.orderedEvents = allShifts;

        resolve(this.orderedEvents);
      } catch (error) {
        reject('Error processing Business Hours events: ' + error);
      }
    });
  }

  formatTime(dateTime: string): string {
    const date = new Date(dateTime);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
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
    formType: string,
    targetFormGroup?: FormGroup
  ): void {

    console.log('formSchema', formSchema);
    const sectionsArray: FormArray = this.fb.array([]); // Create the main sections FormArray

    formSchema.forEach((section) => {
      const sectionGroup = this.fb.group({}); // Create a FormGroup for each section
      section.attributes.forEach((attribute: any) => {
        const matchingValidation = formValidation.find(
          (validation: any) => validation.type === attribute.valueType,
        );

        // Initialize validators array
        const validators = [];
        console.log(attribute.isRequired);
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
                !['shortanswer', 'paragraph'].includes(
                  matchingValidation.type.toLowerCase(),
                )
              ) {
                validators.push(
                  Validators.pattern(
                    matchingValidation.type.toLowerCase() === 'password'
                      ? /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])[A-Za-z\d\W_]{8,256}$/
                      : new RegExp(matchingValidation.regex),
                  ),
                );
              }
              break;

            case 'datetime':
            case 'date':
            case 'time':
              break; // No validation needed

            default:
              validators.push(
                Validators.pattern(new RegExp(matchingValidation.regex)),
              );
              break;
          }
        }


        // 🔑 Compute default value only for formMessageType
      const defaultValue =
        formType === 'formMessageType' ? this.formMessageTypeService.getDefaultValue(attribute) : '';
        // console.log('Adding control:', attribute.key, 'with validators:', validators);

      sectionGroup.addControl(attribute.key, this.fb.control(defaultValue, validators));
      });
      console.log('section', section);

      // Add the section group to the sections FormArray
      sectionsArray.push(sectionGroup);
    });
    if (formType === 'preChatForm') {
      this.preChatFormGroup.setControl('sections', sectionsArray);
    }

    if(formType === 'formMessageType') {
      targetFormGroup.setControl('sections', sectionsArray);
    }
  }

  getSectionsControls(messageId: string): AbstractControl[] {
  const formGroup = this.formGroupsMap[messageId];
  const sections = formGroup?.get('sections');
  return sections && sections instanceof FormArray ? sections.controls : [];
}


  async setWidgetConfigs(configs: any) {
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
    this.defaultWidgetLanguage = configs.language.code || 'en';
    if (this.webRTCConfig !== null) {
      this.enableWebRtc = configs.webRtc?.enableWebRtc;
      console.log('List of webRTC Configs: ', this.webRTCConfig);

      if (this.standaloneWebRtc) {
        await this.authenticateSecureLinkKey(false);
        this.changeScreen('webRtcScreen');
      }
    }

    this.callbackConfig = configs.callback;
    if (this.callbackConfig !== null) {
      this.enabledCallback = configs.callback?.enableCallback;
      this.standaloneCallback = configs.callback?.standaloneCallback;
    }
    if (configs.webhook !== null) {
      this.webhookUrl = configs.webhook?.webhookUrl;
      this.enabledWebhook = configs.webhook?.enableWebhook;
    }

    // Process additional schema and values
    this.processAdditionalSchemaAndValues(configs);
  }


  private processAdditionalSchemaAndValues(configs: any): void {
    // Store additional schema
    this.additionalSchema = configs.additionalSchema || [];
    
    // Store additional values
    this.additionalValues = configs.additionalValues || [];
    
    // Create a map for easy lookup of values by key
    this.additionalValuesMap = {};
    if (this.additionalValues && Array.isArray(this.additionalValues)) {
      this.additionalValues.forEach((item: any) => {
        if (item.key) {
          this.additionalValuesMap[item.key] = {
            type: item.type,
            value: item.value
          };
        }
      });
    }
    
    this.additionalValuesMap['INPUT_PARAMS'] = {
      type: 'object',
      value: this.getInputParamsAsEntities()
    };
    this.isExitIconDisable = this.additionalValuesMap["HIDE_WIDGET_EXIT_ICON"]?.value || false;
    this.isMinimizeIconDisable = this.additionalValuesMap["HIDE_WIDGET_MINIMIZE_ICON"]?.value || false;
    console.log('Additional Schema:', this.additionalSchema);
    console.log('Additional Values:', this.additionalValues);
    console.log('Additional Values Map:', this.additionalValuesMap);
  }

  getAdditionalValue(key: string): any {
    return this.additionalValuesMap[key]?.value || null;
  }

  setAdditionalValue(key: string, value: any): void {
    if (this.additionalValuesMap[key]) {
      this.additionalValuesMap[key].value = value;
    } else {
      this.additionalValuesMap[key] = { type: typeof value, value: value };
    }
  }

  getAdditionalValueWithType(key: string): { type: string; value: any } | null {
    return this.additionalValuesMap[key] || null;
  }

  hasAdditionalValue(key: string): boolean {
    return key in this.additionalValuesMap;
  }

  getInputParamsAsEntities(): any {
    const entities: any = {};
    let inputParamList = this.getAdditionalValue('INPUT_PARAMS_LIST');
    inputParamList = inputParamList ? inputParamList.split(',').map(item => item.trim()) : [];
    if (inputParamList && Array.isArray(inputParamList)) {
      inputParamList.forEach((paramKey: string) => {
        if (this.hasAdditionalValue(paramKey)) {
          entities[paramKey] = this.getAdditionalValue(paramKey);
        }
      });
    }
    return entities;
  }

  async onFormMessageTypeSubmit(message: any): Promise<void> {
    const messageId = message.id;
    const form = this.formGroupsMap[messageId];
      if (form.invalid) {
        form.markAllAsTouched(); // Mark all fields touched so errors show
        this.snackBar.open('Please fill all the required fields', 'X', {
        duration: 2000, // 5 seconds
        panelClass: ['error-snackbar'],
        horizontalPosition: 'right',
        verticalPosition: 'bottom',
      });
        return; // Stop submission
      }

      let finalPayload = this.createFormDataObject();

      finalPayload.body.sections = await this.creatingSectionsforSchema(form.value, "formMessageType");

      // Step 2: Update fields from form data (if needed)
      finalPayload.header.timestamp = Date.now();
      finalPayload.id = messageId;
      finalPayload.header.intent = '';
      finalPayload.body.formId = '';
      finalPayload.body.formTitle= message.body.formTitle || '';

      this.constructCimMessage(
          'FORM_DATA',
          null,
          null,
          finalPayload.id,
          null,
          null,
          null,
          null,
          null,
          null,
          finalPayload,
          'filled'
        );
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
          console.log('Pre Chat Form Data:', this.preChatFormData); 
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

  initializeChatWithRandomIdentifier(): void {

    try {
      this.preChatFormData = {
          "sections": [
              {
                  "name": "Test User",
                  "phone": this.avaClientId !== '' ? this.avaClientId : Math.floor(10000000 + Math.random() * 90000000).toString()
              }
          ]
      }
      console.log('Pre Chat Form Data:', this.preChatFormData); 
      let eventPayload = this.getEventPayload(this.preChatFormData);
      console.log('Event Payload: ==>', eventPayload);
      // If Error is false than proceed with the start Chat and user data setting
      if (!eventPayload.error) {
        this.setUserData(eventPayload.data, 'startChat');
      }
    } catch (error) {
      
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
      this.storageService.setItem('user', user, this.storageType);
      if (this.storageService.getItem('user', this.storageType)) {
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
      if (
        Object.prototype.hasOwnProperty.call(section, field) &&
        section[field] !== null
      ) {
        return { error: false, data: section[field] }; // Field is found in at least one section with a non-null value
      }
    }

    return {
      error: true,
      data: `Error: The field "${field}" is required or does not exist in the pre-chat form.`,
    };
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
            language: this.translate.currentLang 
              ? this.translate.currentLang
              : this.browserInfoData?.geoLocationData?.languages || null,
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
    this.sdk.postFormDataAsActivity(finalPayload);
  }

  calculateAttributeScore(formData: any) {
    formData.body.sections.forEach((section: any) => {
      // console.log(section);
      section.attributes.forEach((attribute: any) => {
        //  console.log(attribute);
        let selectedOption = attribute?.answer.find(
          (option: any) => option?.isSelected === true,
        );
        // console.log(selectedOption.additionalAttributes.optionWeightage, "SELECTED OPTIONS");
        if (selectedOption) {
          let selectedOptionWeightage =
            selectedOption?.additionalAttributes?.optionWeightage;
          attribute.attributeScore = parseFloat(
            (
              (selectedOptionWeightage / 100) *
              attribute?.attributeWeightage
            ).toFixed(1),
          );
        } else {
          attribute.attributeScore = 0;
        }

        // console.log(attribute.attributeScore, "ATTRIBUTE SCORE");
      });
    });
  }

  calculateSectionScores(formData: any) {
    formData.body.sections.forEach((section: any) => {
      let totalAttributeWeightage = 0;
      section.attributes.forEach((attribute: any) => {
        totalAttributeWeightage += attribute.attributeScore;
      });
      // console.log('totalAttributeWeightage', totalAttributeWeightage)
      section.sectionScore = parseFloat(
        ((totalAttributeWeightage / 100) * section.sectionWeightage).toFixed(1),
      );
    });
  }

  calculateFormScore(formData: any): any {
    // console.log(sections);
    if (!formData) return;

    let totalSectionWeightages = 0;
    formData.body.sections.forEach((section: any) => {
      console.log(section);
      totalSectionWeightages += section.sectionScore;
    });

    formData.body.formScore =
      parseFloat(
        (
          (totalSectionWeightages / 100) *
          formData?.body?.formWeightage
        ).toFixed(1),
      ) || null;
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
        intent: 'WIDGET_FORM_ACTIVITY',
        entities: {},
        channelSessionId: '',
        conversationId: this.conversationId,
        customer: {
          _id: this.customerId,
        },
        schedulingMetaData: null,
        originalMessageId: null,
        providerMessageId: null,
        sender: {
          id: 'f1370ff7-43fa-496e-9966-e64061d35f5c',
          type: 'APP',
          senderName: 'WIDGET_PRECHAT_FORM',
          additionalDetail: null,
        },
      },
      body: {
        formId: this.preChatFormInfo?.id,
        formTitle: this.preChatFormInfo?.formTitle,
        type: 'FORM_DATA',
        formWeightage: this.preChatFormInfo?.formWeightage,
        formScore: '',
        additionalDetail: {
          actor: {
            type: 'Customer',
            id: this.customerId,
          },
          submissionSource: 'Pre-chat',
          review: null,
          reviewer: null,
          agentReviewed: null,
        },
        sentiment: {
          result: null,
          color: null,
        },
        sections: [],
      },
      id:''
    };
  }


  creatingSectionsforSchema(messageTypeFormValues?, messageType?): any {

    let formData : any[] = [];
    let formValues: any[] = [];

    if (messageType === "formMessageType" && this.formMessageTypeData && this.isChatActive) {
      formData = this.formMessageTypeData || [];
      formValues = messageTypeFormValues;
    } else if( this.preChatFormInfo && !this.isChatActive) {
      formData = this.formData;
      formValues = this.preChatFormGroup.value;
    }

    let finalSections: any = [];

    formData.forEach((section: any, sectionIndex: number) => {
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
            key: attribute.key || null,
            attributeAttachment: attribute.attributeAttachment || "",
            answer: this.getAnswerObj(attribute, possibleValues, selectedValue, currentSectionAttributes)
          };
          newSection.attributes.push(newAttribute);
        });
      }
      finalSections.push(newSection);
    });
    return finalSections;
  }


  getAnswerObj(attribute: any, possibleValues: any[], selectedValue: any, currentSectionAttributes: any) {

    if (attribute.attributeType == 'INPUT' || attribute.attributeType == 'TEXTAREA') {
      return [selectedValue]
    }
    else if (attribute.valueType === 'checkbox') {
      const rawValue = currentSectionAttributes?.[attribute.key];

      const enableCategory = attribute.attributeOptions?.enableCategory || false;
      const attributeData = attribute.attributeOptions?.attributeData || [];

      if (enableCategory) {
        return attributeData.map(category => {
          const categoryLabel = category.label;
          const selectedValues = rawValue?.[categoryLabel] || [];

          return {
            category: categoryLabel,
            options: category.values.map((option: any) => ({
              label: option.label,
              value: option.value || option.label,
              isSelected: selectedValues.includes(option.label),
              additionalAttributes: {
                optionWeightage: option.optionWeightage || null,
                enableStyle: attribute.attributeOptions?.enableStyle || false,
                optionStyle: option.optionStyle || null
              }
            }))
          };
        });
      } else {
        const selectedValues = Array.isArray(rawValue) ? rawValue : [];

        return possibleValues.map(option => ({
          label: option.label,
          value: option.value || option.label,
          isSelected: selectedValues.includes(option.label),
          additionalAttributes: {
            optionWeightage: option.optionWeightage || null,
            enableStyle: attribute.attributeOptions?.enableStyle || false,
            optionStyle: option.optionStyle || null
          }
        }));
      }
    }
    else {
      selectedValue = selectedValue ? (selectedValue.value ?? selectedValue) : null;

      return possibleValues.map(option => ({
        label: option.label,
        value: option.value || option.label,
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
      entities: this.getAdditionalValue('INPUT_PARAMS'),
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
    this.storageService.setItem('wrapper-hide', 'true', this.storageType);
  }

  changeScreen(screen: any) {
    console.log('Change Screen:', screen);
    switch (screen) {
      case 'widget':
        if (
          this.storageService.getItem('wrapper-hide', this.storageType) ===
            'true' ||
          this.__appConfig.appConfig.ADDITIONAL_PANEL !== true ||
          this.getAdditionalValue('HIDE_CALLOUT_PANEL')
        ) {
          this.additionalPanel = false;
          this.resizeWidget('icon-view');
        } else {
          this.additionalPanel = true;
          this.resizeWidget('wraper-view');
        }
        if (this.standaloneWebRtc) {
          this.authenticateSecureLinkKey(false);
        }
        this.preChatFormScreen = false;
        this.callbackFormScreen = false;
        this.webRtcVideoCallScreen = false;
        this.callbackResponseScreen = false;
        this.widgetChatScreen = false;
        this.chatError = false;
        this.chatEndScreen = false;
        this.isChatMax = false;
        this.isCallbackMax = false;
        this.isWebRtcMax = false;
        this.fileName = '';
        if(this.getAdditionalValue('HIDE_WIDGET_ICON')){
          this.isIconWidget = false;
        } else{
          this.isIconWidget = true;
        }
        if (this.isChatActive) {
          this.__postMessageHandlerService.sendPostMessage({
            type: "EF_WIDGET_STATE_CHANGED",
            state: "CHAT_MINIMIZED"
          });
        }
        break;
      case 'chat':
        this.additionalPanel = false;
        this.preChatFormScreen = false;
        this.callbackFormScreen = false;
        this.webRtcVideoCallScreen = false;
        this.callbackResponseScreen = false;
        this.widgetChatScreen = true;
        this.isIconWidget = false;
        this.chatError = false;
        this.isSecureWebCall = false;
        this.chatEndScreen = false;
        this.isChatMax = true;
        this.isCallbackMax = false;
        this.isWebRtcMax = false;
        this.changeView('chat');
        this.resizeWidget('form-view');
        break;
      case 'chatForm':
        if (this.getAdditionalValue("PRECHAT_FORM_DISABLED")){
          this.changeScreen('chat');
          this.initializeChatWithRandomIdentifier();
          return;
        }
        this.preChatFormScreen = true;
        this.callbackFormScreen = false;
        this.webRtcVideoCallScreen = false;
        this.callbackResponseScreen = false;
        this.additionalPanel = false;
        this.isIconWidget = false;
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
        this.isIconWidget = false;
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
        this.isIconWidget = false;
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
        this.isIconWidget = false;
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
        this.isIconWidget = false;
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
        this.isIconWidget = false;
        this.isChatMax = true;
        this.isCallbackMax = false;
        this.isWebRtcMax = false;

        this.additionalPanel = false;
        this.resizeWidget('form-view');
        break;
    }
    this.cdRef.detectChanges();
  }

  // Image Overlay Methods
  openImageOverlay(imageUrl: string, altText: string): void {
    this.overlayImageUrl = imageUrl;
    this.overlayImageAlt = altText;
    this.isImageOverlayOpen = true;
  }

  closeImageOverlay(): void {
    this.isImageOverlayOpen = false;
    this.overlayImageUrl = '';
    this.overlayImageAlt = '';
  }

  async changeView(view: any) {
    if (this.showInvalidCodeError && this.standaloneWebRtc) {
      if (!this.isSecureLinkExpired) {
        this.snackBar.open(this.showAuthenticationResponseMessage, 'Dismiss', {
          duration: 3000,
          panelClass: ['error-snackbar'],
          horizontalPosition: 'right',
        });
      }
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
          if (!this.IsRegisteredInFreeSwitch) {
            await this.logInToFreeSwitch();
          }
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
          console.warn('WebRTC Call Is GOING ON');
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
          console.warn('Error : Some Issues in initiating Stand alone Call');
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
    this.cdRef.detectChanges();
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

  resizeWidget(state: string): void {
    // send height and width of widget-form-area to parent window
      window.parent.postMessage({ state }, '*');
  }

  eventListener(event: any) {
    try {
      let lastMessage = this.cimMessage[this.cimMessage.length - 1];
      let messageType = lastMessage?.body?.subType?.toLowerCase();
      if (event.id !== undefined || event.id !== '' || event.id !== null) {
        switch (event.type) {
          case 'CHANNEL_SESSION_ENDED':
          case 'CHANNEL_SESSION_EXPIRED':
            if (messageType !== 'survey') {
              this.clearSession();
            } else {
              this.storageService.removeItem('user', this.storageType);
              this.isChatActive = false;
            }
            this.composerDisable();
            this.__postMessageHandlerService.sendPostMessage({
              type: "EF_WIDGET_STATE_CHANGED",
              state: "CHAT_SESSION_ENDED",
              reason: event.type
            });
            break;
          case 'SOCKET_CONNECTED':
            this.handleReconnectsAttempts(0);
            console.log(
              '[SOCKET_CONNECTED] ==> Connection Request Response:',
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
              if (this.customerData) {
                this.sdk.onChatResumed(
                  this.customerData.serviceIdentifier,
                  this.customerData.channelCustomerIdentifier,
                );
              } else {
                if (event.data && event.data.auth) {
                  this.sdk.onChatResumed(
                    event.data.auth.serviceIdentifier,
                    event.data.auth.channelCustomerIdentifier,
                  );
                }
                  console.log(
                  '[SOCKET_CONNECTED] ==> Chat Resume event response:',
                  this.customerData,
                );
              }
            }
            this.changeScreen('chat');
            this.enableComposer();
            break;
          
          case 'CONVERSATION_RESUMED':
            console.log(
              '[CONVERSATION_RESUMED] ==> Chat Resumed Response:',
              event.data,
            );
            this.isChatActive = true;
            this.handleReconnectsAttempts(0);
            
            this.preChatFormLoader = false;
            this.changeScreen('chat');
            this.enableComposer();
            this.conversationId = event.data.history[0].header.conversationId;
            this.storageService.setItem(
              'conversationId',
              event.data.history[0].header.conversationId,
              this.storageType,
            );
            event.data.history &&
              this.handleResumedMessages(event.data.history);
            break;
          case 'CHANNEL_SESSION_STARTED':
            this.isChatActive = true;
            this.isComposerDisable = false;
            this.preChatFormLoader = false;
            this.conversationId = event.data.header.conversationId;
            this.customerId = event.data.header.customer._id;
            this.storageService.setItem(
              'conversationId',
              event.data.header.conversationId,
              this.storageType,
            );
            this.sdk.setConversationDataAgainstCustomerIdentifier(
              this.customerData.channelCustomerIdentifier,
              this.getFormDataAsConversationData(this.preChatFormData),
            );
            this.pushPrechatDataAsActivity();

            // this.composerDisable()
            break;
          case 'MESSAGE_RECEIVED':
            console.log('event response:', event.data);
            this.handleCimMessage(event.data);
            console.log('Cim Message Array: ', this.cimMessage);
            break;
          case 'SOCKET_DISCONNECTED':
            console.log('event response:', event.data);
            // this.isChatActive = false;
            this.composerDisable();
            this.eventTriggerType = '';
            if (messageType !== 'survey') {
              if (event.data.includes('server')) {
                this.changeScreen('end');
              } else {
                this.handleReconnectsAttempts(this.reconnectAttemptsConfig.currentAttempt + 1);
              }
            }
            break;
          case 'SOCKET_REPLACED':
            console.log('event response:', event.data);
            this.cimMessage = [];
            this.clearMessageData();
            this.isChatActive = false;
            this.composerDisable();
            this.changeScreen('end');
            break;
          case 'CONNECT_ERROR':
            this.handleReconnectsAttempts(this.reconnectAttemptsConfig.currentAttempt + 1);
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

  enableComposer() {  
    console.log('message element is ', this.messageElement);
    const messageRef: any = this.messageElement?.nativeElement;
    if (messageRef) {
      this.renderer.removeAttribute(messageRef, 'disabled');
      this.renderer.setAttribute(
        messageRef,
        'placeholder',
        this.translate.instant('composer-placeholder'),
      );
      this.renderer.setProperty(messageRef, 'value', '');
      this.isComposerDisable = false;
    }

    // this.renderer.setAttribute(messageRef, 'class', 'composer-disable')
  }


  handleCimMessage(cimMessage: any) {

     if (cimMessage.body.type?.toLowerCase() === 'form_data' &&
       cimMessage.header.sender?.type?.toLowerCase() === 'bot') {
        this.showTypingIndicator();
        this.createFormMapGroup(cimMessage);
      }

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
      if (cimMessage.header.sender.type.toLowerCase() == 'agent' || cimMessage.header.sender.type.toLowerCase() == 'bot') {
        console.log('Event  received with data  ', cimMessage.body);

        this.showTypingIndicator();
      }
    } else if (
      cimMessage.body.type.toLowerCase() == 'plain' &&
      cimMessage.header.sender &&
      (cimMessage.header.sender.type.toLowerCase() == 'agent' ||
        cimMessage.header.sender.type.toLowerCase() == 'bot')
    ) {

      this.stopTypingIndicator();
      const urlRegex =
        /(?:https?:\/\/)?(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(?:\/[^\s]*)?/g;
      const urls = cimMessage.body.markdownText.match(urlRegex);
      if (urls) {
        for (let url of urls) {
          if (url.includes('type=survey')) {
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

      if (cimMessage.header.sender.type.toLowerCase() == 'agent') {
        let fullName = this.getAgentDisplayName(
          cimMessage.header.sender.additionalDetail,
        );
        if (!this.isUsernameEnabled) {
          cimMessage.header.sender.senderName = fullName;
        }
      }

      if (
        cimMessage.header.intent &&
        cimMessage.header.intent.toLowerCase() === 'update'
      ) {
        this.editMessage(cimMessage);
        this.handleMessageReport(cimMessage);
      }

      else {
        this.cimMessage.push(cimMessage);
        this.browserNotificationService.notify(cimMessage);
        this.scrollToBottom();
        this.handleMessageReport(cimMessage);
      }
    }


    // For Teneo Bot

    else if (cimMessage.header.sender.type.toLowerCase() === 'customer') {

      this.disableOldInteractiveMessages(this.cimMessage);
      if (
        cimMessage.header.originalMessageId &&
        cimMessage.header.intent &&
        cimMessage.header.intent.toLowerCase() !== 'update' &&
        cimMessage.header.additionalData?.carousalCardId
      ) {
        this.handleCarousalQuotedMessage(cimMessage);
      }


      else if(cimMessage.header.originalMessageId &&
        cimMessage.header.intent && cimMessage.header.intent.toLowerCase() !== 'update') {
          this.handleClickableList(cimMessage);
      }

      else if(cimMessage.body.type.toLowerCase() === 'form_data') {
        this.handleFormMessageType(cimMessage);
      }

      else {
       this.cimMessage.push(cimMessage);
       this.browserNotificationService.notify(cimMessage);
       this.scrollToBottom();
       this.handleMessageReport(cimMessage);
      }

      // ✅ Apply interaction state only once
      if (cimMessage.header.originalMessageId) {
        this.applyInteractionState(cimMessage);
      }
    }

    else {
      if (
        cimMessage.body.type.toLowerCase() != 'notification' &&
        cimMessage.header.sender.type.toLowerCase() == 'agent'
      ) {
        clearTimeout(this.typingIndicatorTimer);
        this.typingIndicatorTimer = null;

        let fullName = this.getAgentDisplayName(
          cimMessage.header.sender.additionalDetail,
        );
        if (!this.isUsernameEnabled) {
          cimMessage.header.sender.senderName = fullName;
        }
      }

      if (cimMessage.body.type.toLowerCase() == 'notification') {
        if (
          cimMessage.body.notificationData.data?.agentParticipant?.participant?.keycloakUser
        ) {
          let fullName = this.getAgentDisplayName(
            cimMessage.body.notificationData.data.agentParticipant.participant
              .keycloakUser,
          );
          if (!this.isUsernameEnabled) {
            cimMessage.body.notificationData.data.agentParticipant.participant.keycloakUser.username =
              fullName;
          }
        }

        if (
          cimMessage.body?.notificationData?.data?.conversationParticipant?.participant?.keycloakUser
        ) {
          let fullName = this.getAgentDisplayName(
            cimMessage.body.notificationData.data.conversationParticipant.participant.keycloakUser,
          );
          if (!this.isUsernameEnabled) {
            cimMessage.body.notificationData.data.conversationParticipant.participant.keycloakUser.username =
              fullName;
          }
        }
      }

      if (
        cimMessage &&
        cimMessage.header &&
        cimMessage.header.intent &&
        cimMessage.header.intent.toLowerCase() === 'update'
      ) {
        this.editMessage(cimMessage);
        this.handleMessageReport(cimMessage);
      } else {
        this.cimMessage.push(cimMessage);
        this.browserNotificationService.notify(cimMessage);
        this.scrollToBottom();
        this.handleMessageReport(cimMessage);
      }
    }

    // ✅ At the end of handleCimMessage:
    if (cimMessage?.id) {
      this.messageMap.set(cimMessage.id, cimMessage);
    }
  }

  // 🔹 Separate functions
  private showTypingIndicator() {
    this.isTyping = true;

    if (this.typingIndicatorTimer) {
      clearTimeout(this.typingIndicatorTimer);
    }

    this.typingIndicatorTimer = setTimeout(() => {
      this.stopTypingIndicator();
    }, 5000);
  }

  private stopTypingIndicator() {
    this.isTyping = false;
    if (this.typingIndicatorTimer) {
      clearTimeout(this.typingIndicatorTimer);
      this.typingIndicatorTimer = null;
    }
  }

  disableOldInteractiveMessages(cimMessages: any[]) {
    cimMessages.forEach((message: any) => {
      const isFromBot = message.header?.sender?.type?.toLowerCase() === 'bot';
      const type = message.body?.type?.toLowerCase();

      if (!isFromBot || !this.INTERACTIVE_TYPES.includes(type)) return;

      const userReply = cimMessages.find(
        (m: any) => m.header?.originalMessageId === message.id
      );

      // If a reply exists, apply interaction state
      if (userReply) {
        this.applyInteractionState(userReply);
      }
      if (type === 'button') {
        const disableInteraction = message.body?.additionalDetails?.interactive?.disableInteraction;

          if (disableInteraction === true) {
            message.body.additionalDetails = {
            ...(message.body.additionalDetails || {}),
            disableButtonType: true,
          }
        }
      }

      if (type === 'carousel') {
        const disableInteraction = message.body?.elements?.[0]?.additionalCarouselElementDetails?.disableInteraction;
          if (disableInteraction === true) {
            message.body.additionalDetails = {
            ...(message.body.additionalDetails || {}),
            disableButtonType: true,
          }
        }
      }

      if(type === 'form_data') {
        const fg = this.formGroupsMap[message.id];
        const disableInteraction = message.body?.additionalDetails?.disableInteraction;
        if(disableInteraction) {
          fg.disable({ emitEvent: false });
          message.body.disableFormMessageInteraction = true
        }
      }
    });
  }

  applyInteractionState(userReply: any) {
    const originalMessageId = userReply.header?.originalMessageId;
    if (!originalMessageId) return;

    // ✅ First try O(1) lookup in the map
    let originalMessage = this.messageMap.get(originalMessageId);

    // Fallback if not found (refresh case or missed sync)
    if (!originalMessage) {
      originalMessage = this.cimMessage.find(
        (m: any) => m.id === originalMessageId
      );
      if (originalMessage) {
        this.messageMap.set(originalMessageId, originalMessage);
      }
    }

    if (!originalMessage) return;
    const type = originalMessage.body?.type?.toLowerCase();
    if (!type) return;

    // 🔹 Buttons
    if (type === 'button') {
      originalMessage.body.buttons?.forEach((btn: any) => {
        btn.isSelected =
          (btn.payload === userReply.body.markdownText ||
          btn.title === userReply.body.markdownText);
      });
    }

    // 🔹 Carousel
    if (type === 'carousel') {
      originalMessage.body.elements?.forEach((el: any) => {
        el.buttons?.forEach((btn: any) => {
          btn.isSelected =
            (btn.payload === userReply.body.markdownText ||
            btn.title === userReply.body.markdownText) &&
            btn.type === userReply.body.quotedButtons?.find(
              (qb: any) =>
                qb.payload === userReply.body.markdownText ||
                qb.title === userReply.body.markdownText
            )?.type &&
            el.additionalCarouselElementDetails?.title === userReply.body.quotedCardTitle;
        });
      });
    }

    // 🔹 Form
    if (type === 'form_data') {

      const status = userReply.body.additionalDetails?.status?.toLowerCase();
      // mapping between status and button actions
      const statusToActionMap: Record<string, string> = {
        cancelled: 'cancel',
        filled: 'submit'
      };

      originalMessage.body.additionalDetails?.actionButtons?.forEach((button: any) => {
        const expectedAction = statusToActionMap[status];
        button.isSelected = button.action?.toLowerCase() === expectedAction;
      });
    }

  }




  editMessage(cimMessage: any) {
    const messageId = cimMessage.header.originalMessageId;

    // Find the message by messageId
    const existingMessageIndex = this.cimMessage.findIndex(
      (msg) => msg.id === messageId,
    );

    if (existingMessageIndex !== -1) {
      const newContent = cimMessage.body.markdownText;
      this.cimMessage[existingMessageIndex].body.markdownText = newContent;
      this.cimMessage[existingMessageIndex].isEdited = true;
    }
  }

  composerDisable() {
    console.log('message element is ', this.messageElement);
    const messageRef: any = this.messageElement?.nativeElement;
    if (messageRef) {
      this.renderer.setAttribute(messageRef, 'disabled', 'true');
      this.renderer.setAttribute(
        messageRef,
        'placeholder',
        'Unable to send message',
      );
      this.renderer.setProperty(messageRef, 'value', '');
      this.isComposerDisable = true;
    }
  }

    // this.renderer.setAttribute(messageRef, 'class', 'composer-disable')

  composerEnable() {
    console.log('message element is ', this.messageElement);
    const messageRef: any = this.messageElement?.nativeElement;
    if (messageRef) {
      this.renderer.removeAttribute(messageRef, 'disabled');
      this.renderer.setAttribute(
        messageRef,
        'placeholder',
        this.translate.instant('composer-placeholder')
      );
      this.isComposerDisable = false;
    }
  }

  handleResumedMessages(cimMessages: any[]) {
    this.cimMessage = [];
    this.clearMessageData();
    cimMessages.forEach((cimMessage) => {

      if (cimMessage.body.type?.toLowerCase() === 'form_data') {
        this.handleRefreshCasesofFormMessageType(cimMessage);
      }

      if (
        cimMessage.body.type.toLowerCase() == 'plain' &&
        cimMessage.header.sender &&
        (cimMessage.header.sender.type.toLowerCase() == 'agent' ||
          cimMessage.header.sender.type.toLowerCase() == 'bot')
      ) {
        const urlRegex =
          /((https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/[^\s]*)?)/g;

        const urls = cimMessage.body.markdownText.match(urlRegex);
        // Check if any URLs are found
        if (urls) {
          urls.forEach((url: string | string[]) => {
            if (url.includes('type=survey')) {
              cimMessage.body.subType = 'SURVEY';
              cimMessage.body.surveyLink = url;
              cimMessage.body.markdownText = cimMessage.body.markdownText
                .replace(urlRegex, '')
                .trim();
            }
          });
        }

        if (cimMessage.header.sender.type.toLowerCase() == 'agent') {
          let fullName = this.getAgentDisplayName(
            cimMessage.header.sender.additionalDetail,
          );
          if (!this.isUsernameEnabled) {
            cimMessage.header.sender.senderName = fullName;
          }
        }
        if (
          cimMessage.header.intent &&
          cimMessage.header.intent.toLowerCase() === 'update'
        ) {
          this.editMessage(cimMessage);
        }
        else {

        this.cimMessage.push(cimMessage);
        this.disableOldInteractiveMessages(this.cimMessage);
        this.isChatActive = true;
        this.processSeenMessages();
        this.scrollToBottom();
        }
      } else {

        if (cimMessage.body.type.toLowerCase() == 'notification') {
          if (
            cimMessage.body.notificationData?.data?.agentParticipant?.participant?.keycloakUser
          ) {
            let fullName = this.getAgentDisplayName(
              cimMessage.body.notificationData.data.agentParticipant.participant
                .keycloakUser,
            );
          if (!this.isUsernameEnabled) {
            cimMessage.body.notificationData.data.agentParticipant.participant.keycloakUser.username =
              fullName;
          }
        }

        if (
          cimMessage.body?.notificationData?.data?.conversationParticipant?.participant?.keycloakUser
        ) {
          let fullName = this.getAgentDisplayName(
            cimMessage.body.notificationData.data.conversationParticipant.participant.keycloakUser,
          );
          if (!this.isUsernameEnabled) {
            cimMessage.body.notificationData.data.conversationParticipant.participant.keycloakUser.username =
              fullName;
          }
        }
      }

        if (
          cimMessage.body.type.toLowerCase() != 'notification' &&
          cimMessage.header.sender.type.toLowerCase() == 'agent'
        ) {
          clearTimeout(this.typingIndicatorTimer);
          this.typingIndicatorTimer = null;
          let fullName = this.getAgentDisplayName(
            cimMessage.header.sender.additionalDetail,
          );
          if (!this.isUsernameEnabled) {
            cimMessage.header.sender.senderName = fullName;
         }
        }

        if (
          cimMessage.header.intent &&
          cimMessage.header.intent.toLowerCase() === 'update'
        ) {
          this.editMessage(cimMessage);
        }

        if(cimMessage.header.additionalData?.carousalCardId) {

          this.handleCarousalQuotedMessage(cimMessage);
        }

        if(cimMessage.header.originalMessageId && cimMessage.header.intent && !cimMessage.header.additionalData?.carousalCardId) {
          this.handleClickableList(cimMessage)
        }


        this.cimMessage.push(cimMessage);
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
      } catch (err) {}
    }, 350);
  }

  clearMessageData() {
    if (this.elementView?.nativeElement) {
      this.elementView.nativeElement.value = '';
    }
    this.composer_input_disabled = false;
    this.text = '';
    this.scrollToBottom();
    this.scrollCon = 45;
    this.fileName = '';
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
    carousalCardId?: null | string,
    formMessageTypeData?: any,
    status?: 'filled' | 'cancelled',
    additionalButtonDetails?: any,
  ) {
    let header = {
      originalMessageId: null as null | string,
      intent: null as null | string,
      entities: this.getAdditionalValue('INPUT_PARAMS'),
      additionalData: {} as any,
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
      sections?:any;
    } = {
      markdownText: '',
      type: '',
    };
    const messageTypesFormediaURLs = [
      'application',
      'text',
      'image',
      'video',
      'audio',
    ];
    const messageType = msgType.toLowerCase();

    if (messageType == 'plain') {
      let transformedIntent = this.transformPayload(intent);
      header.originalMessageId = originalMessageId ? originalMessageId : null;
      header.intent = transformedIntent.intent
        ? transformedIntent.intent
        : null;
      if (transformedIntent.entities) {
        header.entities = transformedIntent.entities;
      }
      
      // Extract and merge additionalButtonDetails parameters into entities
      if (additionalButtonDetails && additionalButtonDetails.parameters) {
        try {
          let buttonParameters: any = {};
          
          // Parse the parameters if it's a string
          if (typeof additionalButtonDetails.parameters === 'string') {
            buttonParameters = JSON.parse(additionalButtonDetails.parameters);
          } else if (typeof additionalButtonDetails.parameters === 'object') {
            buttonParameters = additionalButtonDetails.parameters;
          }
          
          // Merge with existing entities
          if (header.entities && typeof header.entities === 'object') {
            header.entities = { ...header.entities, ...buttonParameters };
          } else {
            header.entities = buttonParameters;
          }
          
          console.log('Merged button parameters into entities:', header.entities);
        } catch (error) {
          console.error('Error parsing additionalButtonDetails parameters:', error);
        }
      }
      
      header.additionalData = {
        carousalCardId:
          typeof carousalCardId === 'string' && carousalCardId.trim() !== ''
            ? carousalCardId
            : null,
      };
      body.type = 'PLAIN';
      body.markdownText = text!.trim();
      const msgPayload = {
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
    } else if (messageTypesFormediaURLs.includes(messageType)) {
      const imageUrl =
        this.__appConfig.appConfig.FILE_SERVER_URL +
        '/api/downloadFileStream?filename=' +
        fileName;
      // this.sdk.getFileURLfromServer(imageUrl, (res: any ) => {
      body['attachment'] = this.buildMediaAttachment(
        imageUrl,
        fileSize || 0,
        fileMimeType || '',
        fileType || '',
      );
      if (messageType == 'application' || messageType == 'text') {
        body.type = 'FILE';
        body.markdownText = additionalText || '';
        body['caption'] = ''; // Here is the 'caption' property
        body['additionalDetails'] = { fileName: fileName };
      } else {
        body.type = messageType.toUpperCase();
        body.markdownText = additionalText || '';
        body['caption'] = fileName;
        body['additionalDetails'] = {};
      }
      // });
      const msgPayload = {
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




    } else if(messageType === 'form_data'){
      const formData = formMessageTypeData;
      console.log('Form Data:', formData);
        header.originalMessageId = originalMessageId ? originalMessageId : null;
        header.intent = intent ? intent : null;
        body.type = 'FORM_DATA';
        body.markdownText = '';
        body.sections = formMessageTypeData?.body?.sections || [];
        body.additionalDetails = formMessageTypeData?.body?.additionalDetails || {};
        if (status) {
          body.additionalDetails.status = status;
        }
        body.additionalDetails.status = status;
        const msgPayload = {
          type: msgType,
          header: header,
          body: body,
          customer: this.customerData,
        };


        console.log('Form Data Message Payload:', msgPayload);
        this.sdk.sendChatMessage(msgPayload);
        this.clearMessageData();
    }
    else {
      console.log('Unable to process the file');
      this.snackBar.open('unable to process the file', 'X');
      return;
    }
  }

  buildMediaAttachment(
    mediaUrl: SafeUrl,
    fileSize?: any,
    fileMimeType?: string,
    fileType?: any,
  ): any {
    return {
      mediaUrl: mediaUrl,
      type: fileMimeType,
      size: fileSize,
      extType: fileType,
      mimeType: fileMimeType,
    };
  }

  previewFile(event: any) {
    if (event.target.files && event.target.files[0]) {
      var filesAmount = event.target.files;
    } else if (event.dataTransfer.files.length > 0) {
      filesAmount = event.dataTransfer.files;
    }

    if (filesAmount) {
      this.fileLoading = true;
      this.selectedFile = filesAmount;
      let filesLoaded = 0;
      for (let i = 0; i < filesAmount.length; i++) {
        const file = filesAmount[i];
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
            fileName: file.name,
          });
        };

        filesLoaded++;
        if (filesLoaded === filesAmount.length) {
          this.fileLoading = false;
        }
        reader.readAsDataURL(filesAmount[i]);
      }
    }
  }

  resetFileValidation(event: Event, additionalText: string) {
    const fileElem = event.target as HTMLInputElement;
    const fileControl = this.preChatFormGroup.get(
      additionalText,
    ) as FormControl;
    this.removeUploadFile();
    this.fileName = '';
    fileControl?.setValue('');
    if (fileElem?.required) {
      fileControl?.setValidators([Validators.required]);
    } else {
      fileControl?.clearValidators();
    }
    fileControl.updateValueAndValidity();
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

        // if (fileSize <= 5000000) {
        if (availableExtensions.includes(fileMimeType.toLowerCase())) {
          let fd = new FormData();
          fd.append('file', files[i]);
          fd.append(
            'conversationId',
            `${Math.floor(Math.random() * 90000) + 10000}`,
          );
          console.log('ready to Upload File', fileSize, fileMimeType);

          this.sdk.moveToFileServer(fd, (res: any) => {
            if (res?.isFileInvalid) {
              if (res?.statusCode === 413) {
                this.snackBar.open(
                  `Error while uploading file(s) on Server. Requested Entity Too Large`,
                  'X',
                  {
                    duration: 3000,
                    panelClass: ['error-snackbar'],
                    horizontalPosition: 'right',
                  },
                );
                this.removeUploadFile();
                return;
              } else {
                this.snackBar.open(res?.errorMessage, 'X', {
                  duration: 3000,
                  panelClass: ['error-snackbar'],
                  horizontalPosition: 'right',
                });
                this.removeUploadFile();
                return;
              }
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
          });
        } else {
          this.snackBar.open(files[i].name + ' unsupported type', 'X', {
            panelClass: 'custom-snackbar',
          });
          this.removeUploadFile();
        }
        // } else {
        //   console.log(this.preChatFormGroup.get(additionalText))
        //   console.log(files[i].name + ' File size should be less than 5MB');
        //   this.snackBar.open(
        //     files[i].name + ' File size should be less than 5MB',
        //     'X',
        //     {
        //       panelClass: 'custom-snackbar',
        //     },
        //   );
        //   this.removeUploadFile();
        // }
      }
    }
  }

  removeUploadFile() {
    this.imageUrls = [];
    this.selectedFile = null as any;
  }

  sendButtonMessage(
    data: { title: string; payload: any , additionalButtonDetails?: any},
    originalMessageId: any,
  ) {
    console.log('Button data is ', data);
    if (data.title.trim() !== '') {
      this.constructCimMessage(
        'PLAIN',
        data.title.trim(),
        data.payload,
        originalMessageId,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        data.additionalButtonDetails
      );
    }
  }

  sendCarousalMessage(data: any, originalMessageId : string, carousalCardId? : null | string) {
    if (data.title.trim() !== '') {
      this.constructCimMessage(
        'PLAIN',
        data.title.trim(),
        data.payload,
        originalMessageId,
        null,
        null,
        null,
        null,
        null,
        carousalCardId
      );
    }
  }

  handleCarousalQuotedMessage(cimMessage: any) {

    const originalMessageId = cimMessage.header.originalMessageId;
    const carousalCardId = cimMessage.header.additionalData?.carousalCardId;

    const originalMessage = this.cimMessage.find(msg => msg.id === originalMessageId);

    if (originalMessage) {
      cimMessage.body.quotedText = originalMessage.body?.markdownText || '';
      cimMessage.body.quotedTime = originalMessage.header?.timestamp || '';
      cimMessage.header.quotedType = originalMessage.body?.type;
      cimMessage.senderType = originalMessage.header.sender.type

      const elements = originalMessage.body?.elements || [];
      // Find the carousel element matching the carousalCardId
      const matchedElement = elements.find(
        (element: any) =>
          element.additionalCarouselElementDetails?.id === carousalCardId
      );

      if (matchedElement?.additionalCarouselElementDetails?.disableInteraction === true) {
        originalMessage.body.disableAllButtons = true;
      }

      if (matchedElement) {
        cimMessage.body.quotedText = matchedElement.text
        cimMessage.body.quotedCardTitle = matchedElement.additionalCarouselElementDetails?.title;
        cimMessage.body.quotedCardImage = matchedElement.additionalCarouselElementDetails?.image_url;
        cimMessage.body.quotedAltImage = matchedElement.additionalCarouselElementDetails?.alt
        cimMessage.body.quotedButtons = matchedElement.buttons || [];
      }
    }


    if(cimMessage.header.sender.type.toLowerCase() === "customer" && cimMessage.header.additionalData?.carousalCardId) {

      this.cimMessage.push(cimMessage);
      this.browserNotificationService.notify(cimMessage);
      this.scrollToBottom();
      this.handleMessageReport(cimMessage);
    }
  }

  handleFormMessageType(cimMessage: any) {
    const originalMessageId = cimMessage.header.originalMessageId;

    const originalMessage = this.cimMessage.find(msg => msg.id === originalMessageId);
    if (originalMessage) {

      const fg = this.formGroupsMap[originalMessageId];
      if(fg && originalMessage.body.additionalDetails.disableInteraction === true) {

        fg.disable({ emitEvent: false }); // disables all fields & buttons bound via form controls
        originalMessage.body.disableFormMessageInteraction = true;
      }
    }

    this.cimMessage.push(cimMessage);
    this.browserNotificationService.notify(cimMessage);
    this.scrollToBottom();
    this.handleMessageReport(cimMessage);
}



  handleClickableList(cimMessage: any) {

      const originalMessageId = cimMessage.header.originalMessageId;
      const originalMessage = this.cimMessage.find(msg => msg.id === originalMessageId);

        if(originalMessage && originalMessage.body.additionalDetails.interactive.type.toLowerCase() === "clickablelist") {
          originalMessage.body.disableClickaAbleList = true;
        }

       if(cimMessage.header.sender.type.toLowerCase() === "customer") {
        this.cimMessage.push(cimMessage);
        this.browserNotificationService.notify(cimMessage);
        this.scrollToBottom();
        this.handleMessageReport(cimMessage);
       }
  }


  endChat(): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent);
    dialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        if (this.IsRegisteredInFreeSwitch) {
          this.callPopUpView = false;
          this.endCountdown();
          this.sdk.handleCallEnd(this.dialogId);
          this.sdk.handleLogOutAgent(this.dialogId);
          this.IsRegisteredInFreeSwitch = false;
        }
        this.clearSession();
        this.__postMessageHandlerService.sendPostMessage({
          type: "EF_WIDGET_STATE_CHANGED",
          state: "CHAT_SESSION_ENDED",
          reason: "MANUAL_CLOSURE"
        });
      }
    });
  }

  customerChatResumed() {
    let userData: string | null = this.storageService.getItem(
      'user',
      this.storageType,
      false,
    );

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
    // } else {
    //     this.changeScreen('widget');
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

  // chatTranscript(): void {
  //   const requestData = {
  //     ccmUrl:             this.__appConfig.appConfig.CCM_URL,
  //     customerIdentifier: this.customerIdentifier,
  //     serviceIdentifier:  this.serviceIdentifier,
  //     conversationId:     localStorage.getItem('conversationId'),
  //     browserLang:        this.browserLang,
  //   };

  //   localStorage.setItem('ef_transcript_req', JSON.stringify(requestData));

  //   const absoluteUrl = `${window.location.origin}/#/chat-transcript`;
  //   console.log('Opening transcript URL:', absoluteUrl);
  //   window.open(absoluteUrl, '_blank', 'noopener');
  //   localStorage.removeItem('conversationId');
  // }

  chatTranscript(): void {
    const conversationId = this.storageService.getItem(
      'conversationId',
      this.storageType,
    );
    const browserLang = this.browserLang;

    // Build the query string
    //state=download&browserLang=en&conversationId=
    const params = new URLSearchParams({
      state: 'download',
      browserLang: browserLang || '',
      conversationId: conversationId || '',
    });

    const absoluteUrl = `${window.location.origin}/customer-widget/#/chat-transcript?${params.toString()}`;
    window.open(absoluteUrl, '_blank', 'noopener');
  }

  loadBrowserLanguage() {
    this.browserLang = navigator.language;
    console.log('Browser language is :' + this.browserLang);
    this.selectedLanguage = this.browserLang;

    if (this.selectedLanguage == 'ar') {
      this.textDirection = 'right-direction';
      this.translate.use(this.selectedLanguage);
      console.log(this.selectedLanguage, 'this.selectedLanguage');
    } else {
      this.selectedLanguage = this.defaultWidgetLanguage;
      this.translate.use(this.selectedLanguage);
    }

    console.log('Final selected language is :' + this.translate.currentLang);
  }
  

  logInToFreeSwitch() {
    if (!this.IsRegisteredInFreeSwitch && this.webRTCConfig.sipExtension) {
      let selectedSipExtension = this.webRTCConfig.sipExtension;
      this.webRTCConfig.sipExtension = selectedSipExtension.toString();
    }
    if (!this.IsRegisteredInFreeSwitch && this.enableWebRtc)
      this.sdk.loginSipWebRtc(this.webRTCConfig);
  }
  // Audio Functions
  async toggleCallMic(tooltip: any) {
    this.updateTooltip(tooltip);
    const action = !this.isCallMute ? 'mute_call' : 'unmute_call';
    this.sdk.handleCallMic(action, this.dialogId);
    // Short delay to ensure proper state transition

    await new Promise((resolve) => setTimeout(resolve, 100));

    // Update the control state that affects the tooltip text
    this.isCallMute = !this.isCallMute;
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

  async toggleCallVideo(tooltip: any) {
    if (tooltip) this.updateTooltip(tooltip);
    const cameraStatus = !this.isVideoHide ? 'off' : 'on';
    this.sdk.convertCall(cameraStatus, 'video', this.dialogId);
    // Short delay to ensure proper state transition
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Update the control state that affects the tooltip text
    this.isVideoHide = !this.isVideoHide;
  }

  async updateTooltip(tooltip: any) {
    if (tooltip) {
      // Hide the tooltip first
      tooltip.hide();

      // Small delay before showing the new tooltip
      await new Promise((resolve) => setTimeout(resolve, 150));

      tooltip.show();
    }
  }

  async toggleCallHold(tooltip: any) {
    // Call updateTooltip with the new desired state
    this.updateTooltip(tooltip);

    // Handle the call action
    const action = !this.isCallOnHold ? 'holdCall' : 'retrieveCall';
    this.sdk.handleCallHoldState(action, this.dialogId);
    // Short delay to ensure proper state transition
    await new Promise((resolve) => setTimeout(resolve, 100));
    // Update the control state that affects the tooltip text
    this.isCallOnHold = !this.isCallOnHold;
  }

  initiateWebRtcCall(callType: any) {
    if (callType === 'video' || callType === 'audio') {
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
    if (this.isSecureWebCall && !this.errorDuringWebRTCCall) {
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
      if (this.preChatFormData && typeof this.preChatFormData === 'object') {
        if (this.preChatFormData?.sections?.length > 0) {
          this.webRTCConfig.customerName = '';
          this.webRTCConfig.customerNumber = '';
          let sections: Array<any> = this.preChatFormData?.sections;
          sections.forEach((item) => {
            if (item?.name) this.webRTCConfig.customerName = item.name;
            if (item?.phone) this.webRTCConfig.customerNumber = item.phone;
          });
        }
      } else this.handleRefreshCaseForWebRTC();

      this.sdk.handleCallStart({
        type: callType,
        authConfigs: this.webRTCConfig,
      });

      if (callType === 'video' && !this.isSecureWebCall) {
        this.isVideoCallActive = true;
      } else if (callType === 'screenshare') {
        this.isScreenShareActive = true;
      } else {
        this.isAudioCallActive = true;
      }
    }
  }

  handleScreenShareClick() {
    // Do not proceed if secure web call or audio call is active
    if (this.isSecureWebCall || this.isAudioCallActive) {
      return;
    }

    // Proceed with the action
    // if (this.activeScreenShareView || this.activeVideoView) {
    //   this.convertCallView('screenshare');
    // } else {
    //   this.changeView('screenshare');
    // }
  }

  handleVideoIconClick(tooltip: MatTooltip) {
    // Do not proceed if audio call is active
    if (this.isAudioCallActive) {
      return;
    }

    if (this.isVideoCallActive) {
      this.toggleCallVideo(tooltip);
    } else {
      this.convertCallRequest('video');
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
        const seconds = (
          '0' + Math.floor((distance % (1000 * 60)) / 1000)
        ).slice(-2);
        this.callTime = `${minutes}:${seconds}`;
      }, 1000);
    }
  }

  endCountdown(): void {
    this.callTime = '00:00';
    clearInterval(this.counterVar);
    this.counterVar = null;
  }

  handleDialogStates(data: any): void {
    this.IsRegisteredInFreeSwitch = false;
    console.log('[handleDialogStates] received dialog: ===> ', data);

    if (data.reasonCode === 'NO_ANSWER') {
      this.snackBar.open('Call is not picked up', 'X', {
        duration: 2000, // 5 seconds
        panelClass: ['error-snackbar'],
        horizontalPosition: 'right',
        verticalPosition: 'top',
      });
    }

    // if (data.event === "MEDIA_SERVER_CALL_END" && data.reasonCode === "NORMAL_CLEARING") {
    //   const reasonCode = data.reasonCode ? data.reasonCode : "Unknown Error"
    //   // this.snackBar.open(reasonCode, 'Dismiss', {
    //   //   duration: 3000,
    //   //   panelClass: ['error-snackbar'],
    //   //   horizontalPosition: 'right',
    //   // });

    //   console.log("this.IsRegisteredInFreeSwitch",this.IsRegisteredInFreeSwitch)
    //   this.clearSession();
    // }
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
      if (
        this.__appConfig.appConfig.IS_DIRECT_WEBRTC_CALL_ENABLED &&
        this.__appConfig.appConfig.VIDEO
      ) {
        this.remoteStreamStatus = false;
      }

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
              this.changeView('chat');
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
            if (
              this.__appConfig.appConfig.IS_DIRECT_WEBRTC_CALL_ENABLED &&
              this.__appConfig.appConfig.VIDEO
            ) {
              this.remoteStreamStatus = false;
            }

            if (this.standaloneWebRtc) {
              this.callPopUpView = false;
              this.isWebRtcVideoCallActive = false;
              // if(this.IsRegisteredInFreeSwitch) {
              //   this.callEnd();
              // }
              // if(this.isChatActive) {
              //   this.clearSession();
              // }
              this.endCountdown();
              this.changeScreen('end');
            } else {
              this.callPopUpView = false;
              this.isAudioCallActive = false;
              this.isVideoCallActive = false;
              this.isScreenShareActive = false;
              this.endCountdown();
              if (this.IsRegisteredInFreeSwitch) {
                this.callEnd();
              }
              if (
                this.isChatActive &&
                data.response.dialog.callEndReason !== 'NO_ANSWER'
              ) {
                this.clearSession();
              } else {
                this.changeView('chat');
              }
            }
            break;
        }
      }
    }

    if (data.event === 'mediaStreamUpdate') {
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
          setTimeout(() => {
            this.remoteStreamStatus = true;
          }, 2000);
        } else if (
          data.dialog.eventRequest === 'remote' &&
          data.dialog.streamStatus === 'on'
        ) {
          console.log('Remote Camera On');
          this.remoteStreamStatus = false;
        }
      }
    }

    if (data.event === 'mediaPermissionStatus') {
      console.log(
        '[mediaBrowserPermissionStatus] ACTIVE CALL mediaBrowserPermissionStatus: ===> ',
        data.dialog,
      );
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
          switch (data.response.description) {
            case 'Service Unavailable':
              errorMessage = `The service is currently unavailable. Please check your network connection and try again.`;
              break;
            case 'Forbidden':
              errorMessage = `Authentication failed. Please verify your SIP credentials and try again.`;
              break;
            case 'Session.getOffer unknown error.':
              errorMessage = `Please check Audio / Video permissions in your browser.`;
              break;
          }
          console.log('[Error] Call terminated:', errorMessage);
          break;
        case 'subscriptionFailed':
          errorMessage = `Certificate Issues: Please contact with your administrator`;
          console.log('[Error] Call terminated:', errorMessage);
          break;
        case 'invalidState':
          errorMessage = `Invalid State: Session not found`;
          console.log('[Error] Call terminated:', errorMessage);
          break;
        default:
          console.log(`[Error] Unknown:', ${data.response.description}`);
          errorMessage = 'An unknown error occurred.';
      }

      if (errorMessage) {
        this.showAuthenticationResponseMessage = errorMessage;
        this.activeVideoView = false;

        if (this.standaloneWebRtc) {
          this.showInvalidCodeError = true;
          this.callPopUpView = false;
          this.activeVideoView = false;
          this.isWebRtcVideoCallActive = false;
          this.snackBar.open(
            this.showAuthenticationResponseMessage,
            'Dismiss',
            {
              duration: 3000,
              panelClass: ['error-snackbar'],
              horizontalPosition: 'right',
            },
          );
        } else {
          this.snackBar.open(
            this.showAuthenticationResponseMessage,
            'Dismiss',
            {
              duration: 3000,
              panelClass: ['error-snackbar'],
              horizontalPosition: 'right',
            },
          );
          this.isAudioCallActive = false;
          this.isSecureWebCall = false;
          this.isVideoCallActive = false;
          this.activeVideoView = false;
          this.errorDuringWebRTCCall = true;
          this.changeView('chat');
        }
      }
    }
  }

  callEnd() {
    if (!this.dialogId) {
      console.warn('Call cannot be ended because dialogId is missing.');
      return;
    }

    this.callPopUpView = false;
    this.isSecureWebCall = false;
    this.endCountdown();
    this.sdk.handleCallEnd(this.dialogId);
    this.sdk.handleLogOutAgent(this.dialogId);
    this.changeView('chat');
  }

  changeFont() {
    console.log('font dropdown clicked');
    this.fontDropDown = !this.fontDropDown; // Toggle the fontDropDown variable
  }

  setFontSize(e: any) {
    console.log('Set fontsize', e);
    try {
      this.storageService.setItem('fontSize', e, this.storageType);
      this.changeFont();
      this.setFontFromLocalStorage();
    } catch (error) {}
  }

  private setFontFromLocalStorage() {
    try {
      if (this.storageService.getItem('fontSize', this.storageType) !== null) {
        this.fontSize.setValue(
          this.storageService.getItem('fontSize', this.storageType),
        );
      }
    } catch (error) {}
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
    this.storageService.removeItem('user', this.storageType);
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

  async authenticateSecureLinkKey(isAuthenticated: boolean): Promise<void> {
    this.dialogId = undefined;
    const roomId = this.webRtcSecureLink;
    this.setAuthorizedResponse = undefined;

    this.sdk.authenticateKey({ roomId }, async (res: any) => {
      if (res.error) {
        this.isSecureLinkExpired = true;
        this.showAuthenticationResponseMessage = res.data.message
          ? 'The link has expired'
          : res.message;
        this.showInvalidCodeError = true;
        return;
      }

      this.agentName = res.data.agentName;
      res.data.diallingUri = this.webRTCConfig.diallingUri;
      this.showAuthenticationResponseMessage = res.message;
      this.showInvalidCodeError = false;
      this.setAuthorizedResponse = res.data; // Now includes diallingUri

      try {
        if (this.webRTCConfig && !this.IsRegisteredInFreeSwitch) {
          await this.logInToFreeSwitch();
        }
      } catch (error) {
        console.error('Error logging into FreeSwitch:', error);
        return;
      }
      if (isAuthenticated) {
        this.changeView('secureWebVideoCall');
        return;
      }

      if (!this.setAuthorizedResponse) {
        return;
      }

      this.standaloneWebRtc = true;
    });
  }

  processSecureLinkMessage(message: any) {
    this.isSecureWebCall = false;
    const mediaUrl = message.body.mediaUrl;
    const queryString = mediaUrl.split('?')[1];
    const urlParams = new URLSearchParams(queryString);
    const encryptedKey = urlParams.get('encryptedKey');
    const preservedKey = decodeURIComponent(encryptedKey ?? '');
    this.webRtcSecureLink = preservedKey;

    // Just for Debugging to open url in new window.
    // const hashIndex = mediaUrl.indexOf('#');
    // const hashPart = hashIndex !== -1 ? mediaUrl.substring(hashIndex) : '';
    // const baseUrl = "http://localhost:4000";
    // const fullUrl = `${baseUrl}${hashPart}`;

    // console.log("fullUrl", fullUrl);
    // window.open(fullUrl, '_blank');

    const widgetIdentifier = urlParams.get('widgetIdentifier');
    if (widgetIdentifier === this.widgetIdentifier) {
      this.authenticateSecureLinkKey(true);
    } else {
      console.warn(
        '[Warning] Widget Identifiers do not match or there was an error during WebRTC call.',
      );

      this.snackBar.open(
        this.showAuthenticationResponseMessage || 'Authentication failed!',
        'Dismiss',
        {
          duration: 3000,
          panelClass: ['error-snackbar'],
          horizontalPosition: 'right',
        },
      );
    }
    return;
  }

  // pickSipExtension(sipExtensions: any) {
  //   const [startExt, endExt] = sipExtensions.split('-');
  //   const minExt = parseInt(startExt, 10);
  //   const maxExt = parseInt(endExt, 10);
  //   return Math.floor(Math.random() * (maxExt - minExt)) + minExt;
  // }
  getLabel(valueType: string): string {
    const label = this.dictionary[valueType] || valueType;
    return label.charAt(0).toUpperCase() + label.slice(1);
  }

  isMaxLengthError(
    sectionIndex: number,
    controlName: string,
    valueType: string,
  ): boolean {
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

  selected5starOption(
    controlName: string,
    sectionIndex: number,
    attributeIndex: number,
    itemIndex: number,
    type: string,
    value: string,
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
      console.error(
        `Control "${controlName}" not found in section ${sectionIndex}.`,
      );
      return;
    }

    // Update the star rating UI
    const svgElements = document.querySelectorAll(
      `.option-${sectionIndex}-${attributeIndex}-${type}`,
    );

    if (type === 'star') {
      svgElements.forEach((svg, index) => {
        const paths = svg.getElementsByTagName('path');
        const fillColor = index <= itemIndex ? '#FFB100' : '#E6E6E6';
        for (let i = 0; i < paths.length; i++) {
          paths[i].setAttribute('fill', fillColor);
        }
      });
    } else {
      svgElements.forEach((svg: any, index: number) => {
        const paths = svg.getElementsByTagName('path');

        if (!svg?.dataset.originalColors) {
          // Store original colors if not already stored
          const originalColors = [];
          for (let i = 0; i < paths.length; i++) {
            originalColors.push(paths[i].getAttribute('fill'));
          }
          svg.dataset.originalColors = JSON.stringify(originalColors);
        }

        if (index === itemIndex) {
          // Restore the original colors for the clicked SVG
          const originalColors = JSON.parse(svg.dataset.originalColors);
          for (let i = 0; i < paths.length; i++) {
            paths[i].setAttribute('fill', originalColors[i]);
          }
        } else {
          const fillColor = 'gray'; // Change to gray for SVGs that are not clicked
          for (let i = 0; i < paths.length; i++) {
            paths[i].setAttribute('fill', fillColor);
          }
        }
      });
    }

    control.setValue(value);
    console.log(
      `Updated control "${controlName}" in section ${sectionIndex} with value: ${value}`,
    );
  }

  selectedIndices: { [key: number]: number } = {};

  changeNpsColor(
    controlName: any,
    sectionIndex: number,
    attributeIndex: number,
    currentIndex: number,
    value: string,
  ): void {
    const sections = this.preChatFormGroup.get('sections') as FormArray;

    if (!sections || !sections.at(sectionIndex)) {
      console.error(`Section at index ${sectionIndex} does not exist.`);
      return;
    }

    const control = sections.at(sectionIndex).get(controlName);

    if (!control) {
      console.error(
        `Control "${controlName}" not found in section ${sectionIndex}.`,
      );
      return;
    }

    // Create a new object reference to trigger change detection
    this.selectedIndices = {
      ...this.selectedIndices,
      [attributeIndex]: currentIndex,
    };

    control.setValue(value);
    console.log(
      `Updated control "${controlName}" in section ${sectionIndex} with value: ${value}`,
    );
  }

  changeScaleStyle(
    controlName: string,
    sectionIndex: number,
    attributeIndex: number,
    itemIndex: number,
    type: string,
    value: string,
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
      console.error(
        `Control "${controlName}" not found in section ${sectionIndex}.`,
      );
      return;
    }

    // Update the scale UI (NPS style)
    const svgElements = document.querySelectorAll(
      `.npsOption-${sectionIndex}-${attributeIndex}-${type}`,
    );

    svgElements.forEach((svg, index) => {
      const paths = svg.getElementsByTagName('path');
      const fillColor = index === itemIndex ? '#E57032' : 'gray';
      for (let i = 0; i < paths.length; i++) {
        paths[i].setAttribute('fill', fillColor);
      }
    });
    control.setValue(value);
    console.log(
      `Updated control "${controlName}" in section ${sectionIndex} with value: ${value}`,
    );
  }

  ChangeBarColor(
    controlName: any,
    sectionIndex: number,
    attributeIndex: number,
    buttonIndex: number,
    attributeKey: string,
    value: string,
  ) {
    const sections = this.preChatFormGroup.get('sections') as FormArray;

    // Validate section existence
    if (!sections || !sections.at(sectionIndex)) {
      console.error(`Section at index ${sectionIndex} does not exist.`);
      return;
    }

    // Get the form control from the specific section
    const control = sections.at(sectionIndex).get(controlName);

    if (!control) {
      console.error(
        `Control "${controlName}" not found in section ${sectionIndex}.`,
      );
      return;
    }

    const iconElements = document.querySelectorAll(`#arrow-${attributeIndex}`);

    // Selecting all radio input elements for the given attributeKey
    const radioInputs = document.querySelectorAll(
      `input[name="${attributeKey}"]`,
    );

    // Loop through all icon elements
    iconElements.forEach((iconElement: any) => {
      // Check if the data-bar-index matches the buttonIndex
      if (
        parseInt(iconElement.getAttribute('data-bar-index')) === buttonIndex
      ) {
        // Show the matching icon element
        iconElement.classList.remove('bar-icon-hide');
        iconElement.classList.add('bar-icon-show');
      } else {
        // Hide all other icon elements
        iconElement.classList.remove('bar-icon-show');
        iconElement.classList.add('bar-icon-hide');
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
  }

  onCheckboxChange(
      event: Event,
      controlName: string,
      sectionIndex: number,
      optionValue: string | null,
      categoryLabel: string,
      hasCategory: boolean,
      messageId? : string
    ): void {
    if (!optionValue) return;

    const formGroup =this.formGroupsMap?.[messageId] || this.preChatFormGroup;
    const checkbox = event.target as HTMLInputElement;
    const isChecked = checkbox.checked;

    const controlPath = `sections.${sectionIndex}.${controlName}`;
    const control = formGroup.get(controlPath);

    if (!control) {
      return;
    }

    control.markAsTouched();

    let selectedValues: any;

    if (hasCategory) {
      selectedValues = typeof control.value === 'object' && !Array.isArray(control.value)
        ? { ...control.value }
        : {};

      if (isChecked) {
        if (!Array.isArray(selectedValues[categoryLabel])) {
          selectedValues[categoryLabel] = [];
        }
        if (!selectedValues[categoryLabel].includes(optionValue)) {
          selectedValues[categoryLabel].push(optionValue);
        }
      } else {
        selectedValues[categoryLabel] = (selectedValues[categoryLabel] || []).filter(
          (v: string) => v !== optionValue
        );
        if (selectedValues[categoryLabel].length === 0) {
          delete selectedValues[categoryLabel];
        }
      }

      const isEmpty = Object.keys(selectedValues).length === 0;
      control.setValue(isEmpty ? '' : selectedValues, { emitEvent: true });

    } else {
      selectedValues = Array.isArray(control.value) ? [...control.value] : [];

      if (isChecked) {
        if (!selectedValues.includes(optionValue)) {
          selectedValues.push(optionValue);
        }
      } else {
        selectedValues = selectedValues.filter((v: string) => v !== optionValue);
      }

      control.setValue(selectedValues.length === 0 ? '' : selectedValues, { emitEvent: true });
    }

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
    categoryLabel: string,
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

  booleanEmojiSet(
    sectionIndex: number,
    attributeIndex: number,
    itemIndex: number,
  ) {
    console.log('boooean emoji set', itemIndex);
    // Select all SVG elements within the booleanOption container
    const svgElements = document.querySelectorAll(
      `#booleanOption-${sectionIndex}-${attributeIndex} svg`,
    );

    console.log('svgElements', svgElements);
    // Iterate through all SVG elements
    svgElements.forEach((svg: any, index) => {
      const paths = svg.getElementsByTagName('path');

      if (!svg.dataset.originalColors) {
        // Store original colors in data attribute if not already stored
        const originalColors = [];
        for (let i = 0; i < paths.length; i++) {
          originalColors.push(paths[i].getAttribute('fill'));
        }
        svg.dataset.originalColors = JSON.stringify(originalColors);
      }

      if (index === itemIndex) {
        // Restore the original colors for the clicked SVG
        const originalColors = JSON.parse(svg.dataset.originalColors);
        for (let i = 0; i < paths.length; i++) {
          paths[i].setAttribute('fill', originalColors[i]);
        }
      } else {
        // Change to gray for SVGs that are not clicked
        const fillColor = 'gray';
        for (let i = 0; i < paths.length; i++) {
          paths[i].setAttribute('fill', fillColor);
        }
      }
    });
  }

  handleFileChange(
    input: any,
    sectionIndex: number,
    attributeIndex: number,
    fileSize: any,
    id: any,
    allowed: any,
    attribute: any,
  ) {
    const file = input.files[0];

    if (!file) {
      return;
    }

    console.log('file', file);
    const errorDiv: any = document.getElementById(`${id}-error`);
    const uploadBtn: any = document.getElementById(`upload-btn-${id}`);
    uploadBtn.disabled = true;

    if (file) {
      console.log('file', file);
      const allowedTypesString: any[] = allowed;
      const allowedTypes = allowedTypesString.map((ext) =>
        ext.trim().toLowerCase(),
      );

      const fileExtension = file.name
        .slice(file.name.lastIndexOf('.') + 1)
        .toLowerCase(); // Improved extension extraction
      console.log('allowedTypes', allowedTypes);
      console.log('fileExtension', fileExtension);

      if (allowedTypes.length > 0 && !allowedTypes.includes(fileExtension)) {
        console.log('fileExtension not allowed', fileExtension);
        this.snackBar.open("File extension not allowed'", 'X', {
          panelClass: 'custom-snackbar',
        });

        return;
      }
    }
    const fileName = file.name;
    console.log('fileName', fileName);
    const truncatedName =
      fileName.length > 10
        ? fileName.substring(0, 7) + '...' + fileName.split('.').pop()
        : fileName;

    this.setFileControl(sectionIndex, fileName, attribute.key);
    this.previewFileForm(file, sectionIndex, attributeIndex);
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
    return currentSection.get(controlName)?.value || '';
  }

  disableUploadBtn(buttonId: any) {
    const uploadedBtn = document.querySelector(`#upload-btn-${buttonId}`);
    // uploadedBtn.textContent = 'Uploaded'
    console.log('uploadedBtn', uploadedBtn);
    this.renderer.setAttribute(uploadedBtn, 'disabled', 'true'); // Correct way
  }

  previewFileForm(file: File, sectionIndex: number, attributeIndex: number) {
    if (!file) return;

    const reader = new FileReader();
    const key = `${sectionIndex}-${attributeIndex}`;
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const isTextOrJson =
      !fileExtension || ['txt', 'json'].includes(fileExtension);

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
          this.filePreviewUrl[key] =
            this.sanitizer.bypassSecurityTrustUrl(fileResult);
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

  clearFile(
    sectionIndex: number,
    attributeIndex: number,
    controlName: string,
    id: any,
  ) {
    const key = `${sectionIndex}-${attributeIndex}`;
    const uploadBtn: any = document.getElementById(`upload-btn-${id}`);
    const input: any = document.getElementById(`${id}`);
    uploadBtn.disabled = true;
    uploadBtn.textContent = 'Upload';
    input.value = '';

    delete this.filePreviewUrl[key];
    delete this.fileHistory[key];
    this.setFileControl(sectionIndex, '', controlName);
  }

  getFileType(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    switch (extension) {
      case 'txt':
        return 'text';
      case 'json':
        return 'json';
      case 'pdf':
      case 'doc':
      case 'docx':
        return 'document';
      case 'mp3':
      case 'wav':
        return 'audio';
      case 'mp4':
      case 'webm':
        return 'video';
      case 'png':
      case 'jpg':
      case 'jpeg':
        return 'image';
      default:
        return 'unknown';
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
  isErrorExist(
    sectionIndex: number,
    attributeIndex: number,
    controlName: string,
  ) {
    const sections: any = this.preChatFormGroup.get('sections');
    const control = sections.at(sectionIndex).get(controlName);
    console.log('error control ', control);
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
    const control = this.preChatFormGroup
      .get(['sections', sectionIndex])
      ?.get(controlName);
    console.log('control===>', control);
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
      case 'left':
        return 'left';
      case 'right':
        return 'right';
      default:
        return null;
    }
  }

  isCheckboxChecked(
    sectionIndex: number,
    controlName: string,
    optionValue: string,
    categoryLabel?: string,
    hasCategory?: boolean,
    messageId?: string
   ): boolean {
    const formGroup = this.formGroupsMap?.[messageId] || this.preChatFormGroup;
    const control = formGroup.get(`sections.${sectionIndex}.${controlName}`);

    if (!control) {
      return false;
    }

    const controlValue = control.value;

    if (hasCategory && categoryLabel) {
      // For categorized checkboxes: { categoryName: [values] }
      const categoryValues = controlValue?.[categoryLabel];
      return Array.isArray(categoryValues) && categoryValues.includes(optionValue);
    } else {
      // For simple checkboxes: [value1, value2]
      return Array.isArray(controlValue) && controlValue.includes(optionValue);
    }
  }

  // Common helper function for uploading a file to server
  private uploadToFileServer(
    file: File,
    allowedExtensions: string[],
    onSuccess: (res: any) => void,
    onError: (error: {
      errorMessage: string;
      isFileInvalid: boolean;
      statusCode?: number;
      errorDetails?: any;
    }) => void,
  ): void {
    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
      onError({
        errorMessage: `${file.name} unsupported type`,
        isFileInvalid: true,
      });
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append(
      'conversationId',
      `${Math.floor(Math.random() * 90000) + 10000}`,
    );

    this.sdk.moveToFileServer(formData, (res: any) => {
      if (res?.isFileInvalid) {
        if (res.statusCode === 413) {
          onError({
            errorMessage: 'File too large. Please upload a smaller file.',
            isFileInvalid: true,
            statusCode: res.statusCode,
          });
        } else {
          onError({
            errorMessage: res.errorMessage || 'Failed to upload file.',
            isFileInvalid: true,
            statusCode: res.statusCode,
            errorDetails: res.errorDetails || {},
          });
        }
      } else {
        onSuccess(res);
      }
    });
  }
  uploadFileFromForm(
    event: Event,
    additionalText: string,
    restriction: boolean,
    fileTypes: string[],
  ): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const availableExtensions = restriction
        ? fileTypes.map((ext) => ext.toLowerCase())
        : this.fileExtensons;
      console.log('file uploading');

      const fileControl = this.preChatFormGroup.get(
        additionalText,
      ) as FormControl;

      this.uploadToFileServer(
        file,
        availableExtensions,
        (res) => {
          this.fileName = res.name;
          this.fileUrl = `${this.__appConfig.appConfig.FILE_SERVER_URL}/api/downloadFileStream?filename=${res.name}`;
          fileControl?.setValue(this.fileUrl);
        },
        (error: any) => {
          this.snackBar.open(error.errorMessage, 'X', {
            panelClass: 'custom-snackbar',
          });
          this.resetFileValidation(event, additionalText);
        },
      );

      input.value = '';
    }
  }
  uploadPrechatFile(
    sectionIndex: number,
    controlName: string,
    fileInput: HTMLInputElement,
    id: any,
  ): void {
    if (fileInput.files && fileInput.files.length > 0) {
      const file = fileInput.files[0];
      this.isFileUploading[controlName] = true;

      this.uploadToFileServer(
        file,
        this.fileExtensons,
        (res) => {
          const fileName = `${this.__appConfig.appConfig.FILE_SERVER_URL}/api/downloadFileStream?filename=${res.name}`;
          this.setFileControl(sectionIndex, fileName, controlName);

          this.snackBar.open('File uploaded successfully', 'X', {
            panelClass: 'custom-snackbar',
          });

          this.isFileUploading[controlName] = false;
          this.disableUploadBtn(id);
        },
        (error: any) => {
          console.log(error);
          this.snackBar.open(error.errorMessage, 'X', {
            panelClass: 'custom-snackbar',
          });
          this.isFileUploading[controlName] = false;
        },
      );
    }
  }
  // <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< TENEO >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

  async handleRefreshCasesofFormMessageType(cimMessage: any) {
    if (cimMessage.header.originalMessageId) {
      const formGroup = await this.buildFormMessage(cimMessage);

      const status = cimMessage.body.additionalDetails?.status?.toLowerCase();
      if (status === 'filled') {
        await this.formMessageTypeService.patchFromMessageTypeUponRefresh(formGroup, cimMessage);
      }

      this.handleFormMessageType(cimMessage);
    } else {
      this.createFormMapGroup(cimMessage);
    }
}



   createFormMapGroup(cimMessage: any) {

    // This method is used to create a form group for the form message type against the message id
      const messageId = cimMessage.id;
      const formGroup = this.fb.group({
      sections: this.fb.array([])});

      const sections: any[] = Array.isArray(cimMessage.body?.sections)
      ? cimMessage.body.sections
      : [];

      this.formMessageTypeData = sections
      this.formGroupsMap[messageId] = formGroup;
      this.createFormValidationControls(sections, this.formValidations, 'formMessageType', formGroup);
   }

  private async buildFormMessage(cimMessage: any) {
    const originalMessageId = cimMessage.header?.originalMessageId;
    if (!originalMessageId) {
      console.warn("No originalMessageId found in message header.");
      return;
    }

    const originalMessage = await this.waitForMessageById(originalMessageId);
    if (!originalMessage) {
      console.warn(`Original message with ID ${originalMessageId} not found after retries.`);
      return;
    }

    const formGroup = this.fb.group({
      sections: this.fb.array([])
    });

    const sections = Array.isArray(originalMessage.body?.sections)
      ? originalMessage.body.sections
      : [];

    this.formGroupsMap[originalMessageId] = formGroup;
    this.createFormValidationControls(sections, this.formValidations, 'formMessageType', formGroup);
    return formGroup;
}

  private async waitForMessageById(id: any, timeoutMs = 2000) {
    const normalizeId = (val: any) => String(val ?? '').trim().toLowerCase();
    const targetId = normalizeId(id);

    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const found = this.cimMessage.find(msg => normalizeId(msg.id) === targetId);
      if (found) return found;
      await new Promise(r => setTimeout(r, 100)); // wait a bit before retrying
    }
    return null;
  }


//  carousel function
  currentIndex = 0;

  next(message) {
    if (message?.body?.elements && this.currentIndex < message.body.elements.length - 1) {
      this.currentIndex++;
    }
  }

  prev() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
    }
  }

  selectSlide(index: number) {
    this.currentIndex = index;
  }


async handleActionButtonClick(button: any, message: any): Promise<void> {
  const messageId = message.id;
  const formGroup = this.formGroupsMap[messageId];

  if (!formGroup) return;

   if (button.action === 'reset') {
    const formGroup = this.formGroupsMap[message.id];
    if (formGroup) {
      // Get schema of attributes again
      const sections: any[] = Array.isArray(message.body?.sections) ? message.body.sections : [];

      sections.forEach((section, sectionIndex) => {
        section.attributes.forEach((attribute: any) => {
          const control = (formGroup.get('sections') as FormArray)
            .at(sectionIndex)
            .get(attribute.key);

          if (control) {
            control.setValue(this.formMessageTypeService.getDefaultValue(attribute));
          }
        });
      });
    }
    return;
  }



  if (button.action === 'cancel') {
    const finalPayload = this.createFormDataObject();
    finalPayload.body.sections = []; // No data for cancelled
    finalPayload.header.timestamp = Date.now();
    finalPayload.id = messageId;
    finalPayload.body.formTitle = message.body.formTitle || '';

    this.constructCimMessage(
      'FORM_DATA',
      null,
      null,
      finalPayload.id,
      null,
      null,
      null,
      null,
      null,
      null,
      finalPayload,
      'cancelled',   // status
    );
  }
}


replaceSpacesWithUnderscores(input: string): string {
    return input.replace(/\s+/g, '_');
  }



  handleRefreshCaseForWebRTC() {
    try {
      const storageUserData = this.storageService.getItem(
        'user',
        this.storageType,
        false,
      );
      let parsedStorageUserData;
      if (storageUserData) parsedStorageUserData = JSON.parse(storageUserData);
      if (parsedStorageUserData) {
        let attributes: Array<any> =
          parsedStorageUserData.data.formData.attributes;
        attributes.forEach((item) => {
          if (item.key === 'name') this.webRTCConfig.customerName = item.value;
          if (item.key === 'phone')
            this.webRTCConfig.customerNumber = item.value;
        });
      }
    } catch (error) {
      console.error('Error onhandleRefreshCaseForWebRTC:', error);
    }
  }

  handleReconnectsAttempts(currentAttempt: number) {
    if (!this.isChatActive) {
      this.changeScreen('error');
      return;
    }

    this.reconnectAttemptsConfig.currentAttempt = currentAttempt;

    if (this.reconnectAttemptsConfig.currentAttempt == 0) {
      this.spinner.hide();
    } else {
      this.spinner.show();
    }

    if (
      this.reconnectAttemptsConfig.currentAttempt >=
      this.reconnectAttemptsConfig.maxAttempts
    ) {
      this.spinner.hide();
      this.__postMessageHandlerService.sendPostMessage({
        type: "EF_WIDGET_STATE_CHANGED",
        state: "CHAT_SESSION_ENDED",
        reason: "SOCKET_DISCONNECTED"
      })
      this.changeScreen('error');
    }
  }


  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const link = target.closest('a');
    if (link) {
      const linkUrl = link.href;
      const chatContainer = document.getElementsByClassName('widget-chat-content')[0];
      if (chatContainer && chatContainer.contains(link)) {
        console.log('Link detected:', linkUrl);
        this.__postMessageHandlerService.sendLinkClickedPostMessage(linkUrl);
      }
    }
  }
}
