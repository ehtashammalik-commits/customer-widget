import { Component, OnInit } from '@angular/core';
import { TranscriptService } from '../services/transcript.service';
import { ActivatedRoute } from '@angular/router';
import { ConfigService } from '../services/config.service';
import { firstValueFrom } from 'rxjs';

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

     const req = {
      customerIdentifier,
      serviceIdentifier,
      conversationId,
      browserLang: this.browserLang,
    };

    await this.loadChatData(req)

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

  ngAfterViewInit(): void {
    // Wait for view + any bindings to finish
    // setTimeout(() => {
    //   window.print();
    // }, 2000);
  }

  async loadChatData(req: any) {
  try {
    const data = await firstValueFrom(this.transcript.getTranscriptData(req));
    console.log("Transcript data received:", data);

    const rawTimestamp = data[0].header.timestamp;
    const localDate = new Date(rawTimestamp);

    // Format as YYYY/MM/DD in local time
    const formattedDate = `${localDate.getFullYear()}/${String(localDate.getMonth() + 1).padStart(2, '0')}/${String(localDate.getDate()).padStart(2, '0')}`;

    this.chatDate = formattedDate;
    this.processedMessages = data;
  } catch (error) {
    console.error("Error loading chat data:", error);
  }
}


  async loadIcons(senderIconMap: { [key: string]: string }, jwtToken: string) {

    console.log("Sender Icon Map:", senderIconMap);
    const entries = Object.entries(senderIconMap);
    console.log("Entries:", entries);
    const promises = entries.map(async ([key, url]) => {
      try {
        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${jwtToken}`,
          },
        });
        console.log(`Fetching icon for ${key}:`, url);
        if (!response.ok) throw new Error(`${key} failed: ${response.status}`);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        console.log(`Blob URL for ${key}:`, blobUrl);
        this.senderIconMapSafe[key] = blobUrl;
        console.log(`this.senderIconMapSafe[key]`,this.senderIconMapSafe[key]);
      } catch (err) {
        console.error(`Error loading ${key}:`, err);
        this.senderIconMapSafe[key] = '';
      }
    });
    await Promise.all(promises);
    // Now senderIconMapSafe is ready to use in your template
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

  getFileExtension(mimeType: string): string {
  const type = mimeType?.split("/")[1];
  return type === "vnd.openxmlformats-officedocument.wordprocessingml.document" ? "DOCX" : type;
}


  getAgentIcon(senderName: string): string {
    // Optionally generate based on senderName
    return this.senderIconMapSafe[senderName] || 'assets/images/agent-default-icon.svg';
  }

  getCustomerIcon(firstName: string): string {
    console.log("First Name:", firstName);
    const nameParts = firstName.split(" ");
    if (nameParts.length > 1) {
      // If there is more than one part to the name (i.e. a space), use the first letters of each part
      const [firstLetter, secondLetter] = nameParts.map((s) => s.charAt(0));
      return firstLetter + "" + secondLetter;
    } else {
      // If there is only one part to the name (i.e. no space), use the first and last letters of the word
      return firstName.charAt(0) + "" + firstName.charAt(firstName.length - 1);
    }
    // console.log("First Name:", firstName);
    // // You can customize this or use a generated icon
    // return '../../widget-assets/chat-transcript/images/dummy-user.svg';
  }

  getChannelIconURL(senderName: string, senderId: string): string {
    // Example fallback, can be replaced with logic or a service map
    const lowerName = senderName?.toLowerCase() || '';
    console.log("Sender Name:", lowerName);
    const lowerId = senderId?.toLowerCase() || '';  
    console.log("Sender ID:", lowerId);
    return this.senderIconMapSafe[lowerName] || this.senderIconMapSafe[lowerId] || this.senderIconMapSafe['default'] || '';
  }


  getMessageClass(msg: any) {
    return msg.type === 'BOT' ? 'bot-message' : 'user-message';
  }
}