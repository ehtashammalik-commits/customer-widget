import { Injectable } from '@angular/core';
import { ConfigService } from "../services/config.service";
import { Observable, Subject } from 'rxjs';

declare var widgetConfigs: any, getPreChatForm: any, establishConnection: any, chatRequest: any, sendMessage: any, uploadToFileEngine: any, chatEnd: any, resumeChat: any, sendJoinConversation:any;

@Injectable({
  providedIn: 'root'
})
export class SdkService {
  private sdkLoaded: boolean = false;
  ConfigData: any;


  private widgetConfigsSubject: Subject<any> = new Subject<any>();
  public widgetConfigs$: Observable<any> = this.widgetConfigsSubject.asObservable();

  private preChatFormSubject: Subject<any> = new Subject<any>();
  public renderPreChatForm$: Observable<any> = this.preChatFormSubject.asObservable();

  private establishConnectionSubject: Subject<any> = new Subject<any>();
  public connectionResponse$: Observable<any> = this.establishConnectionSubject.asObservable();

  private onChatResumedSubject: Subject<any> = new Subject<any>();
  public onChatResumedResponse$: Observable<any> = this.onChatResumedSubject.asObservable();

  constructor(private _ConfigService: ConfigService) {
    this.ConfigData = this._ConfigService.appConfig;
    console.log('SDK service initialized', this.ConfigData);

    this.loadSdk().then(() => {
      this.loadWidget(this.ConfigData.CCM_URL, this.ConfigData.WIDGET_IDENTIFIER);
    });
  }
  ngOnInit(): void { }

  // loadSdk(): Promise<void> {
  //   return new Promise<void>((resolve) => {
  //     if (typeof widgetConfigs !== 'undefined') {
  //       console.log('SDK script loaded successfully');
  //       resolve();
  //     } else {
  //       const sdkLib = document.createElement('script');
  //       sdkLib.setAttribute('src', 'assets/customer-sdk/sdk.js');
  //       document.head.appendChild(sdkLib);
  //       sdkLib.onload = () => {
  //         console.log('SDK script loaded successfully');
  //         resolve();
  //       };
  //     }
  //   });
  // }

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

  // makeConnection(serviceIdentifier: any, channelCustomerIdentifier: any) {
  //   establishConnection(this.ConfigData.SOCKET_URL, serviceIdentifier, channelCustomerIdentifier, (res: any) => {
  //     this.establishConnectionSubject.next(res);
  //   });
  // }
  makeConnection(serviceIdentifier: any, channelCustomerIdentifier: any) {
    if (!this.sdkLoaded) {
      console.error('SDK script is not loaded yet');
      return;
    }

    establishConnection(this.ConfigData.SOCKET_URL, serviceIdentifier, channelCustomerIdentifier, (res: any) => {
      this.establishConnectionSubject.next(res);
    });
  }

  onChatResumed(serviceIdentifier: any, channelCustomerIdentifier: any) {
    resumeChat(serviceIdentifier, channelCustomerIdentifier, (res: any) => {
        this.onChatResumedSubject.next(res);
    });
  }

  // onJoinConversation(data:any) {
  //   sendJoinConversation(data, (res:any) => {
  //     console.log(res, 'send Join Conversation Data');
  //   })
  // }

  sendChatRequest(payload: any) {
    console.log('Chat Payload:', payload);
    chatRequest(payload);
  }
  sendChatMessage(payload: any) {
    console.log('Customer Message Payload:', payload);
    sendMessage(payload);
  }

  moveToFileServer(filePayload: any, callback: any) {
    uploadToFileEngine(this.ConfigData.FILE_SERVER_URL, filePayload, (res: { type: string; name: string; size: any; }) => {
      callback(res)
    });
  }

  handleChatEnd(customerPayload: any) {
    chatEnd(customerPayload);
  }
}
