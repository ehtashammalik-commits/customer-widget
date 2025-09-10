import { ElementRef, ViewChild, Injectable } from '@angular/core';
import { ConfigService } from './config.service';

@Injectable({
  providedIn: 'root',
})
export class BrowserNotificationService {
  @ViewChild('myFileInput')
  myInputVariable!: ElementRef;

  constructor(private appConfig: ConfigService) {}

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
      var audioElement: any = document.getElementById('soundNotif');
      audioElement.play();
    } catch (error) {
      console.error('[playSound] unable to play sound ', error);
    }
  }

  openBrowserNotification(head: any, message: any) {
    if (!Notification) {
      console.log('Browser does not support notifications.');
      return;
    } else {
      // check if permission is already granted
      if (Notification.permission === 'granted') {
        // show notification here
        var notify = new Notification(head, {
          icon: '/widget-assets/images/chat.svg', // Add the path to your icon
          body: message,
        });
      } else {
        // request permission from user
        Notification.requestPermission()
          .then(function (p) {
            if (p === 'granted') {
              // show notification here
              var notify = new Notification(head, {
                icon: '/widget-assets/images/chat.svg', // Add the path to your icon
                body: message,
              });
            } else {
              console.log('User blocked notifications.');
            }
          })
          .catch(function (err) {
            console.error('Error requesting notification permission:', err);
          });
      }
    }
  }
}
