import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PostMessageHandlerService {
  private browserInfoDataSubject = new Subject<any>();
  browserInfoData$ = this.browserInfoDataSubject.asObservable();

  constructor() {
    this.initMessageListener();
  }

  private initMessageListener() {
    window.addEventListener('message', (event) => {
      // if (event.origin !== 'https://efcx-frontend.web.app') {
      //   return;
      // }

      if (event.data.type === 'browserInfoData') {
        // console.log('Browser Info Data from PostMessage: ', event.data.data);
        this.browserInfoDataSubject.next(event.data.data);
      }
    }, false);
  }
}
