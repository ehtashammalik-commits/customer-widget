import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigService } from './config.service';


@Injectable({
  providedIn: 'root',
})
export class TranscriptService {
  nativeElement: any;
  constructor(
    private http: HttpClient,
    public __appConfig: ConfigService
  ) {}

  getTranscriptData(data): Observable<any> {
    const ccmUrl = this.__appConfig.appConfig.CCM_URL;
    const url =  `${ccmUrl}/message?customerChannelIdentifier=${null}&serviceIdentifier=${null}&conversationId=${data.conversationId}`
    return this.http.get(url);
  }
}