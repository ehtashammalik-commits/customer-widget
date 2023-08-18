// var init_widget_url = __cim.initWidgetUrl;
var customer_widget_url = __cim.customerWidgetUrl;
var service_identifier = encodeURIComponent(__cim.serviceIdentifier);
var widget_identifier = encodeURIComponent(__cim.widgetIdentifier);

function getCookieValue(cookieName) {
    var cookies = document.cookie.split('; ');
    for (var i = 0; i < cookies.length; i++) {
        var cookie = cookies[i];
        var parts = cookie.split('=');
        if (parts[0] === cookieName) {
            return decodeURIComponent(parts[1]);
        }
    }
    return null;
}

var priorityCookies = ['mtc_id', '_ga']; // Add any other cookies you want to prioritize
var selectedCookie = null;

for (var i = 0; i < priorityCookies.length; i++) {
    var cookieName = priorityCookies[i];
    var cookieValue = getCookieValue(cookieName);
    if (cookieValue) {
        selectedCookie = { name: cookieName, value: cookieValue };
        break;
    }
}

if (!selectedCookie) {
    // If none of the priority cookies exist, generate a random UUID
    selectedCookie = { name: 'generated_uuid', value: generateRandomUUID() };
}

var channel_customer_identifier = encodeURIComponent(selectedCookie.value);

function generateRandomUUID() {
    // This is a simple UUID generation function, you might want to use a more robust method in a production environment
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0;
        var v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// var channel_customer_identifier = encodeURIComponent(('; ' + document.cookie).split(`; mtc_id=`).pop().split(';')[0]);

console.log(__cim);

const params = new URLSearchParams();
// params.append('customerWidgetUrl', customer_widget_url);
params.append('widgetIdentifier', widget_identifier);
params.append('serviceIdentifier', service_identifier);
params.append('channelCustomerIdentifier', channel_customer_identifier);

const URL = `${customer_widget_url}?${params.toString()}`;
console.log('web widget iframe URL: ', URL);

var parentSection = document.createElement('div');
parentSection.setAttribute('id', 'init_widget_main');
parentSection.style.border = '0';
parentSection.style.float = 'right';
parentSection.style.position = 'fixed';
parentSection.style.bottom = '0';
parentSection.style.right = '0';
parentSection.style.width = '350px';
parentSection.style.height = '665px';
parentSection.style.background = 'rgba(0,0,0,.00)';
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
chatIframe.style.border = '0';
chatIframe.style.float = 'right';
chatIframe.style.position = 'absolute';
chatIframe.style.bottom = '0';
chatIframe.style.right = '0';
chatIframe.style.minHeight = '0px';
chatIframe.style.minWidth = '0px';
chatIframe.style.background = 'rgba(0,0,0,.00)';
document.body.appendChild(parentSection);
parentSection.appendChild(chatIframe);
