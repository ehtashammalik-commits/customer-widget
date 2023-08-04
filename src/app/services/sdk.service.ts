import { Injectable } from '@angular/core';
import { ConfigService } from "../services/config.service";
import { Observable, Subject } from 'rxjs';

declare var widgetConfigs: any, getPreChatForm: any;

@Injectable({
  providedIn: 'root'
})
export class SdkService {
  ConfigData: any;

  private widgetConfigsSubject: Subject<any> = new Subject<any>();
  public widgetConfigs$: Observable<any> = this.widgetConfigsSubject.asObservable();

  private preChatFormSubject: Subject<any> = new Subject<any>();
  public renderPreChatForm$: Observable<any> = this.preChatFormSubject.asObservable();

  constructor(private _ConfigService: ConfigService) {
    this.ConfigData = this._ConfigService.appConfig;
    console.log('SDK service initialized', this.ConfigData);

    this.loadSdk().then(() => {
      this.loadWidget(this.ConfigData.CCM_URL, this.ConfigData.WIDGET_IDENTIFIER);
    });
  }
  ngOnInit(): void { }

  loadSdk(): Promise<void> {
    return new Promise<void>((resolve) => {
      if (typeof widgetConfigs !== 'undefined') {
        resolve();
      } else {
        const sdkLib = document.createElement('script');
        sdkLib.setAttribute('src', 'assets/customer-sdk/sdk.js');
        document.head.appendChild(sdkLib);
        sdkLib.onload = () => {
          resolve();
        };
      }
    });
  }

  loadWidget(ccm_url: any, widget_identifier: any) {
    widgetConfigs(ccm_url, widget_identifier, (res: any) => {
      this.widgetConfigsSubject.next(res);
    });
  }

  renderPreChatForm(form_id:any) {
    getPreChatForm(this.ConfigData.FORM_URL, form_id, (res:any) =>{
      this.preChatFormSubject.next(res);
    });
  }

}
