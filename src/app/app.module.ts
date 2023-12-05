import { NgModule, APP_INITIALIZER } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms'; // Import the FormsModule
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';

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

import { NgxLinkifyjsModule } from "ngx-linkifyjs";
import { tagFormatPipe } from './tagFormat.pipe';
import { AppComponent } from './app.component';
import { LocationStrategy, HashLocationStrategy } from '@angular/common';
import { AppRoutingModule, routingComponents } from './app-routing.module';
import { ConfigService } from './services/config.service';
import { ConfirmDialogComponent } from './confirm-dialog/confirm-dialog.component';

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
  declarations: [AppComponent, routingComponents, ConfirmDialogComponent, tagFormatPipe],
  imports: [
    NgxLinkifyjsModule.forRoot({
      enableHash: false,
      enableMention: true
    }),
    BrowserModule,
    HttpClientModule,
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
  ],
  providers: [
    {
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
