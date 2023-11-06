import { Injectable, OnInit } from '@angular/core';
import { ConfigService } from '../services/config.service';
import { Observable, Subject } from 'rxjs';

declare var widgetConfigs: any,
  getPreChatForm: any,
  establishConnection: any,
  chatRequest: any,
  sendMessage: any,
  uploadToFileEngine: any,
  chatEnd: any,
  resumeChat: any,
  webhookNotifications: any,
  dialCall: any,
  sendInvite: any,
  closeSession: any,
  audioControl: any,
  callbackRequest: any;

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

  private establishConnectionSubject: Subject<any> = new Subject<any>();
  public connectionResponse$: Observable<any> =
    this.establishConnectionSubject.asObservable();

  private onChatResumedSubject: Subject<any> = new Subject<any>();
  public onChatResumedResponse$: Observable<any> =
    this.onChatResumedSubject.asObservable();

  private onCallSubject: Subject<any> = new Subject<any>();
  public onCallResponse$: Observable<any> = this.onCallSubject.asObservable();

  private onCallbackRequestSubject: Subject<any> = new Subject<any>();
  public onCallbackRequestResponse$: Observable<any> = this.onCallbackRequestSubject.asObservable();

  constructor(private _ConfigService: ConfigService) {
    this.ConfigData = this._ConfigService.appConfig;
    this.loadSdk();
  }
  ngOnInit(): void { }

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
      this.preChatFormSubject.next(res);
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

  onChatResumed(serviceIdentifier: any, channelCustomerIdentifier: any) {
    console.log('onChatResumed in service');
    resumeChat({ serviceIdentifier, channelCustomerIdentifier }, (res: any) => {
      this.onChatResumedSubject.next(res);
    });
  }

  sendChatRequest(payload: any) {
    console.log('Chat Payload:', payload);
    chatRequest(payload);
    let notificationPayload = {
      name: payload.data.formData.attributes.first_name,
      email: payload.data.formData.attributes.business_email,
      phone: payload.data.formData.attributes.phone_number,
      type: payload.data.formData.attributes.customer_type,
    };
    webhookNotifications(this.ConfigData.WEBHOOK_URL, notificationPayload);
  }

  sendCallbackRequest(formData: any) {
    let ecm_url = this.ConfigData.ECM_URL;
    let payload = {
      campaignId: this.ConfigData.CAMPAIGN_ID,
      phone1: formData.phone_number,
      businessParam1: formData.first_name,
      businessParam2: formData.business_email,
      businessParam3: formData.customer_channel_identifier,
      businessParam4: this.getCurrentDate(),
      duplicateCallbacks: this.ConfigData.ALLOW_DUPLICATE
    };

    console.log("send callback request: ", payload);
    callbackRequest(ecm_url, payload, (res: any) => {
      // console.log("Callback request response: ", res);
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

  handleChatEnd(customerPayload: any) {
    chatEnd(customerPayload);
  }

  handleCallStart() {
    dialCall((res: any) => {
      this.onCallSubject.next(res);
    });
  }

  sendCallRequest(
    type: string,
    remoteElementId: string,
    localElementId: string,
    customerData: any,
  ) {
    sendInvite(
      type,
      remoteElementId,
      localElementId,
      customerData,
      (res: any) => {
        this.onCallSubject.next(res);
      },
    );
  }

  handleCallEnd() {
    console.log('handle end call in sdk service');
    closeSession((res: any) => {
      this.onCallSubject.next(res);
    });
  }

  handleCallMic() {
    console.log('handle mic mute/unmute in sdk service');
    audioControl();
  }
}
