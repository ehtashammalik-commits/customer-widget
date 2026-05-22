import { Component, OnInit } from '@angular/core';
import { TranscriptService } from '../services/transcript.service';
import { ActivatedRoute } from '@angular/router';
import { ConfigService } from '../services/config.service';
import { firstValueFrom } from 'rxjs';
import {
  DomSanitizer,
  SafeResourceUrl,
  SafeUrl,
  Title,
} from '@angular/platform-browser';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { TranslateService } from '@ngx-translate/core';
import { StorageService } from '../services/storage.service';

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
  state: string = '';
  enableTranscriptNotifications: boolean = false;
  private receivedToken: string = '';
  isExpanded = false;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly transcript: TranscriptService,
    public __appConfig: ConfigService,
    private readonly sanitizer: DomSanitizer,
    private readonly ngxLoader: NgxUiLoaderService,
    private readonly title: Title,
    private readonly translate: TranslateService,
    private readonly storageService: StorageService,
  ) {
    translate.setDefaultLang('en');
    translate.use('en');

    // Listen for JWT token via postMessage
    window.addEventListener('message', (event) => {
      // Validate origin for security - allow same origin and opener's origin
      const trustedOrigins = [window.location.origin];
      if (window.opener) {
        try {
          trustedOrigins.push(new URL(window.opener.location.href).origin);
        } catch (e) {
          // Cross-origin opener, can't access location
          console.error('Error accessing opener location:', e);
        }
      }

      if (!trustedOrigins.includes(event.origin)) {
        console.warn('Received message from untrusted origin:', event.origin);
        return;
      }

      if (event.data?.type === 'JWT_TOKEN') {
        this.receivedToken = event.data.token;
        console.log('JWT token received via postMessage');
      }
    });
  }

  ngOnInit(): void {
    this.enableTranscriptNotifications =
      this.__appConfig.appConfig.ENABLE_TRANSCRIPT_NOTIFICATIONS || false;
    this.title.setTitle('Conversation Transcript');
    this.route.queryParams.subscribe(async (params) => {
      const conversationId = params['conversationId'] || '';
      this.browserLang = params['browserLang'] || '';
      this.translate.use(this.browserLang || 'en');
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
      // Wait briefly for postMessage token, then fallback to storage
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const jwtToken =
        this.receivedToken || this.storageService.getItem('jwt_token') || '';
      this.storageService.setItem('jwt_token', jwtToken);
      await this.loadChatData(req);
      this.ngxLoader.stop();

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
        'web-connector': `${originURL}/file-engine/api/downloadFileStream?filename=_WEB.svg`,
        'facebook-connector': `${originURL}/file-engine/api/downloadFileStream?filename=_FACEBOOK.svg`,
        '360-connector': `${originURL}/file-engine/api/downloadFileStream?filename=_WHATSAPP.svg`,
        'telegram-connector': `${originURL}/file-engine/api/downloadFileStream?filename=_TELEGRAM.svg`,
        'twitter-connector': `${originURL}/file-engine/api/downloadFileStream?filename=_TWITTER.svg`,
        'instagram-connector': `${originURL}/file-engine/api/downloadFileStream?filename=_INSTAGRAM.svg`,
        'email-connector': `${originURL}/file-engine/api/downloadFileStream?filename=_EMAIL.svg`,
        'viber-connector': `${originURL}/file-engine/api/downloadFileStream?filename=_VIBER.svg`,
        'smpp-connector': `${originURL}/file-engine/api/downloadFileStream?filename=_SMS.svg`,
        default: `${originURL}/file-engine/api/downloadFileStream?filename=_WEB.svg`,
      };
      await this.loadIcons(senderIconMap, jwtToken);
    });
  }

  async loadChatData(req: any) {
    try {
      const data = await firstValueFrom(this.transcript.getTranscriptData(req));

      const processed: any[] = [];

      for (const message of data) {
        const intent = message?.header?.intent?.toLowerCase();

        if (message.body?.type === 'DELIVERYNOTIFICATION') {
          const originalId = message.body.messageId;
          const index = processed.findIndex((msg) => msg.id === originalId);

          if (index !== -1) {
            const status = message.body.status;
            processed[index].isBlurred = status === 'FAILED';
          }
        }

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
      console.error('Error loading chat data:', error);
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

  getInitialsFromFullName(name: string | null | undefined = ''): string {
    const trimmedName = (name ?? '').trim();
    if (!trimmedName) return ''; // safeguard for empty input

    const nameParts = trimmedName.split(' ').filter((part) => part.length > 0);

    if (nameParts.length > 1) {
      const [firstLetter, secondLetter] = nameParts.map((s) =>
        s.charAt(0).toUpperCase(),
      );
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
    const type = mimeType?.split('/')[1];
    return type ===
      'vnd.openxmlformats-officedocument.wordprocessingml.document'
      ? 'DOCX'
      : type;
  }

  getCustomerIcon(firstName: string): string {
    const nameParts = firstName.split(' ');
    if (nameParts.length > 1) {
      // If there is more than one part to the name (i.e. a space), use the first letters of each part
      const [firstLetter, secondLetter] = nameParts.map((s) => s.charAt(0));
      return firstLetter + '' + secondLetter;
    } else {
      // If there is only one part to the name (i.e. no space), use the first and last letters of the word
      return firstName.charAt(0) + '' + firstName.charAt(firstName.length - 1);
    }
  }

  getChannelIconURL(senderName: string, senderId: string): string {
    // Example fallback, can be replaced with logic or a service map
    const lowerName = senderName?.toLowerCase() || '';
    const lowerId = senderId?.toLowerCase() || '';
    return (
      this.senderIconMapSafe[lowerName] ||
      this.senderIconMapSafe[lowerId] ||
      this.senderIconMapSafe['default'] ||
      ''
    );
  }

  getAgentDisplayName(keycloakUser: any): string {
    if (this.__appConfig.appConfig.USERNAME_ENABLED) {
      return keycloakUser.username || keycloakUser.senderName || 'Agent';
    }

    const firstName =
      keycloakUser.firstName || keycloakUser.additionalDetail?.firstName;
    const lastName =
      keycloakUser.lastName || keycloakUser.additionalDetail?.lastName;
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    } else if (firstName) {
      return firstName;
    } else if (lastName) {
      return lastName;
    } else {
      return keycloakUser.username || 'Agent';
    }
  }

  async downloadAsPDF() {
    window.print();
  }

  getFormAnswerLabels(answer: any[]): string {
    if (!Array.isArray(answer)) return '';
    return answer
      .filter((a: any) => a?.isSelected)
      .map((a: any) => a.label)
      .join(', ');
  }

  private carouselIndexMap: Map<string, number> = new Map();

  getCarouselIndex(messageId: string): number {
    return this.carouselIndexMap.get(messageId) ?? 0;
  }

  nextSlide(messageId: string, totalElements: number): void {
    const current = this.getCarouselIndex(messageId);
    if (current < totalElements - 1) {
      this.carouselIndexMap.set(messageId, current + 1);
    }
  }

  prevSlide(messageId: string): void {
    const current = this.getCarouselIndex(messageId);
    if (current > 0) {
      this.carouselIndexMap.set(messageId, current - 1);
    }
  }

  setCarouselIndex(messageId: string, index: number): void {
    this.carouselIndexMap.set(messageId, index);
  }

  hasSelectedOption(answer: any[]): boolean {
    return answer?.some((opt) => opt.isSelected) || false;
  }

  // ✅ Check if attribute has valid answer
  isAnswered(attr: any): boolean {
    if (!attr?.answer || !attr.answer.length) return false;

    if (attr.attributeType === 'OPTIONS') {
      return attr.answer.some((opt) => opt.isSelected);
    }

    return attr.answer[0] !== null && attr.answer[0] !== '';
  }

  // ✅ Get selected options (radio / checkbox / dropdown)
  getSelectedOptions(answer: any[]): string {
    if (!answer) return '';

    return answer
      .filter((opt) => opt.isSelected)
      .map((opt) => opt.label)
      .join(', ');
  }

  // ✅ Count total answered questions
  getTotalCount(sections: any[]): number {
    let count = 0;

    sections?.forEach((section) => {
      section.attributes.forEach((attr) => {
        if (this.isAnswered(attr)) count++;
      });
    });

    return count;
  }

  // ✅ Global index (ONLY for answered questions)
  getGlobalIndex(
    sections: any[],
    currentSection: any,
    attrIndex: number,
  ): number {
    let count = 0;

    for (let sec of sections) {
      for (let i = 0; i < sec.attributes.length; i++) {
        const attr = sec.attributes[i];

        if (!this.isAnswered(attr)) continue;

        if (sec === currentSection && i === attrIndex) {
          return count;
        }

        count++;
      }
    }

    return count;
  }

  // ✅ Section has at least one answered question
  sectionHasAnswers(section: any): boolean {
    return section?.attributes?.some((attr) => this.isAnswered(attr)) || false;
  }

  // ✅ Get form title and description from original message
  getMessageData(message: any): { title: string; description: string } {
    // Check if current message has formTitle and formDescription
    if (message?.body?.formTitle && message?.body?.formDescription) {
      return {
        title: message.body.formTitle,
        description: message.body.formDescription,
      };
    }

    // Try to get from original message using originalMessageId
    const originalMessageId = message?.header?.originalMessageId;
    if (originalMessageId) {
      const originalMessage = this.processedMessages.find(
        (msg) =>
          msg.id === originalMessageId ||
          msg.header?.messageId === originalMessageId,
      );
      if (originalMessage?.body) {
        return originalMessage;
      }
    }

    // Fallback to current message or default values
    return {
      title: message?.body?.formTitle || 'Form',
      description: message?.body?.formDescription || '',
    };
  }
}
