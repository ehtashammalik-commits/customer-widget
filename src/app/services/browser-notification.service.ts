import { ElementRef, ViewChild, Injectable } from '@angular/core';
import { ConfigService } from './config.service';

@Injectable({
  providedIn: 'root',
})
export class BrowserNotificationService {
  @ViewChild('myFileInput')
  myInputVariable!: ElementRef;

  constructor(private readonly appConfig: ConfigService) {}

  notify(cimMessage: any) {
    if (
      cimMessage.body.type.toLowerCase() !== 'notification' &&
      cimMessage.body.type.toLowerCase() !== 'deliverynotification'
    ) {
      const messageType = cimMessage.header.sender.type;
      const messageText = cimMessage.body.markdownText;
      const textType = cimMessage.body.type;
      if (
        messageType === 'BOT' ||
        messageType === 'AGENT' ||
        messageType === 'SYSTEM'
      ) {
        if (
          (textType === 'PLAIN' || textType === 'BUTTON') &&
          document.hidden
        ) {
          this.openBrowserNotification(messageType, messageText);
        }
        if (
          (textType === 'PLAIN' ||
            textType === 'BUTTON' ||
            textType === 'URL') &&
          !this.appConfig.appConfig.MUTE_NOTIFICATIONS
        ) {
          this.playSound();
        }
      }
    }
  }

  playSound() {
    try {
      let audioElement: any = document.getElementById('soundNotif');
      audioElement.play();
    } catch (error) {
      console.error('[playSound] unable to play sound ', error);
    }
  }

  openBrowserNotification(head: string, message: string): Promise<void> {
    return new Promise((resolve) => {
      if (!('Notification' in window)) {
        console.log('Browser does not support notifications.');
        resolve();
        return;
      }

      const showNotification = () => {
        new Notification(head, {
          icon: '/widget-assets/images/chat.svg',
          body: message,
        });
      };

      if (Notification.permission === 'granted') {
        showNotification();
        resolve();
      } else {
        Notification.requestPermission()
          .then((permission) => {
            if (permission === 'granted') {
              showNotification();
            } else {
              console.log('User blocked notifications.');
            }
          })
          .catch((err) => {
            console.error('Error requesting notification permission:', err);
          })
          .finally(() => resolve());
      }
    });
  }
}
