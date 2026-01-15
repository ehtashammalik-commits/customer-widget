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

  /**
   * Send a post message to the parent window
   * @param msg The type of message being sent
   */
  sendPostMessage(msg): void {
    const targetOrigin = this.getParentOrigin();
    const message = msg;
    message['timestamp'] = new Date().toISOString();
    console.log('Sending Post Message:', message);

    if (window.parent && window.parent !== window && targetOrigin) {
      window.parent.postMessage(message, targetOrigin);
      console.log('Post message sent:', message);
    }
  }

  sendLinkClickedPostMessage(link: any): void {
    const targetOrigin =  this.getParentOrigin();

    const message = {
      type: 'LINK_CLICKED',
      url: link,
      timestamp: new Date().toISOString(),
    };

    if (window.parent && window.parent !== window && targetOrigin) {
      window.parent.postMessage(message, targetOrigin);
      console.log('Post message sent:', message);
    }
  }

  getParentOrigin(): string | null {
    if (!document.referrer) {
      return null;
    }

    try {
      const origin = new URL(document.referrer).origin;
      return origin;
    } catch {
      return null;
    }
  }
}
