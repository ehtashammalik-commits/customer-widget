import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigService } from './config.service';


@Injectable({
  providedIn: 'root',
})
export class TranscriptService {
  constructor(
    private http: HttpClient,
    public __appConfig: ConfigService
  ) {}

  getTranscriptData(data): Observable<any> {
    console.log("here is the data in service now", data)
    const ccmUrl = this.__appConfig.appConfig.CCM_URL;
    const url =  `${ccmUrl}/message?customerChannelIdentifier=${data.customerIdentifier}&serviceIdentifier=${data.serviceIdentifier}&conversationId=${data.conversationId}` // Replace with actual API endpoint
    return this.http.get(url);
  }
}