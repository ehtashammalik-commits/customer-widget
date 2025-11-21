const { customerWidgetUrl, serviceIdentifier, widgetIdentifier, Source } = __cim;
const priorityCookies = ['mtc_id', '_ga']; // Add any other cookies you want to prioritize
var currentWindowWidth = window.innerWidth;
window.dataLayer = window.dataLayer || [];
function getCookieValue(cookieName) {
  const cookies = document.cookie.split('; ');
  for (const cookie of cookies) {
    const [name, value] = cookie.split('=');
    if (name === cookieName) { return decodeURIComponent(value); }
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

if (!selectedCookie) { selectedCookie = { name: 'generated_uuid', value: getCurrentDateTime() }; }

const channelCustomerIdentifier = encodeURIComponent(selectedCookie.value);
function getCurrentDateTime() { return new Date().getTime(); }

const params = new URLSearchParams();
params.append('widgetIdentifier', encodeURIComponent(widgetIdentifier));
params.append('serviceIdentifier', encodeURIComponent(serviceIdentifier));
params.append('channelCustomerIdentifier', channelCustomerIdentifier);

params.append('Source', Source);
if (Source == 'UApp') {
  params.append('msisdn', __cim.msisdn);
}

const EF_WIDGET_URL = `${customerWidgetUrl}/#/widget?${params.toString()}`;
var parentSection = document.createElement('div');
parentSection.setAttribute('id', 'init_widget_main');
parentSection.style.border = '0';
parentSection.style.float = 'right';
parentSection.style.position = 'fixed';
parentSection.style.bottom = '10px';
parentSection.style.maxHeight = 'calc(100vh - 10px)';
parentSection.style.right = '15px';
// parentSection.style.width = '355px';
// parentSection.style.height = '665px';
parentSection.style.width = '100px';
parentSection.style.height = '80px';
parentSection.style.background = 'transparent';
parentSection.style.maxWidth = '100%';
parentSection.style.minHeight = '0px';
parentSection.style.minWidth = '0px';
parentSection.style.zIndex = '9999';

var chatIframe = document.createElement('iframe');
chatIframe.setAttribute('id', 'init_widget');
chatIframe.setAttribute('width', '100%');
chatIframe.setAttribute('height', '100%');
chatIframe.setAttribute('src', EF_WIDGET_URL);
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


function browserInfoDataToIframe() {
  const data = __cim;
  // console.log('__cim variable data response in init widget :', data);
  chatIframe.contentWindow.postMessage({
    type: 'browserInfoData',
    data: data
  }, getOrigin(customerWidgetUrl)); // Use getOrigin instead of URL constructor
}

// Send sessionStorage data once the iframe is loaded
chatIframe.onload = function () {
  browserInfoDataToIframe();
};

// Function to extract origin from URL
function getOrigin(url) {
  const link = document.createElement('a');
  link.href = url;
  return link.origin;
}

window.addEventListener('message', (event) => {
  console.log('Received Message for GTM Event <==', event);
  if (event.data.type === 'gtmDataLayer') {
    const dataLayerObj = {
      event: event.data.type,
      data: event.data.data
    }
    window.dataLayer.push(dataLayerObj);
    console.log('Received Message for GTM', event.data.data);
    return;
  }

  // if (`${event.origin}/customer-widget` !== __cim.customerWidgetUrl) {
  //   // Ignore messages from unknown origins
  //   return;
  // }
  console.log("message call ", event.data)
  if (event.data.state == 'icon-view') {
    parentSection.style.width = '100px';
    parentSection.style.height = '80px';
  }
  if (event.data.state == 'wraper-view') {
    parentSection.style.width = '200px';
    parentSection.style.height = '210px';
  }
  if (event.data.state == 'form-view') {
    if (Source == 'UApp') {
      parentSection.style.width = '100%';
      parentSection.style.height = '100%';
    }
    else {
      parentSection.style.width = (currentWindowWidth > 440) ? '360px' : 'calc(100% - 5vw)';
      parentSection.style.height = '620px';
    }
  }
}, false);
