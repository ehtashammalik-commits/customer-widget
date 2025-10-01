import { lastValueFrom } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable()
export class ConfigService {
  configUrl = '../../widget-assets/config/config.json';
  configsToOverride: any = [
    "SOCKET_URL",
    "FILE_SERVER_URL",
    "BOT_FRAMEWORK_URL",
    "CCM_URL",
    "CONVERSATIONAL_URL",
    "FORM_URL",
    "AUTHENTICATOR_URL",
    "BUSINESSCALENDAR_URL",
    "CX_ACTIVITY",
  ];
  public appConfig: any;
  constructor(private _httpClient: HttpClient) { }

  async loadConfig() {
    const appConfig$ = this._httpClient.get(this.configUrl);
    this.appConfig = await lastValueFrom(appConfig$);

    //#####################################################################################################################
    // const currentFQDN = window.location.hostname;

    const currentFQDN = "ux-controls-01.expertflow.com"
    console.log("Current FQDN:", currentFQDN);

    for (let key of this.configsToOverride) {
      if (this.appConfig[key] && typeof this.appConfig[key] === "string" && this.appConfig[key].includes("http")) {
        this.appConfig[key] = this.appConfig[key].replace(/https?:\/\/[^\/]*/, `https://${currentFQDN}`);
      }
    }

    console.log("Updated Config:", this.appConfig);

    //#####################################################################################################################

  }
}
