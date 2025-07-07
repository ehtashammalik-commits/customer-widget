import { NgModule, APP_INITIALIZER } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms'; // Import the FormsModule
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClient, HttpClientModule } from '@angular/common/http';

import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { MatRadioModule } from '@angular/material/radio';

import {TranslateLoader, TranslateModule} from '@ngx-translate/core';
import {TranslateHttpLoader} from '@ngx-translate/http-loader';

import { NgxLinkifyjsModule } from 'ngx-linkifyjs';
import { tagFormatPipe } from './tagFormat.pipe';
import { SafeFileURLPipe } from './getSafeFileURL.pipe';
import { AppComponent } from './app.component';
import { LocationStrategy, HashLocationStrategy } from '@angular/common';
import { AppRoutingModule, routingComponents } from './app-routing.module';
import { ConfigService } from './services/config.service';
import { ConfirmDialogComponent } from './confirm-dialog/confirm-dialog.component';
import { getMediaFromTask } from './getMediaFromTask.pipe';
import { NpsColorPipe } from './npsColor.pipe';
import { SvgNpsFormatPipe } from './svgFormat.pipe';
import { IsEllipsisActiveDirective } from './isEllipsisActive.directive';
import { TranscriptComponent } from './chat-transcript/chat-transcript.component';
import { FormatTimePipe } from './pipes/format-time.pipe';
import { NgxUiLoaderModule, NgxUiLoaderConfig } from 'ngx-ui-loader';
import { SanitizeHtmlPipe } from './sanitizeHtml.pipe';


export function initializeApp1(appConfigService: ConfigService) {
  return async () => {
    console.log('Initializing App');
    try {
      const config = await appConfigService.loadConfig();
      console.log('Config loaded:', config);
    } catch (error) {
      console.error('Error loading config:', error);
    }
  };
}

@NgModule({
  declarations: [
    AppComponent,
    routingComponents,
    ConfirmDialogComponent,
    tagFormatPipe,
    SafeFileURLPipe,
    getMediaFromTask,
    NpsColorPipe,
    SvgNpsFormatPipe,
    IsEllipsisActiveDirective,
    TranscriptComponent,
    FormatTimePipe,
    SanitizeHtmlPipe
  ],
  imports: [
    NgxLinkifyjsModule.forRoot({
      enableHash: false,
      enableMention: true,
    }),
    NgxUiLoaderModule.forRoot({
      fgsType: 'ball-spin', // You can choose other types like ball-spin, chasing-dots, etc.
      fgsColor: '#1d8cf8',
      pbDirection: 'ltr',
      text: 'Loading...',
    }),
    BrowserModule,
    HttpClientModule,
    TranslateModule.forRoot({
        loader: {
            provide: TranslateLoader,
            useFactory: HttpLoaderFactory,
            deps: [HttpClient]
        }
    }),
    AppRoutingModule,
    BrowserAnimationsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatToolbarModule,
    MatIconModule,
    FormsModule,
    MatTooltipModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
    MatChipsModule,
    MatRadioModule
  ],
  exports: [getMediaFromTask,TranscriptComponent],
  providers: [{
      provide: LocationStrategy,
      useClass: HashLocationStrategy,
    },
    ConfigService,
    {
      provide: APP_INITIALIZER,
      useFactory: (_appConfigService: ConfigService) => () =>
        _appConfigService.loadConfig(),
      deps: [ConfigService],
      multi: true,
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}

export function HttpLoaderFactory(http: HttpClient): TranslateHttpLoader {
  return new TranslateHttpLoader(http, 'widget-assets/i18n/', '.json');
}
