const { customerWidgetUrl, serviceIdentifier, widgetIdentifier } = __cim;
const priorityCookies = ['mtc_id', '_ga']; // Add any other cookies you want to prioritize

function getCookieValue(cookieName) {
  const cookies = document.cookie.split('; ');
  for (const cookie of cookies) {
    const [name, value] = cookie.split('=');
    if (name === cookieName) {
      return decodeURIComponent(value);
    }
  }
  return null;
}

let selectedCookie = null;

for (const cookieName of priorityCookies) {
  const cookieValue = getCookieValue(cookieName);
  if (cookieValue) {
    selectedCookie = { name: cookieName, value: cookieValue };
    break;
  }
}

if (!selectedCookie) {
  selectedCookie = { name: 'generated_uuid', value: generateRandomUUID() };
}

const channelCustomerIdentifier = encodeURIComponent(selectedCookie.value);

function generateRandomUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

console.log(__cim);

const params = new URLSearchParams();
params.append('widgetIdentifier', encodeURIComponent(widgetIdentifier));
params.append('serviceIdentifier', encodeURIComponent(serviceIdentifier));
params.append('channelCustomerIdentifier', channelCustomerIdentifier);

const URL = `${customerWidgetUrl}/#/widget?${params.toString()}`;
console.log('web widget iframe URL:', URL);

var parentSection = document.createElement('div');
parentSection.setAttribute('id', 'init_widget_main');
parentSection.style.border = '0';
parentSection.style.float = 'right';
parentSection.style.position = 'fixed';
parentSection.style.bottom = '0';
parentSection.style.right = '0';
parentSection.style.width = '355px';
parentSection.style.height = '665px';
parentSection.style.background = 'transparent';
parentSection.style.maxWidth = '100%';
parentSection.style.maxHeight = 'calc(100% - 0px)';
parentSection.style.minHeight = '0px';
parentSection.style.minWidth = '0px';
parentSection.style.zIndex = '9999';

var chatIframe = document.createElement('iframe');
chatIframe.setAttribute('id', 'init_widget');
chatIframe.setAttribute('width', '100%');
chatIframe.setAttribute('height', '100%');
chatIframe.setAttribute('src', URL);
chatIframe.setAttribute('allow', 'camera *;microphone *;autoplay *');
chatIframe.setAttribute('allowusermedia', 'camera *;microphone *');
chatIframe.style.border = '0';
chatIframe.style.float = 'right';
chatIframe.style.position = 'absolute';
chatIframe.style.bottom = '0';
chatIframe.style.right = '0';
chatIframe.style.minHeight = '0px';
chatIframe.style.minWidth = '0px';
chatIframe.style.background = 'transparent';
document.body.appendChild(parentSection);
parentSection.appendChild(chatIframe);
