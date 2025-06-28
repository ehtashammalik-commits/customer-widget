import { Component, OnInit } from '@angular/core';
import { TranscriptService } from '../services/transcript.service';
import { ActivatedRoute } from '@angular/router';
import { ConfigService } from '../services/config.service';

@Component({
  selector: 'app-transcript',
  templateUrl: './chat-transcript.component.html',
  styleUrls: ['./chat-transcript.component.scss'],
})
export class TranscriptComponent implements OnInit {
  chatDate = '465132564';
  processedMessages: any[] = [];
  senderIconMapSafe: { [key: string]: string } = {};
  browserLang = '';
  conversationAreaClass = '';

  constructor(
    private route: ActivatedRoute,
    private transcript: TranscriptService,
    public __appConfig: ConfigService
  ) {}

  ngOnInit(): void {
  this.route.queryParams.subscribe(async params => {
    const customerIdentifier = params['customerIdentifier'] || '';
    const serviceIdentifier = params['serviceIdentifier'] || '';
    const conversationId = params['conversationId'] || '';
    this.browserLang = params['browserLang'] || '';

    // Set text direction class
    if (this.browserLang === 'ar') {
      this.conversationAreaClass = 'right-direction';
    }

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

    // ⏳ Wait until icons are loaded
    await this.loadIcons(senderIconMap, jwtToken);

    const req = {
      customerIdentifier,
      serviceIdentifier,
      conversationId,
      browserLang: this.browserLang,
    };

    await this.loadChatData(req)
    // this.transcript.getTranscriptData(req).subscribe(data => {
    //   console.log("Transcript data received:", data);
    //   this.chatDate = data;
    //   this.processedMessages = data
    // });
  });
}

  async loadChatData(req: any) {
    try {
      const data = await this.transcript.getTranscriptData(req).toPromise();
      console.log("Transcript data received:", data);
      this.chatDate = "34/14/2009"
      this.processedMessages = data;
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
        this.senderIconMapSafe[key] = blobUrl;
      } catch (err) {
        console.error(`Error loading ${key}:`, err);
        this.senderIconMapSafe[key] = '';
      }
    });
    await Promise.all(promises);
    // Now senderIconMapSafe is ready to use in your template
  }

  formatTime(timestamp: string): string {
  const dateTime = new Date(timestamp);
  const minutes = dateTime.getMinutes() < 10 ? '0' + dateTime.getMinutes() : dateTime.getMinutes();
  return `${dateTime.getHours()}:${minutes}`;
}

getSafeUrl(url: string): string {
  // You can sanitize this later if needed via DomSanitizer
  return url;
}

getFileExtension(mimeType: string): string {
  const type = mimeType?.split("/")[1];
  return type === "vnd.openxmlformats-officedocument.wordprocessingml.document" ? "DOCX" : type;
}

getAgentIcon(senderName: string): string {
  // Optionally generate based on senderName
  return this.senderIconMapSafe[senderName] || 'assets/images/agent-default-icon.svg';
}

getCustomerIcon(firstName: string): string {
  // You can customize this or use a generated icon
  return 'assets/images/dummy-user.svg';
}

getChannelIconURL(senderName: string, senderId: string): string {
  // Example fallback, can be replaced with logic or a service map
  const lowerName = senderName?.toLowerCase() || '';
  const lowerId = senderId?.toLowerCase() || '';
  return `assets/images/channels/${lowerName || lowerId}.svg`;
}


  getMessageClass(msg: any) {
    return msg.type === 'BOT' ? 'bot-message' : 'user-message';
  }
}