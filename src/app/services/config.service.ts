import { lastValueFrom } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable()
export class ConfigService {
  configUrl = '../../assets/config/config.json';
  public appConfig: any;
  constructor(private _httpClient: HttpClient) {}

  async loadConfig() {
    const appConfig$ = this._httpClient.get(this.configUrl);
    this.appConfig = await lastValueFrom(appConfig$);
  }
}
