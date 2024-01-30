import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

// Load Socket.IO script
const socketIOScript = document.createElement('script');
socketIOScript.src = 'https://cdn.socket.io/4.5.4/socket.io.min.js';
document.head.appendChild(socketIOScript);

// Load SIP.js script
const sipScript = document.createElement('script');
sipScript.src =
  'widget-assets/customer-sdk/sip-0.21.2.min.js';
document.head.appendChild(sipScript);

// Load the SDK script
const sdkScript = document.createElement('script');
sdkScript.src = 'widget-assets/customer-sdk/sdk.js';
document.head.appendChild(sdkScript);

// Set up loading completion
let scriptCounter = 0;
const scriptsToLoad = [socketIOScript, sipScript, sdkScript];
scriptsToLoad.forEach((script) => {
  script.onload = () => {
    scriptCounter++;
    if (scriptCounter === scriptsToLoad.length) {
      // All scripts are loaded, proceed with application bootstrap
      platformBrowserDynamic()
        .bootstrapModule(AppModule)
        .catch((err) => console.error(err));
    }
  };
  script.onerror = () => {
    console.error('Failed to load script:', script.src);
  };
});

if (environment.production) {
  enableProdMode();
}
