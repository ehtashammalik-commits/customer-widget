import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PostMessageHandlerService {
  private readonly browserInfoDataSubject = new Subject<any>();
  browserInfoData$ = this.browserInfoDataSubject.asObservable();

  constructor() {
    this.initMessageListener();
  }

  private initMessageListener() {
    window.addEventListener(
      'message',
      (event) => {
        if (event.data.type === 'browserInfoData') {
          this.browserInfoDataSubject.next(event.data.data);
        }
      },
      false,
    );
  }
}
