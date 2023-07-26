import { Injectable } from '@angular/core';
import { ConfigService } from "../services/config.service";
// import { Observable } from 'rxjs';

declare var widgetConfigs: any, getPreChatForm:any;

@Injectable({
  providedIn: 'root'
})
export class SdkService {
  ConfigData:any;
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
        // widgetConfigs is already available, resolve the Promise immediately
        resolve();
      } else {
        // widgetConfigs not available yet, listen for the 'load' event of the script
        const sdkLib = document.createElement('script');
        sdkLib.setAttribute('src', 'assets/customer-sdk/sdk.js');
        document.head.appendChild(sdkLib);

        sdkLib.onload = () => {
          // The SDK file has loaded, resolve the Promise
          resolve();
        };
      }
    });
  }

  loadWidget(ccm_url: any, widget_identifier: any) {
    console.log("window loaded");
    widgetConfigs(ccm_url, widget_identifier, (res:any) => {
      this.setWidgetConfigs(res);
      if (res.form != null || res.form != undefined) {
        console.log(res.form, '---------------Form Id');
        getPreChatForm(this.ConfigData.FORM_URL, res.form, (res: { attributes: any; }) => {
          console.log('formData:------------', res.attributes);
          this.renderPreChatForm(res.attributes);
        });
      }
      console.log(res, 'configs.....');
    });
  }

  setWidgetConfigs(configs: any) {
    // Implement the logic to set widget configurations here
  }

  renderPreChatForm(attributes: any) {
    // Implement the logic to render the pre-chat form with the provided 'attributes'
  }

}
