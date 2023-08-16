import { AfterViewInit, Component, OnInit, ElementRef, ViewChild, Input, ChangeDetectorRef } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { SdkService } from "../services/sdk.service";
import { ConfigService } from "../services/config.service";
import { browserNotificationService } from "../services/browser-notification.service";
import { DeliveryNotificationService } from "../services/delivery-notification.service";
import { Subscription } from 'rxjs';
import { CdkTextareaAutosize } from '@angular/cdk/text-field';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';

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
  private onChatResumedSubject: Subscription = new Subscription;
  @ViewChild("autosize")
  autosize!: CdkTextareaAutosize;
  @ViewChild("myFileInput")
  myInputVariable!: ElementRef;
  @ViewChild("message")
  messageElement!: ElementRef;
  @ViewChild("messageComposer")
  elementView!: ElementRef;
  @ViewChild("scrollMe")
  private scrollContainer!: ElementRef;
  @Input() conversation: any;
  scrollTop = 0;
  public scrollCon: any;
  sendTypingStartedEventTimer: any = null;
  additionalPanel = false;
  isIconWidget = true;
  preChatForm = false;
  chatActive = false;
  chatError = false;
  chatEndScreen = false;

  customerData: any;
  chatPayLoad: any;
  public cimMessage: any[] = [];
  typingIndicatorTimer: any;
  lastSeenMessageId: any = null;
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
  text: string = "";
  composer_input_disabled: boolean = false;

  formData: FormAttribute[] = [];
  isMobile = false;

  imageUrls: { filesPath: SafeUrl, fileType: string, fileExt: string, fileName: string }[] = [];
  fileLoading = false;
  selectedFile!: File;

  constructor(
    private fb: UntypedFormBuilder,
    public sdk: SdkService,
    public __appConfig: ConfigService,
    private el: ElementRef,
    private cdRef: ChangeDetectorRef,
    private sanitizer: DomSanitizer,
    private snackBar: MatSnackBar,
    public dialog: MatDialog,
    private browserNotificationService: browserNotificationService,
    private deliveryNotificationService: DeliveryNotificationService
  ) { }

  ngAfterViewInit(): void {
    this.customerChatResumed();
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

    this.onChatResumedSubject = this.sdk.onChatResumedResponse$.subscribe((data) => {
      if (data.isChatAvailable == true) {
        this.changeScreen('chat');
        this.cimMessage = data.data;
        this.processSeenMessages();
      }
      this.scrollToBottom();
    });

    this.establishConnectionSubject = this.sdk.connectionResponse$.subscribe((response) => {
      console.log('Connection Response:', response);
      if (response) {
        this.eventListener(response);
      }
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

  onFormSubmit(): void {
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
        this.chatEndScreen = false;
        break;
      case 'chat':
        this.additionalPanel = false;
        this.preChatForm = false;
        this.chatActive = true;
        this.isIconWidget = true;
        this.chatError = false;
        this.chatEndScreen = false;
        break;
      case 'form':
        this.preChatForm = true;
        this.additionalPanel = false;
        this.isIconWidget = true;
        this.chatActive = false;
        this.chatError = false;
        this.chatEndScreen = false;
        break;
      case 'end':
        this.preChatForm = false;
        this.chatActive = false;
        this.chatEndScreen = true;
        this.chatError = false;
        this.isIconWidget = true;
        break;
      case 'error':
        this.preChatForm = false;
        this.chatActive = false;
        this.chatEndScreen = false
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
            this.conversationId = event.data.header.conversationId;
            localStorage.setItem('conversationId', event.data.header.conversationId);
            break;
          case 'MESSAGE_RECEIVED':
            console.log('event response:', event.data);
            this.handleCimMessage(event.data);
            console.log('Cim Message Array: ', this.cimMessage);
            break;
          case 'SOCKET_DISCONNECTED':
            console.log('event response:', event.data);
            localStorage.removeItem("user");
            break;
          case 'CONNECT_ERROR':
            console.log('event response:', event.data);
            break;
          case 'CHAT_ENDED':
            this.changeScreen('form');
            console.log('event response:', event.data);
            // localStorage.removeItem("user");
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

  handleCimMessage(cimMessage: any) {
    if (
      cimMessage.body.type.toLowerCase() == "deliverynotification" &&
      cimMessage.header.sender &&
      (cimMessage.header.sender.type.toLowerCase() == "agent" || cimMessage.header.sender.type.toLowerCase() == "bot")
    ) {
      this.updateStatusOfCustomerMessage(cimMessage.body.messageId, cimMessage.body.status.toLowerCase());
    } else if (
      cimMessage.body.type.toLowerCase() == "notification" &&
      cimMessage.body.notificationType.toLowerCase() == "typing_started"
    ) {
      if (cimMessage.header.sender.type.toLowerCase() == "agent") {
        console.log("Event  received with data  ", cimMessage.body);

        //if timer exist restart the timer
        if (!this.typingIndicatorTimer) {
          console.log("timer started for indicator to show ", cimMessage.body);

          this.typingIndicatorTimer = setTimeout(() => {
            console.log("timer ended for indicator to show ", cimMessage.body);
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
        cimMessage.body.type.toLowerCase() != "notification" &&
        cimMessage.header.sender.type.toLowerCase() == "agent"
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
    if (status.toLowerCase() == "read") {
      msgStatus = "seen";
      this.markMessageStatusToSeenOrSuccessed(messageId, msgStatus);
    } else if (status.toLowerCase() == "failed") {
      msgStatus = "failed";
      this.changeMessageStatusToFailed(messageId, msgStatus);
    }
  }

  markMessageStatusToSeenOrSuccessed(msgId: any, msgStatus: string) {
    // find index of the message for the delivery notification
    let index = this.cimMessage.findIndex((message: { id: any; }) => message.id == msgId);
    // mark all the previous messages as 'seen' or 'successed' before that message except failed messages

    this.cimMessage.forEach((message: { header: { sender: { type: string; }; }; }, i: number) => {
      if (i <= index && (message.header.sender.type.toLowerCase() == "customer" || message.header.sender.type.toLowerCase() == "connector")) {
        if (!this.cimMessage[i]["sendStatus"] || (this.cimMessage[i]["sendStatus"] && this.cimMessage[i]["sendStatus"] != "failed")) {
          this.cimMessage[i]["sendStatus"] = msgStatus;
        }
      }
    });
  }

  changeMessageStatusToFailed(msgId: any, msgStatus: string) {
    // find index of the message for the notification
    let index = this.cimMessage.findIndex((message: { id: any; }) => message.id == msgId);

    if (index != -1) {
      if (this.cimMessage[index].header.sender.type.toLowerCase() == "customer") {
        this.cimMessage[index]["sendStatus"] = msgStatus;
      }
    } else {
      if (msgStatus.toLowerCase() == "failed") {
        alert("unable to start chat");
      }
    }
  }

  handleMessageReport(cimMessage: { header: { sender: { type: string; }; }; body: { type: string; }; id: any; }) {
    if (document.hasFocus() && (cimMessage.header.sender.type.toLowerCase() == "agent" || cimMessage.header.sender.type.toLowerCase() == "bot")) {
      if (cimMessage.body.type.toLowerCase() != "notification") {
        this.constructAndPublishMessageSeenNotification(cimMessage.id);
      }
    }
  }

  constructAndPublishMessageSeenNotification(msgId: any) {
    if (this.lastSeenMessageId != msgId) {
      let header = { replyToMessageId: null, intent: null };
      let body = { markdownText: "", type: "DELIVERYNOTIFICATION", messageId: msgId, status: "READ", reasonCode: 200 };

      this.sdk.sendChatMessage({ type: "DELIVERYNOTIFICATION", header: header, body: body, customer: this.customerData });
      this.lastSeenMessageId = msgId;
    }
  }

  processSeenMessages() {
    let latestMessage = this.cimMessage[this.cimMessage.length - 1];
    if (latestMessage) {
      // mark all the message Successed
      this.markMessageStatusToSeenOrSuccessed(latestMessage.id, "successed");

      // mark all the message to seen which are seen by agent or bot
      let latestReadNotificationMessage = this.getLatestDeliveryMessage();
      if (
        latestReadNotificationMessage &&
        latestReadNotificationMessage.body.status.toLowerCase() == "read"
      ) {
        this.markMessageStatusToSeenOrSuccessed(latestReadNotificationMessage.body.messageId, "seen");
      }
    }
    // mark failed status

    this.cimMessage.forEach((message: any) => {
      if (
        message.body.type.toLowerCase() == "deliverynotification" &&
        message.body.status.toLowerCase() == "failed"
      ) {
        this.changeMessageStatusToFailedInHistoryMessages(message.body.messageId);
      }
    });
  }

  getLatestDeliveryMessage() {
    for (let i = (this.cimMessage.length - 1); i >= 0; i--) {
      const message = this.cimMessage[i];
      if (
        message &&
        message.body.type.toLowerCase() == "deliverynotification" &&
        message.header.sender &&
        (message.header.sender.type.toLowerCase() == "agent" || message.header.sender.type.toLowerCase() == "bot")
      ) {
        return message;
      }
    }
  }

  changeMessageStatusToFailedInHistoryMessages( msgId: any) {
    // find index of the message for the notification
    let index = this.cimMessage.findIndex((message: { id: any; }) => message.id == msgId);

    if (index != -1) {
      if (this.cimMessage[index].header.sender.type.toLowerCase() == "customer") {
        this.cimMessage[index]["sendStatus"] = "failed";
      }
    }
  }

  textChanged() {
    this.messageElement.nativeElement.focus();
    const el: any = document.getElementById("messageTextarea");
    this.text = el.value;
    this.scrollCon = this.elementView.nativeElement.scrollHeight;
    this.scrollContainer = this.scrollContainer.nativeElement.scrollHeight;
  }

  onSendMessage() {
    this.cdRef.detectChanges();
    this.scrollToBottom();

    if (this.imageUrls.length > 0) {
      this.fileLoading = true;
      let additionalText = "";
      if (this.text.trim() !== "") {
        additionalText = this.text.trim();
        this.clearMessageData();
      }
      this.uploadFile(this.selectedFile, additionalText);
    } else {

      if (this.text.trim() !== "") {
        console.log('Customer message: ', this.text.trim());

        this.constructCimMessage("PLAIN", this.text.trim(), null, null);
        this.clearMessageData();
      }
    }
  }

  scrollToBottom(): void {
    setTimeout(() => {
      try {
        this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
      } catch (err) { }
    }, 350);
  }

  clearMessageData() {
    this.composer_input_disabled = false;
    this.text = "";
    this.scrollToBottom();
    this.scrollCon = 45;
  }

  constructCimMessage(
    msgType: string,
    text?: string,
    intent: null | string = null,
    replyToMessageId: null | string = null,
    fileMimeType?: string,
    fileName?: string,
    fileSize?: number,
    additionalText?: string,
    fileType?: string
  ) {
    let header = {
      replyToMessageId: null as null | string,
      intent: null as null | string,
      sender: {
        id: "460df46c-adf9-11ed-afa1-0242ac120002",
        type: "CUSTOMER",
        senderName: "JANE DOE",
        additionalDetail: null,
      },
    };
    let body: { markdownText: string; type: string; caption?: string; additionalDetails?: any; attachment?: any } = {
      markdownText: "",
      type: "",
    };

    if (msgType.toLowerCase() == "plain") {
      header.replyToMessageId = replyToMessageId ? replyToMessageId : null;
      header.intent = intent !== null ? intent : null;
      body.type = "PLAIN";
      body.markdownText = text!.trim();
    } else if (msgType.toLowerCase() == "application" || msgType.toLowerCase() == "text") {
      body.type = "FILE";
      body.markdownText = additionalText || "";
      body["caption"] = ""; // Here is the 'caption' property
      body["additionalDetails"] = { fileName: fileName };
      body["attachment"] = {
        mediaUrl: `${this.__appConfig.appConfig.FILE_SERVER_URL}/api/downloadFileStream?filename=${fileName}`,
        type: fileMimeType || "",
        size: fileSize || 0,
        extType: fileType || "",
        mimeType: fileMimeType || "",
      };
    } else if (msgType.toLowerCase() == "image") {
      body.type = "IMAGE";
      body.markdownText = additionalText || "";
      body["caption"] = fileName;
      body["additionalDetails"] = {};
      body["attachment"] = {
        mediaUrl: `${this.__appConfig.appConfig.FILE_SERVER_URL}/api/downloadFileStream?filename=${fileName}`,
        type: fileMimeType,
        size: fileSize,
        thumbnail: ""
      };
    } else if (msgType.toLowerCase() == "video") {
      body.type = "VIDEO";
      body.markdownText = additionalText || "";
      body["caption"] = fileName;
      body["additionalDetails"] = {};
      body["attachment"] = {
        mediaUrl: `${this.__appConfig.appConfig.FILE_SERVER_URL}/api/downloadFileStream?filename=${fileName}`,
        type: fileMimeType,
        size: fileSize,
        thumbnail: ""
      };
    } else if (msgType.toLowerCase() == "audio") {
      body.type = "AUDIO";
      body.markdownText = additionalText || "";
      body["caption"] = fileName;
      body["additionalDetails"] = {};
      body["attachment"] = {
        mediaUrl: `${this.__appConfig.appConfig.FILE_SERVER_URL}/api/downloadFileStream?filename=${fileName}`,
        type: fileMimeType,
        size: fileSize,
        thumbnail: ""
      };
    } else {
      console.log('Unable to process the file');
      this.snackBar.open("unable to process the file", "err");
      return;
    }

    let msgPayload = {
      type: msgType,
      header: header,
      body: body,
      customer: this.chatPayLoad.data,
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
          console.log(this.imageUrls, "urlssssssss");
          this.imageUrls.push({
            filesPath: this.sanitizer.bypassSecurityTrustUrl(event.target.result),
            fileType: event.target.result.split(':')[1].split('/')[0],
            fileExt: event.target.result.split(':')[1].split('/')[1].split(';')[0],
            fileName: filesAmount[i].name
          });
        };
        reader.readAsDataURL(filesAmount[i]);
      }
    }
  }

  uploadFile(files: any, additionalText: string) {
    let availableExtensions = ["txt", "png", "jpg", "jpeg", "pdf", "ppt", "pptx", "xlsx", "xls", "doc", "docx", "rtf", "mp3", "mp4", "webp"];
    let ln = files.length;
    if (ln > 0) {
      for (var i = 0; i < ln; i++) {
        const fileSize = files[i].size;
        const fileMimeType = files[i].name.split(".").pop();

        if (fileSize <= 5000000) {
          if (availableExtensions.includes(fileMimeType.toLowerCase())) {
            let fd = new FormData();
            fd.append("file", files[i]);
            fd.append("conversationId", `${Math.floor(Math.random() * 90000) + 10000}`);
            console.log("ready to Upload File", fileSize, fileMimeType);

            this.sdk.moveToFileServer(fd, (res: { type: string; name: string; size: any; }) => {
              this.constructCimMessage(
                res.type.split('/')[0],
                '',
                null,
                null,
                res.type,
                res.name,
                res.size,
                additionalText,
                res.name.split('.').pop()
              );
            });
          } else {
            console.log(files[i].name + " File size should be less than 5MB");
            this.snackBar.open(files[i].name + " unsupported type", "err", {
              panelClass: "custom-snackbar"
            });
            this.removeUploadFile();
          }
        } else {
          console.log(files[i].name + " File size should be less than 5MB");
          this.snackBar.open(files[i].name + " File size should be less than 5MB", "err", {
            panelClass: "custom-snackbar"
          });
          this.removeUploadFile();
        }
      }
    }
  }

  removeUploadFile() {
    this.imageUrls = [];
    this.selectedFile = null as any;
  }

  sendButtonMessage(data: { title: string; payload: any; }, replyToMessageId: any) {
    if (data.title.trim() !== "") {
      this.constructCimMessage("PLAIN", data.title.trim(), data.payload, replyToMessageId);
    }
  }

  endChat(): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent);

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.cimMessage = [];
        this.changeScreen('end');
        this.sdk.handleChatEnd(this.chatPayLoad.data);
        this.clearMessageData()
      }
    });
  }

  customerChatResumed() {
    let userData: string | null = localStorage.getItem('user');

    if (userData !== null) {
      let parsedUserData = JSON.parse(userData);
      this.customerData = parsedUserData.data;
      console.log("Checking data ", parsedUserData.data.channelCustomerIdentifier, parsedUserData.data.serviceIdentifier);
      this.sdk.makeConnection(parsedUserData.data.serviceIdentifier, parsedUserData.data.channelCustomerIdentifier);
    }
  }

}
