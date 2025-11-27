import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PostMessageHandlerService {
  private browserInfoDataSubject = new Subject<any>();
  browserInfoData$ = this.browserInfoDataSubject.asObservable();

  constructor() {
    this.initMessageListener();
  }

  private initMessageListener() {
    window.addEventListener(
      'message',
      (event) => {
        // if (event.origin !== 'https://efcx-frontend.web.app') {
        //   return;
        // }

        if (event.data.type === 'browserInfoData') {
          // console.log('Browser Info Data from PostMessage: ', event.data.data);
          this.browserInfoDataSubject.next(event.data.data);
        }
      },
      false,
    );
  }

  /**
   * Send a post message to the parent window
   * @param msg The type of message being sent
   */
  sendPostMessage(msg): void {
    const message = msg;
    message['timestamp'] = new Date().toISOString();
    console.log('Sending Post Message:', message);

    if (window.parent && window.parent !== window) {
      window.parent.postMessage(message, '*');
      console.log('Post message sent:', message);
    }
  }

  sendLinkClickedPostMessage(link: any): void {
    const message = {
      type: 'LINK_CLICKED',
      url: link,
      timestamp: new Date().toISOString(),
    };

    if (window.parent && window.parent !== window) {
      window.parent.postMessage(message, '*');
      console.log('Post message sent:', message);
    }
  }
}
