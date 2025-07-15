import { Component, OnInit } from '@angular/core';
import { TranscriptService } from '../services/transcript.service';
import { ActivatedRoute } from '@angular/router';
import { ConfigService } from '../services/config.service';
import { firstValueFrom } from 'rxjs';
import {DomSanitizer, SafeResourceUrl, SafeUrl, Title} from '@angular/platform-browser';
import { NgxUiLoaderService } from 'ngx-ui-loader';


@Component({
  selector: 'app-transcript',
  templateUrl: './chat-transcript.component.html',
  styleUrls: ['./chat-transcript.component.scss'],
})
export class TranscriptComponent implements OnInit {
  chatDate = '';
  processedMessages: any[] = [];
  senderIconMapSafe: { [key: string]: string } = {};
  browserLang = '';
  conversationAreaClass = '';
  state : string = '';

  constructor(
    private route: ActivatedRoute,
    private transcript: TranscriptService,
    public __appConfig: ConfigService,
    private sanitizer: DomSanitizer,
    private ngxLoader: NgxUiLoaderService,
    private title: Title
  ) {}

  ngOnInit(): void {
    this.title.setTitle('Conversation Transcript');
  this.route.queryParams.subscribe(async params => {
    const conversationId = params['conversationId'] || '';
    this.browserLang = params['browserLang'] || '';
    this.state = params['state'] || '';

    if (!conversationId) {
      alert('Conversation ID is missing. Cannot load transcript.');
      return;
    }
    // Set text direction class
    if (this.browserLang === 'ar') {
      this.conversationAreaClass = 'right-direction';
    }

     const req = {
      conversationId,
      browserLang: this.browserLang,
    };

    this.ngxLoader.start();
    await this.loadChatData(req);
    this.ngxLoader.stop();
    this.printChatTranscript();


    // Prepare icon URLs
    let originURL = '';
    try {
      const ccmUrl = this.__appConfig.appConfig.CCM_URL;
      originURL = new URL(ccmUrl).origin;
      console.log('Origin URL:', originURL);
    } catch (e) {
      console.error('Invalid ccmUrl:', e);
    }

    const senderIconMap: { [key: string]: string } = {
      "web-connector": `${originURL}/file-engine/api/downloadFileStream?filename=_WEB.svg`,
      "facebook-connector": `${originURL}/file-engine/api/downloadFileStream?filename=_FACEBOOK.svg`,
      "360-connector": `${originURL}/file-engine/api/downloadFileStream?filename=_WHATSAPP.svg`,
      "telegram-connector": `${originURL}/file-engine/api/downloadFileStream?filename=_TELEGRAM.svg`,
      "twitter-connector": `${originURL}/file-engine/api/downloadFileStream?filename=_TWITTER.svg`,
      "instagram-connector": `${originURL}/file-engine/api/downloadFileStream?filename=_INSTAGRAM.svg`,
      "email-connector": `${originURL}/file-engine/api/downloadFileStream?filename=_EMAIL.svg`,
      "viber-connector": `${originURL}/file-engine/api/downloadFileStream?filename=_VIBER.svg`,
      "smpp-connector": `${originURL}/file-engine/api/downloadFileStream?filename=_SMS.svg`,
      "default": `${originURL}/file-engine/api/downloadFileStream?filename=_WEB.svg`,
    };

    const jwtToken = localStorage.getItem('jwt_token') || '';
    await this.loadIcons(senderIconMap, jwtToken);
  });
}

  async loadChatData(req: any) {
      try {
        const data = await firstValueFrom(this.transcript.getTranscriptData(req));

        const processed: any[] = [];

        for (const message of data) {
          const intent = message?.header?.intent?.toLowerCase();

          if (intent === 'update') {
            const originalId = message.header.originalMessageId;

            const index = processed.findIndex((msg) => msg.id === originalId);

            if (index !== -1) {
              // Update the original message
              processed[index].body.markdownText = message.body.markdownText;
              processed[index].isEdited = true;
            }
          } else {
            processed.push(message);
          }
        }

        const rawTimestamp = processed[0]?.header?.timestamp;
        const localDate = new Date(rawTimestamp);

        this.chatDate = `${localDate.getFullYear()}/${String(localDate.getMonth() + 1).padStart(2, '0')}/${String(localDate.getDate()).padStart(2, '0')}`;
        this.processedMessages = processed;

      } catch (error) {
        console.error("Error loading chat data:", error);
      }
    }



  async loadIcons(senderIconMap: { [key: string]: string }, jwtToken: string) {
  const entries = Object.entries(senderIconMap);

  const promises = entries.map(async ([key, url]) => {
    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
        },
      });

      if (!response.ok) throw new Error(`${key} failed: ${response.status}`);

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const safeUrl: SafeUrl = this.sanitizer.bypassSecurityTrustUrl(blobUrl);

      this.senderIconMapSafe[key] = safeUrl as string; // type assertion needed for template binding
    } catch (err) {
      console.error(`Error loading ${key}:`, err);
      this.senderIconMapSafe[key] = '';
    }
  });

  await Promise.all(promises);
}

  printChatTranscript() {
  if (this.state !== 'download') return;

  setTimeout(() => {
    window.print();
  }, 2000);
}



  getSafeUrl(url: string): string {
    // You can sanitize this later if needed via DomSanitizer
    return url;
  }

  getInitialsFromFullName(name: string = ''): string {
    const trimmedName = name.trim();
    if (!trimmedName) return ''; // safeguard for empty input

    const nameParts = trimmedName.split(' ').filter(part => part.length > 0);

    if (nameParts.length > 1) {
      const [firstLetter, secondLetter] = nameParts.map((s) => s.charAt(0).toUpperCase());
      return firstLetter + secondLetter;
    } else {
      return (
        trimmedName.charAt(0).toUpperCase() +
        trimmedName.charAt(trimmedName.length - 1).toUpperCase()
      );
    }
  }

  getGoogleMapsUrl(lat: number, lng: number): SafeResourceUrl {
    const mapUrl = `https://maps.google.com/maps?q=${lat},${lng}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(mapUrl);
  }

  trackByMessageId(index: number, message: any): string {
    return message.header.messageId;
  }

  getFileExtension(mimeType: string): string {
  const type = mimeType?.split("/")[1];
  return type === "vnd.openxmlformats-officedocument.wordprocessingml.document" ? "DOCX" : type;
}

  getCustomerIcon(firstName: string): string {
    const nameParts = firstName.split(" ");
    if (nameParts.length > 1) {
      // If there is more than one part to the name (i.e. a space), use the first letters of each part
      const [firstLetter, secondLetter] = nameParts.map((s) => s.charAt(0));
      return firstLetter + "" + secondLetter;
    } else {
      // If there is only one part to the name (i.e. no space), use the first and last letters of the word
      return firstName.charAt(0) + "" + firstName.charAt(firstName.length - 1);
    }
  }

  getChannelIconURL(senderName: string, senderId: string): string {
    // Example fallback, can be replaced with logic or a service map
    const lowerName = senderName?.toLowerCase() || '';
    const lowerId = senderId?.toLowerCase() || '';
    return this.senderIconMapSafe[lowerName] || this.senderIconMapSafe[lowerId] || this.senderIconMapSafe['default'] || '';
  }
}
