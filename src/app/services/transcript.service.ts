import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigService } from './config.service';
import { StorageService } from './storage.service';

@Injectable({
  providedIn: 'root',
})
export class TranscriptService {
  nativeElement: any;
  constructor(
    private readonly http: HttpClient,
    public __appConfig: ConfigService,
    private readonly storageService: StorageService,
  ) {}

  getTranscriptData(data): Observable<any> {
    const ccmUrl = this.__appConfig.appConfig.CCM_URL;
    const url = `${ccmUrl}/message?customerChannelIdentifier=${null}&serviceIdentifier=${null}&conversationId=${data.conversationId}`;

    const token = this.storageService.getItem('jwt_token');

    const headers = {
      Authorization: `Bearer ${token}`,
    };

    return this.http.get(url, { headers });
  }
}
