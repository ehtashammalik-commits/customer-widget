import { Injectable, OnInit } from '@angular/core';
import { ConfigService } from '../services/config.service';
import { Observable, Subject } from 'rxjs';

declare var widgetConfigs: any,
  getPreChatForm: any,
  formValidation: any,
  establishConnection: any,
  setConversationDataByCustomerIdentifier: any,
  chatRequest: any,
  sendMessage: any,
  uploadToFileEngine: any,
  chatEnd: any,
  resumeChat: any,
  webhookNotifications: any,
  videoControl: any,
  postMessages: any,
  callbackRequest: any,
  authenticateRequest: any,
  getBrowserInfo: any;

type formAttributeMappings = {
  name: string[];
  phone: string[];
  email: string[];
  identifier: string[];
};

@Injectable({
  providedIn: 'root',
})

export class SdkService implements OnInit {
  private sdkLoaded: boolean = false;
  ConfigData: any;
  widgetIdentifier: any;
  serviceIdentifier: any;

  private widgetConfigsSubject: Subject<any> = new Subject<any>();
  public widgetConfigs$: Observable<any> =
    this.widgetConfigsSubject.asObservable();

  private preChatFormSubject: Subject<any> = new Subject<any>();
  public renderPreChatForm$: Observable<any> =
    this.preChatFormSubject.asObservable();

    private preChatFormValidationSubject: Subject<any> = new Subject<any>();
    public validationsSubcription: Observable<any> =
      this.preChatFormValidationSubject.asObservable();
    
  private callbackFormSubject: Subject<any> = new Subject<any>();
  public renderCallbackForm$: Observable<any> =
    this.callbackFormSubject.asObservable();

  private establishConnectionSubject: Subject<any> = new Subject<any>();
  public connectionResponse$: Observable<any> =
    this.establishConnectionSubject.asObservable();

  private onChatResumedSubject: Subject<any> = new Subject<any>();
  public onChatResumedResponse$: Observable<any> =
    this.onChatResumedSubject.asObservable();

  private onWebRtcCallSubject: Subject<any> = new Subject<any>();
  public onWebRtcCallResponse$: Observable<any> = this.onWebRtcCallSubject.asObservable();

  private onCallbackRequestSubject: Subject<any> = new Subject<any>();
  public onCallbackRequestResponse$: Observable<any> = this.onCallbackRequestSubject.asObservable();

  constructor(private _ConfigService: ConfigService) {
    this.ConfigData = this._ConfigService.appConfig;
    this.loadSdk();
  }

  ngOnInit(): void {this.getFormValidation() }

  receiveUrlParamsValue(widgetIdentifier: any, serviceIdentifier: any) {
    this.widgetIdentifier = widgetIdentifier;
    this.serviceIdentifier = serviceIdentifier;
    this.loadWidget(this.ConfigData.CCM_URL, this.widgetIdentifier);
    console.log(
      'Received params in sdk service:',
      this.widgetIdentifier,
      this.serviceIdentifier,
    );
  }

  loadSdk(): Promise<void> {
    return new Promise<void>((resolve) => {
      if (typeof widgetConfigs !== 'undefined') {
        this.sdkLoaded = true;
        resolve();
      } else {
        // SDK script already loaded in main.ts
        resolve();
      }
    });
  }

  loadWidget(ccm_url: any, widget_identifier: any) {
    widgetConfigs(ccm_url, widget_identifier, (res: any) => {
      this.widgetConfigsSubject.next(res);
    });
  }

  renderPreChatForm(form_id: any) {
    getPreChatForm(this.ConfigData.FORM_URL, form_id, (res: any) => {
      this.getFormValidation()
      this.preChatFormSubject.next(res);
    });
  }

  getFormValidation() {
    formValidation(this.ConfigData.FORM_URL, (res: any) => {
      
      this.preChatFormValidationSubject.next(res);
      console.log('=>>')
    })
  }

  renderCallbackForm(form_id: any) {
    getPreChatForm(this.ConfigData.FORM_URL, form_id, (res: any) => {
      this.callbackFormSubject.next(res);
    });
  }

  makeConnection(serviceIdentifier: any, channelCustomerIdentifier: any) {
    if (!this.sdkLoaded) {
      console.error('SDK script is not loaded yet');
      return;
    }

    establishConnection(
      this.ConfigData.SOCKET_URL,
      serviceIdentifier,
      channelCustomerIdentifier,
      (res: any) => {
        this.establishConnectionSubject.next(res);
      },
    );
  }

  setConversationDataAgainstCustomerIdentifier(customerChannelIdentifier: any, preChatFormData: any) {
    setConversationDataByCustomerIdentifier(
      this.ConfigData.CONVERSATIONAL_URL, customerChannelIdentifier, preChatFormData, (res: any) => {
        console.log('Set ConversationData Request', res);
      }
    );
  }

  onChatResumed(serviceIdentifier: any, channelCustomerIdentifier: any) {
    console.log('onChatResumed in service');
    resumeChat({ serviceIdentifier, channelCustomerIdentifier }, (res: any) => {
      this.onChatResumedSubject.next(res);
    });
  }

  sendChatRequest(payload: any) {
    console.log('Chat Payload:', payload);
    chatRequest(payload);
  }

  createStandardFormObj(attributes: Attribute[]): Record<string, any> {
    const resultObject: Record<string, any> = {};
    attributes.forEach(attribute => {
      if (attribute.key && attribute.value !== undefined) {
        resultObject[attribute.key] = attribute.value;
      }
    });
    return resultObject;
  }

  sendWebhookNotification(webhook_url: any, payload: any) {
    let notificationObj = this.createStandardFormObj(payload.data.formData.attributes);
    let additionalData = {
      icon: '/customer-widget/widget-assets/images/favicon.ico',
      agent_url: this.ConfigData.FORM_URL
    }
    console.log('Form Object to send webhook notification: ', notificationObj);
    webhookNotifications(webhook_url, additionalData, notificationObj);
  }

  fetchBrowserData(apiKey: any, callback: any) {
    getBrowserInfo(apiKey, (res: any) => {
      console.log('browser info in sdk.service:', res);
      callback(res);
    })
  }

  sendCallbackRequest(configs: any, formData: any) {
    let formObj = this.createStandardFormObj(formData);
    console.log('callback standard form obj:', formObj);
    let payload = {
      campaignId: configs.campaignId,
      phone1: formObj['phone'],
      businessParam1: formObj['name'],
      businessParam2: formObj['email'],
      businessParam3: formObj['identifier'],
      businessParam4: this.getCurrentDate(),
      duplicateCallbacks: configs.allowDuplicate
    };

    console.log("send callback request: ", payload);
    callbackRequest(configs.callbackUrl, payload, (res: any) => {
      this.onCallbackRequestSubject.next(res);
    })

  }

  getCurrentDate() {
    var currentDate = new Date();
    // Get the current year, month, and day
    var year = currentDate.getFullYear();
    var month = String(currentDate.getMonth() + 1).padStart(2, "0"); // Months are zero-based
    var day = String(currentDate.getDate()).padStart(2, "0");

    // Combine the year, month, and day with hyphens using template literals
    var formattedDate = `${year}-${month}-${day}`;
    return formattedDate;
  }

  sendChatMessage(payload: any) {
    console.log('Customer Message Payload:', payload);
    sendMessage(payload);

  }

  moveToFileServer(filePayload: any, callback: any) {
    uploadToFileEngine(
      this.ConfigData.FILE_SERVER_URL,
      filePayload,
      (res: { type: string; name: string; size: any }) => {
        callback(res);
      },
    );
  }

  authenticateRoomId(authPayload: { roomId: string | null, secureToken: string | null }, callback: any) {
    authenticateRequest(
      this.ConfigData.AUTHENTICATOR_URL,
      authPayload,
      (res: any) => {
        callback(res);
      },
    );
  }

  handleChatEnd(customerPayload: any) {
    chatEnd(customerPayload);
  }

  /**************************
   *  WEB RTC CALL FUNCTIONS
   * @param webRtc
   *************************/

  loginSipWebRtc(webRtc: any) {

    const login = {
      action: "login",
      parameter: {
        loginId: webRtc.sipExtension,
        password: webRtc.extensionPassword,
        extension: webRtc.sipExtension,
        sipConfig: webRtc,
        clientCallbackFunction: (res: any) => {
          this.onWebRtcCallSubject.next(res);
        }
      }
    }
    postMessages(login);
  }

  handleCallStart(callPayload: any) {
    const dialCall = {
      action: 'makeCall',
      parameter: {
        callType: callPayload.type,
        Destination_Number: callPayload.authConfigs.diallingUri,
        calledNumber: callPayload.authConfigs.diallingUri,
        authData: callPayload.authConfigs,
        clientCallbackFunction: (res: any) => {
          this.onWebRtcCallSubject.next(res);
        }
      }
    }
    postMessages(dialCall);
  }

  handleCallEnd(sessionDialogId: any) {
    console.log('handle end call in sdk service: ===> ', sessionDialogId);
    const endCall = {
      action: 'releaseCall',
      parameter: {
        dialogId: sessionDialogId,
        clientCallbackFunction: (res: any) => {
          this.onWebRtcCallSubject.next(res);
        }
      }
    }
    postMessages(endCall);
  }

  handleCallMic(action: any, sessionDialogId: any) {
    console.log('handle mic mute/unmute in sdk service', action, sessionDialogId);
    const micPayload = {
      action: action,
      parameter: {
        dialogId: sessionDialogId,
        clientCallbackFunction: (res: any) => {
          this.onWebRtcCallSubject.next(res);
        }
      }
    }
    postMessages(micPayload);
  }

  handleCallHoldState(action: any, sessionDialogId: any) {
    console.log('handle mic mute/unmute in sdk service', action, sessionDialogId);
    const callStatePayload = {
      action: action,
      parameter: {
        dialogId: sessionDialogId,
        clientCallbackFunction: (res: any) => {
          this.onWebRtcCallSubject.next(res);
        }
      }
    }
    postMessages(callStatePayload);
  }

  handleCallVideo() {
    console.log('handle video show/hide in sdk service');
    videoControl();
  }
}

interface Attribute {
  key: string;
  value: any;
  [otherProps: string]: any; // Allow for any additional properties
}