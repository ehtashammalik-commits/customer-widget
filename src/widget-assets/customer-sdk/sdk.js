/**
 * Web Widget SDK Function for Chat Starts
 */
let socket = {};
/**
 * Widget Configurations Fetching Function
 * @param {*} ccmUrl
 * @param {*} widgetIdentifier
 * @param {*} callback
 */


function authorizedFetch(url, options = {}) {
  const token = localStorage.getItem('jwt_token');

  const headers = {
    ...(options.headers || {}),
  };

  // Only add Authorization if token exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return fetch(url, {
    ...options,
    headers,
  });
}


function widgetConfigs(ccmUrl, widgetIdentifier, callback) {
  authorizedFetch(`${ccmUrl}/widget-configs/${widgetIdentifier}`)
    .then(response => response.json())
    .then((data) => {
      callback(data);
    });
}

function getFileURL(fileURL, callback) {
  authorizedFetch(fileURL)
    .then(response => {
      return response.blob();  // <-- Important: get Blob, not JSON
    })
    .then(blob => {
      const blobURL = URL.createObjectURL(blob);  // <-- Convert to local blob URL
      callback(blobURL);
    })
    .catch(err => {
      console.error('Error fetching file:', err);
      callback(null);  // or handle gracefully
    });
}
/**
 * Get Pre Chat Form
 * @param {*} formUrl
 * @param {*} formId
 * @param {*} callback
 */
function getPreChatForm(formUrl, formId, callback) {
  authorizedFetch(`${formUrl}/forms/${formId}`)
    .then(response => response.json())
    .then((data) => {
      callback(data);
    });
}
/**
 * @param {*} formUrl
 * @param {*} callback
 */
function formValidation(formUrl, callback) {
  authorizedFetch(`${formUrl}/formValidation`)
    .then(response => response.json())
    .then((data) => {
      callback(data);
    });
}
/**
 * Function to Establish Connection
 * Two Parameters
 * 1- Customer Data
 * 2- Call Function of socketEventListeners()
 * @param {*} serviceIdentifier
 * @param {*} channelCustomerIdentifier
 * @param {*} callback
 */
function establishConnection(socket_url, serviceIdentifier, channelCustomerIdentifier, callback) {
  try {
    if (this.socket !== undefined && this.socket.connected) {
      console.log('Resuming Existing Connection');
      eventListeners((data) => {
        callback(data);
      });
    } else {
      if (socket_url !== '') {
        console.log('Starting New Connection');
        let origin = new URL(socket_url).origin;
        let path = new URL(socket_url).pathname;
        this.socket = io(origin, {
          path: path == '/' ? '' : path + '/socket.io',
          auth: {
            serviceIdentifier: serviceIdentifier,
            channelCustomerIdentifier: channelCustomerIdentifier
          }
        });
        eventListeners((data) => {
          callback(data);
        });
      }
    }
  } catch (error) {
    callback(error);
  }
}
/**
 *  Socket EventListener Function
 *  1- Socket Connection Event
 *  2- Socket Discount Event
 *  3- Socket Connection Error Event
 *  4- Socket Message Arrived Event
 *  5- Socket End Conversation Event
 *  6- Socket Error
 *  7- Channel Session Started Event
 *  @param {*} callback
 */
function eventListeners(callback) {
  this.socket.on('connect', () => {
    if (this.socket.id != undefined) {
      console.log(`you are connected with socket:`, this.socket);
        callback({ type: "SOCKET_CONNECTED", data: this.socket });
    }
  });
  this.socket.on('TOKEN_GENERATED', (data) => {
    if (this.socket.id != undefined) {
      localStorage.setItem('jwt_token', data);
      callback({ type: "TOKEN_GENERATED", data: this.socket });
    }
  });
  this.socket.on('CHANNEL_SESSION_STARTED', (data) => {
    console.log(`Channel Session Started Data: `, data);
    const gtmObject = {
      type: 'gtmDataLayer',
      data: {
        type: 'CHAT STARTED',
        data: {
          customerIdentifier: data.header.channelData.channelCustomerIdentifier,
          serviceIdentifier: data.header.channelData.serviceIdentifier,
        }
      }
    }
    window.parent.postMessage(gtmObject, '*');
    callback({ type: "CHANNEL_SESSION_STARTED", data: data });
  });
  this.socket.on('MESSAGE_RECEIVED', (message) => {
    console.log(`MESSAGE_RECEIVED received: `, message);
    callback({ type: "MESSAGE_RECEIVED", data: message });
  });

  this.socket.on("CHANNEL_SESSION_ENDED", (reason) => {
    console.log("CHANNEL_SESSION_ENDED")
    callback({ type: "CHANNEL_SESSION_ENDED", data: reason })
  })
  this.socket.on("CHANNEL_SESSION_EXPIRED", (reason) => {
    console.log("CHANNEL_SESSION_EXPIRED")
    callback({ type: "CHANNEL_SESSION_EXPIRED", data: reason })
  })
  this.socket.on('disconnect', (reason) => {
    console.error(`Connection lost with the server: `, reason);
    // const gtmObject = {
    //   type: 'gtmDataLayer',
    //   data: {
    //     type: 'CHAT ENDED',
    //     data: reason
    //   }
    // }
    // window.parent.postMessage(gtmObject, '*');
    callback({ type: "SOCKET_DISCONNECTED", data: reason });
  });

  this.socket.on('SESSION_REPLACED', (data) => {
    console.log(`SESSION_REPLACED received: `, data);
    callback({ type: "SESSION_REPLACED", data: data });
  });

  this.socket.on('CONVERSATION_RESUMED', (data) => {
    console.log(`CONVERSATION_RESUMED received: `, data);
    callback({ type: "CONVERSATION_RESUMED", data: data });
  });

  this.socket.on('connect_error', (error) => {
    console.log(`unable to establish connection with the server: `, error.message);
    callback({ type: "CONNECT_ERROR", data: error });
  });
  this.socket.on('CHAT_ENDED', (data) => {
    console.log(`CHAT_ENDED received: `, data);
    callback({ type: "CHAT_ENDED", data: data });
    this.socket.disconnect();
  });
  this.socket.on('ERRORS', (data) => {
    console.error(`ERRORS received: `, data);
    callback({ type: "ERRORS", data: data });
  });
}
/**
 * Chat Request Function with customer data
 * @param {*} data
 */
function chatRequest(data) {
  try {
    if (data) {
      let additionalAttributesData = [];
      let webChannelDataObj = {
        key: 'WebChannelData',
        type: 'WebChannelData',
        value: {
          browserDeviceInfo: data.data.browserDeviceInfo,
          queue: data.data.queue,
          locale: data.data.locale,
          formData: data.data.formData
        }
      };
      additionalAttributesData.push(webChannelDataObj);
      let obj = {
        channelCustomerIdentifier: data.data.channelCustomerIdentifier,
        serviceIdentifier: data.data.serviceIdentifier,
        additionalAttributes: additionalAttributesData
      };
      // const gtmObject = {
      //   type: 'gtmDataLayer',
      //   data: {
      //     type: 'CHAT REQUESTED',
      //     data: {
      //       customerIdentifier: data.data.channelCustomerIdentifier,
      //       serviceIdentifier: data.data.serviceIdentifier,
      //     }
      //   }
      // }
      // window.parent.postMessage(gtmObject, '*');
      this.socket.emit('CHAT_REQUESTED', obj);
      console.log(`SEND CHAT_REQUESTED DATA:`, obj);
    }
  } catch (error) {
    throw error;
  }
}
/**
 * Chat Request Function with customer data
 * @param {*} data
 */
function voiceRequest(data) {
  try {
    if (data) {
      let additionalAttributesData = [];
      let webChannelDataObj = {
        key: 'WebChannelData',
        type: 'WebChannelData',
        value: {
          browserDeviceInfo: data.data.browserDeviceInfo,
          queue: data.data.queue,
          locale: data.data.locale,
          formData: data.data.formData
        }
      };
      additionalAttributesData.push(webChannelDataObj);
      let obj = {
        channelCustomerIdentifier: data.data.channelCustomerIdentifier,
        serviceIdentifier: data.data.serviceIdentifier,
        additionalAttributes: additionalAttributesData
      };
      this.socket.emit('VOICE_REQUESTED', obj);
      console.log(`SEND VOICE_REQUESTED DATA:`, obj);
    }
  } catch (error) {
    throw error;
  }
}
/**
 * Send Message Socket Event with Message Payload in parameter
 * @param {*} data
 */
function sendChatMessage(data) {
  data.timestamp = '';
  this.socket.emit('MESSAGE_RECEIVED', data, (res) => {
    console.log('[sendChatMessage] ', res);
    if (res.code !== 200) {
      console.log("message not sent");
    }
  })
}
/**
 * End Chat Socket Event with Customer Data in the parameter
 * @param {*} data
 */
function chatEnd(data) {
  // Chat Disconnection Socket Event
  this.socket.emit('CHAT_ENDED', data);
}
/**
 * @param {*} data
 */
function resumeChat(data, callback) {
  const gtmObject = {
    type: 'gtmDataLayer',
    data: {
      type: 'BROWSER NAVIGATED',
      data: {
        customerIdentifier: data.channelCustomerIdentifier,
        serviceIdentifier: data.serviceIdentifier,
      }
    }
  }
  console.log(data, 'Resume Chat Before Emit Console.log');
  this.socket.emit("CHAT_RESUMED", data, (res) => {
    if (res) {
      console.log(res, 'resume chat response in sdk.');
      if (res.isChatAvailable) {
        window.parent.postMessage(gtmObject, '*');
      }
      callback(res);
    }
  });
}
/**
 * @param {*} data
 */
function sendJoinConversation(data) {
  this.socket.emit("joinConversation", data, (res) => {
    console.log("[sendJoinConversation] ", data);
    return res;
  });
}
/**
 * @param {*} customer
 */
function getInitChat(customer) {
  console.log("[initChat] customer ", customer);

  const requestOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(customer)
  };

  authorizedFetch(`${config.ServerUrl}/api/customer/init`, requestOptions)
    .then(response => response.json())
    .then(data => {
      onInitChat(data);
      isConversationActive = true;
    })
    .catch(error => {
      console.error(`[initChat] `, error);
      onInitChat({ error: error });
    });
}
/**
 * File Upload to File Engine Function
 * @param {*} formData
 * @param {*} callback
 */
function uploadToFileEngine(fileServerUrl, formData, callback) {
  authorizedFetch(`${fileServerUrl}/api/uploadFileStream`, {
    method: 'POST',
    body: formData
  }).then(async (response) => {


    console.log('response from sdk ', response)
    if (!response.ok) {
      const errorText = await response.text();


      if (response.status === 413) {
        callback({
          isFileInvalid: true,
          errorMessage: "File too large. Please upload a smaller file.",
          statusCode: response.status,
        });
        // Prevent further .then from running
        throw new UploadError(errorText, response.status);
      }
      throw new UploadError(errorText, response.status);
    }
    return response.json();
  })
    .then((result) => {
      console.log('Success: ', result);
      callback(result);
    })
    .catch(async (error) => {
      let errorDetails = {
        message: error.message || "Unknown error occurred.",
        statusCode: error.statusCode || null,
      };

      // try {
      //   errorDetails = JSON.parse(error.message);
      // } catch (e) {
      //   errorDetails.message = "Error parsing JSON response.";
      // }

      if (error.result && error.result.isInfected) {
        callback({
          errorDetails,
          isFileInvalid: true,
          errorMessage: "The file could not be uploaded due to security concerns. Please try a different file.",
          statusCode: errorDetails.statusCode,
        });
      } else {
        callback({
          errorDetails,
          isFileInvalid: true,
          errorMessage: errorDetails.message,
          statusCode: errorDetails.statusCode,
        });
      }
    });
}

class UploadError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'UploadError';
  }
}
/**
 * Set Conversation Data Api
 */
async function setConversationData(url, conversationId, data) {
  const response = await authorizedFetch(`${url}/${conversationId}/conversation-data`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  return response;
}
/**
 * Set Conversation Data Api By Customer Channel Identifier
 */
async function setConversationDataByCustomerIdentifier(url, channelIdentifier, data, callback) {
  try {
    const response = await authorizedFetch(`${url}/${channelIdentifier}/conversation-data-by-identifier`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (response.status === 403) {
      console.error('Forbidden: The server returned a 403 Forbidden response.');
      callback(response);
    }

    if (!response.ok) {
      console.error('Network response was not ok');
      callback(response);
    }

    const result = await response.json();
    console.log('Success:', result);
    callback(result);
  } catch (error) {
    console.error('Error:', error);
    callback(error); // Re-throw the error for the caller to handle
  }
}
/**
 * Push form data as an activity
 */
async function pushFormDataAsActivity(url, payload, callback) {
  try {
    const response = await authorizedFetch(`${url}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const responseBody = await response.text();
    let jsonResponse;

    try {
      jsonResponse = JSON.parse(responseBody);
    } catch (e) {
      jsonResponse = responseBody;
    }

    if (!response.ok) {
      callback({
        error: true,
        status: response.status,
        message: jsonResponse?.message || 'Request failed.'
      });
      return;
    }

    callback(jsonResponse);
  } catch (error) {
    callback({
      error: true,
      message: error.message || 'An unexpected error occurred.'
    });
  }
}

/**
* Get Conversation Data Api By Customer Identifier
*/
async function getConversationDataByCustomerIdentifier(url, channelIdentifier, callback) {
  try {
    const response = await authorizedFetch(`${url}/get/${channelIdentifier}`, {
      method: 'GET', // Specify the HTTP method as GET
      headers: {
        'Content-Type': 'application/json' // Set appropriate headers if needed
      }
    });

    if (response.status === 403) {
      console.error('Forbidden: The server returned a 403 Forbidden response.');
      callback(response);
    } else if (!response.ok) {
      console.error(`Failed to authorizedFetch data from ${url}/get/${channelIdentifier}: ${response.status} ${response.statusText}`);
      callback(response);
    } else {
      const data = await response.json();
      callback(data);
    }
  } catch (error) {
    console.error('Error:', error);
    callback(error); // Re-throw the error for the caller to handle
  }
}
/**
* Get Conversation Data Api
*/
async function getConversationData(url, conversationId) {
  const response = await authorizedFetch(`${url}/${conversationId}/conversation-data`);
  if (!response.ok) {
    throw new Error(`Failed to fetch data from ${url}/${conversationId}/conversation-data: ${response.status} ${response.statusText}`);
  }
  const data = await response.json();
  return data;
}
/**
 * Authenticator Request for Secure Link
 */
function authenticateRequest(authenticatorUrl, authData, callback) {
  console.log('authenticateRequest: in sdk function:', JSON.stringify(authData));
  authorizedFetch(`${authenticatorUrl}/verifySecureLink`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(authData)
  })
    .then(async (response) => {
      const contentType = response.headers.get('content-type');

      if (!response.ok) {
        const errorData = contentType?.includes('application/json')
          ? await response.json()
          : await response.text();

        const errorMessage =
          response.status === 400
            ? '400 Bad Request'
            : response.status === 500
              ? '500 Internal Server Error'
              : 'An error occurred';

        callback({
          error: true,
          status: response.status,
          message: errorMessage,
          data: errorData,
        });
        throw new Error(`${errorMessage}: ${JSON.stringify(errorData)}`);
      }
      // Parse JSON response if available, fallback to text
      return contentType?.includes('application/json') ? response.json() : response.text();
    })
    .then((result) => {

      // Ensure `agentExtension` and `customerId` are present and not empty
      if (result.agentExtension && result.customerId) {
        callback({
          error: false,
          status: 200,
          data: result,
          message: 'Authentication Successful!',
        });
      } else {
        callback({
          error: true,
          status: 400,
          data: result,
          message: 'Invalid response: Missing required fields (agentExtension or customerId).',
        });
      }
    })
    .catch((error) => {
      console.error('Authentication API Error:', error);
      callback({
        error: true,
        status: 500,
        message: 'An unexpected error occurred. Please try again later.',
      });
    });
}
/**
 * IP Data Request
 */
function getBrowserInfo(apiKey, callback) {
  // const apiKey = '5c8c5a26decc9b30da07abf360b73256faa5b00c59b32689c9860a84';
  try {
    authorizedFetch(`https://api.ipdata.co?api-key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    }).then(response => response.json())
      .then(data => {
        // Handle the API response here
        console.log("ipData API response:", data);
        callback(data);
      })
      .catch(error => {
        // Handle any errors that occur during the API call
        console.error("ipData API Call Error", error);
        callback(error);
      })

  } catch (error) {
    console.error('API Function Error', error);
    callback(error);
  }
}
/**
 * Callback Request To ECM
 * @param {*} payload
 * @param {*} url
 */
function callbackRequest(url, payload, callback) {
  try {

    // Make an API Call
    authorizedFetch(`${url}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })
      .then(response => response.json())
      .then(data => {
        // Handle the API response here
        console.log("API response:", data);
        callback(data);
      })
      .catch(error => {
        // Handle any errors that occur during the API call
        console.error("API Call Error", error);
        callback(error);
      })
  } catch (error) {
    console.error('API Function Error', error);
    callback(error);
  }
}

function getCalendarId(url, serviceIdentifier, callback) {
  authorizedFetch(`${url}/channels/service-identifier/${serviceIdentifier}`)
    .then(response => response.json())
    .then((data) => {
      callback(data);
    });
}

function getCalendarEvents(calendarId, url, startTime, endTime, callback) {
  authorizedFetch(`${url}/calendars/events?&calendarId=${calendarId}&startTime=${startTime}&endTime=${endTime}`)
    .then(response => response.json())
    .then((data) => {
      callback(data);
    });
}

/**
 * Webhook Notifications Functions
 * @param {*} data
 */

function webhookNotifications(webhookUrl, additionalData, data) {
  // Constructing the message dynamically based on the keys and values in the data object
  let imageUrl = modifyUrlPath(additionalData.agent_url, additionalData.icon);

  let formattedText = '';
  for (const [key, value] of Object.entries(data)) {
    formattedText += `${capitalizeFirstLetter(key)}: ${value ? value : 'N/A'}\n`;
  }
  let newAgentUrl = modifyUrlPath(additionalData.agent_url, '/unified-agent/');
  formattedText += `To respond: <a href='${newAgentUrl}'>Click here</a>\n`;

  let messageObj = {
    "cards": [
      {
        "header": {
          "title": `${data.first_name ? data.first_name : 'Customer'} started a new chat`,
          "imageUrl": imageUrl,
          "imageStyle": "IMAGE"
        },
        "sections": [
          {
            "widgets": [
              {
                "textParagraph": {
                  "text": formattedText
                }
              }
            ]
          }
        ]
      }
    ]
  };
  fetch(`${webhookUrl}`, {
    method: 'POST',
    body: JSON.stringify(messageObj), // Formatting as a JSON object for Google Workspace webhook
    headers: {
      "Content-Type": "application/json; charset=UTF-8"
    }
  })
    .then((response) => {
      if (!response.ok) {
        return response.json().then(err => Promise.reject(err));
      }
      return response.json();
    })
    .then((result) => {
      console.log('Success: ', result);
    })
    .catch((error) => {
      console.error('Error: ', error);
    });
}

// Helper function to capitalize the first letter of each key
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1).replace(/_/g, ' ');
}

function modifyUrlPath(originalUrl, newPath) {
  try {
    const url = new URL(originalUrl);
    url.pathname = newPath;
    return url.toString();
  } catch (error) {
    console.error("Invalid URL:", error);
    return null;
  }
}

/**
 * Web Widget SDK Functions for Chat Ends
 */
/************************************************************************************************************************* */
/************************************************************************************************************************* */
/**
 * WebRtc Call Wrapper Functions for SIP.JS Starts
 * FS_JS Version 3.7
 * Sip.js Version 0.21.2
 */

// Initialize an object to keep track of function locks

const functionLocks = {};
var canCallFunction = true;
var callendDialogId;
var calls = [];
var consultSessioin;
var userAgent;
var registerer;
var again_register = false;
var sessionall = null;
var remotesession = null;
var loginid = null;
var agentInfo = false;
var callbackFunction = null;
var remote_stream;
var local_stream;
var call_variable_array = {};
var dialogStatedata = null;
var invitedata = null;
var outboundDialingdata = null;
var consultCalldata = null;

var sipconfig = {};
var mySessionDescriptionHandlerFactory = null

let globalEventCallback = null
let pendingEventNotification = null
let isPendingEventNotification = false;
let dummyAudioErrorReason = null
let dummyVideoErrorReason = null


// var remoteVideo = document.getElementById('remoteVideo');
// var localVideo = document.getElementById('localVideo');


// Number of times to attempt reconnection before giving up
// const reconnectionAttempts = 10;
// // Number of seconds to wait between reconnection attempts
// const reconnectionDelay = 5;
// // Used to guard against overlapping reconnection attempts
// let attemptingReconnection = false;
// // If false, reconnection attempts will be discontinued or otherwise prevented
// let shouldBeConnected = true;

const dialogStatedata1 = {
  "event": "dialogState",
  "response": {
    "loginId": null,
    "dialog": {
      "id": null,
      "fromAddress": null,
      "dialedNumber": null,
      "customerNumber": null,
      "dnis": null,
      "serviceIdentifier": null,
      "callType": null,
      "ani": null,
      "wrapUpReason": null,
      "wrapUpItems": null,
      "callEndReason": null,
      "queueName": null,
      "queueType": null,
      "associatedDialogUri": null,
      "secondaryId": null,
      "participants": [
        {
          "actions": {
            "action": [
              "TRANSFER_SST",
              "HOLD",
              "SEND_DTMF",
              "DROP"
            ]
          },
          "mediaAddress": null,
          "mediaAddressType": "SIP.js/0.21.2-CTI/Expertflow",
          "startTime": null,
          "state": null,
          "stateCause": null,
          "stateChangeTime": null,
          'mute': false

        },
      ],
      "callVariables": {
        "CallVariable": []
      },
      "state": null,
      "isCallAlreadyActive": false,
      "callbackNumber": null,
      "outboundClassification": null,
      "scheduledCallbackInfo": null,
      "isCallEnded": 0,
      "eventType": "PUT",
      "mediaType": null,
      "channelType": "WEB_RTC"

    }
  }
}
const outboundDialingdata12 = {
  "event": "outboundDialing",
  "response": {
    "loginId": null,
    "dialog": {
      "id": null,
      "ani": null,
      "customerNumber": null,
      "associatedDialogUri": null,
      "callbackNumber": null,
      "outboundClassification": null,
      "scheduledCallbackInfo": null,
      "isCallEnded": 0,
      "eventType": "PUT",
      "callType": null,
      "queueName": null,
      "queueType": null,
      "dialedNumber": null,
      "dnis": null,
      "serviceIdentifier": null,
      "secondaryId": null,
      "state": "INITIATING",
      "isCallAlreadyActive": false,
      "wrapUpReason": null,
      "wrapUpItems": null,
      "callEndReason": null,
      "fromAddress": null,
      "callVariables": {
        "CallVariable": []
      },
      "participants": [
        {
          "actions": {
            "action": [
              "TRANSFER_SST",
              "HOLD",
              "SEND_DTMF",
              "DROP"
            ]
          },
          "mediaAddress": null,
          "mediaAddressType": "SIP.js/0.21.2-CTI/Expertflow",
          "startTime": null,
          "state": null,
          "stateCause": null,
          "stateChangeTime": null,
          'mute': false
        },
      ],
      "mediaType": null,
      "channelType": "WEB_RTC"
    }
  }
}
const invitedata1 = {
  "event": "newInboundCall",
  "response": {
    "loginId": null,
    "dialog": {
      "id": null,
      "ani": null,
      "customerNumber": null,
      "associatedDialogUri": null,
      "callbackNumber": null,
      "outboundClassification": null,
      "scheduledCallbackInfo": null,
      "isCallEnded": 0,
      "eventType": "PUT",
      "callType": null,
      "queueName": null,
      "queueType": null,
      "dialedNumber": null,
      "dnis": null,
      "serviceIdentifier": null,
      "secondaryId": null,
      "state": "ALERTING",
      "isCallAlreadyActive": false,
      "wrapUpReason": null,
      "wrapUpItems": null,
      "callEndReason": null,
      "fromAddress": null,
      "callVariables": {
        "CallVariable": []
      },
      "participants": [
        {
          "actions": {
            "action": [
              "ANSWER",
            ]
          },
          "mediaAddress": null,
          "mediaAddressType": "SIP.js/0.21.2-CTI/Expertflow",
          "startTime": null,
          "state": null,
          "stateCause": null,
          "stateChangeTime": null,
          'mute': false
        },
      ],
      "mediaType": null,
      "channelType": "WEB_RTC"
    }
  }
}

/**
 * Custom Media Stream Factory
 * This factory function is used by the UserAgent to fetch audio, video, or screen sharing streams from the browser.
 *
 * @param {Object} constraints - The media constraints specifying what kind of media stream is required.
 * @param {Object} sessionDescriptionHandler - The session description handler for the media session.
 * @returns {Promise<MediaStream>} - A promise that resolves to the requested media stream.
 */
const myMediaStreamFactory = async (constraints, sessionDescriptionHandler) => {
  // Set default values for constraints
  constraints.audio = constraints.audio ?? true;
  constraints.video = constraints.video ?? false;

  // Validate required constraints
  if (!constraints.action) {
    return handleConstraintsError("Constraint action is not defined.");
  }
  if (!constraints.mediaType) {
    return handleConstraintsError("Constraint mediaType is not defined.");
  }

  let mediaStream = new MediaStream();

  // Handle different actions and media types
  switch (constraints.action) {
    case "CALL_INITIATE":
      mediaStream = await handleCallInitiate(constraints);
      break;

    case "CALL_ANSWER":
      mediaStream = await handleCallAnswer(constraints);
      break;

    default:
      console.error("==>> SIPJS CONSOLE => Unknown action type.");
      return Promise.reject(new Error("Unknown action type."));
  }

  return Promise.resolve(mediaStream);
};

/**
 * Event object for media conversion
 * This event is received when the UserAgent turns video/screen share stream on or off.
 */
let mediaStreamUpdate = {
  "event": "mediaStreamUpdate",
  "status": null,
  "loginId": "",
  "dialog": {
    "id": null,
    "eventRequest": null,
    "stream": null,
    "streamStatus": null,
    "errorReason": null,
    "timeStamp": null
  }
}

/**
 * Event object for media permission status
 * This event is received when the user chnage the media permission status.
 */
let mediaPermissionStatus = {
  "event": "mediaPermissionStatus",
  "loginId": "",
  "dialog": {
    "errorReason": "",
    "permissionType": "microphone",  // microphone / video
    "permissionStatus": "granted",   // granted / denied
    "timeStamp": null
  }
}



let inviteDelegate = {
  onAck(ack) {
    console.log("==>> SIPJS CONSOLE => onAck MESSAGE : ", ack)
  },
  onBye(bye) {
    console.log("==>> SIPJS CONSOLE => onBye MESSAGE : ", bye)

    var _session = calls[0]
    if (_session && _session.event && _session.response && _session.response.dialog.callEndReason != "EXTERNAL_ATTENDED_TRANSFER") {
      if (bye.incomingByeRequest.message.headers["X-Call-Dropped-Custom-Reason"] != undefined) {
        _session.response.dialog.callEndReason = bye.incomingByeRequest.message.headers["X-Call-Dropped-Custom-Reason"][0]['raw'];
      }
      else {
        const match = bye.incomingByeRequest.message.data.match(/text="([^"]+)"/);
        if (match && match[1]) {
          _session.response.dialog.callEndReason = match[1];
        }
      }
    }
  },
}

let registrationDelegate = {
  onAccept(response) {
    console.log("==>> SIPJS CONSOLE => User Ext Registration onAccept ->", response)
  },
  onProgress(response) {
    console.log("==>> SIPJS CONSOLE => User Ext Registration onProgress ->", response)
  },
  onRedirect(response) {
    console.log("==>> SIPJS CONSOLE => User Ext Registration onRedirect ->", response)
  },
  onReject(response) {
    console.log("==>> SIPJS CONSOLE => User Ext Registration onReject ->", response)
    registrationFailed(response)
  },
  onTrying(response) {
    console.log("==>> SIPJS CONSOLE => User Ext Registration onTrying ->", response)
  }

}

/**
 * Function to Handle Browser Media Permissions
 * This function checks the status of microphone and camera permissions and sets up event listeners for changes.
 */

const Custompermissions = Promise.all([
  navigator.permissions.query({ name: 'microphone' }),
  navigator.permissions.query({ name: 'camera' })
]).then(async (permissions) => {
  const [microphonePermission, cameraPermission] = permissions;

  // Function to Replace Audio tracks
  const replaceAudioTrackInCalls = async (action) => {
    if (calls?.length > 0) {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      for (const call of calls) {
        if (call?.session?.state === SIP.SessionState.Established) {
          const senders = call.session.sessionDescriptionHandler.peerConnection.getSenders();
          senders.forEach(async (sender) => {
            if (sender?.track?.kind === "audio") {
              console.log("==>> SIPJS CONSOLE => Track Found, replacing it")
              await sender.replaceTrack(stream.getAudioTracks()[0]);

              if ((call.response.dialog.participants) && action == "videoPermissionChange") {
                console.log("==>> SIPJS CONSOLE => Mute the Track")
                if (typeof globalEventCallback === "function") {
                  call.response.dialog.participants[0].mute ? phone_mute(globalEventCallback, call.response.dialog.id) : phone_unmute(globalEventCallback, call.response.dialog.id);
                }
              }
              if (action == "audioPermissionChange") {
                console.log("==>> SIPJS CONSOLE => Mute the Track")
                if (typeof globalEventCallback === "function") phone_mute(globalEventCallback, call.response.dialog.id);
              }
            }
          });
        }
      }
    }
  };

  // Handler for microphone permission changes
  microphonePermission.onchange = async (e) => {
    console.log("==>> SIPJS CONSOLE => AUDIO PERMISSION CHANGED -> ", e);
    if (e.target.state === "granted") {
      //If Permission is Granted then replace the Track but mute them the Track to make Video & Camera Symmetric

      if (calls?.length > 0) {
        for (const call of calls) {
          if (call?.session?.state === SIP.SessionState.Established) {
            let _mediaPermissionStatus = createMediaPermissionStatusUpdateEvent(call.response.dialog.id, "microphone", "granted", null);
            globalEventCallback(_mediaPermissionStatus);
          }
        }
      }
      await replaceAudioTrackInCalls("audioPermissionChange");
    }
    // else if (e.target.state === 'denied' && calls?.[0]?.session?.state === SIP.SessionState.Established) {
    else if (e.target.state === 'denied' || e.target.state === 'prompt') {
      console.error("==>> SIPJS CONSOLE => ERROR: Microphone permission denied. Please enable.");
      if (typeof globalEventCallback === "function") {
        error("generalError", loginid, checkErrorReason("Microphone_denied"), globalEventCallback);
        if (calls?.length > 0) {
          for (const call of calls) {
            if (call?.session?.state === SIP.SessionState.Established) {
              let _mediaPermissionStatus = createMediaPermissionStatusUpdateEvent(call.response.dialog.id, "microphone", "denied", checkErrorReason("Microphone_denied"));
              globalEventCallback(_mediaPermissionStatus);
            }
          }
        }
      }
    }
  };

  // Handler for camera permission changes
  cameraPermission.onchange = async (e) => {
    console.log("==>> SIPJS CONSOLE => VIDEO PERMISSION CHANGED -> ", e);
    if (e.target.state === 'granted') {
      //If Permission is Granted then replace the Track but mute them the Track to make Video & Camera Symmetric
      if (typeof globalEventCallback === "function") {
        if (calls?.length > 0) {
          for (const call of calls) {
            if (call?.session?.state === SIP.SessionState.Established) {
              var _mediaPermissionStatus = createMediaPermissionStatusUpdateEvent(call.response.dialog.id, "video", "granted", null);
              globalEventCallback(_mediaPermissionStatus);
            }
          }
        }
      }
    }
    // || e.target.state === 'prompt'
    if (e.target.state === 'denied') {
      console.error("==>> SIPJS CONSOLE => ERROR: Camera permission denied. Please enable.");
      if (typeof globalEventCallback === "function") {
        error("generalError", loginid, checkErrorReason("Camera_denied"), globalEventCallback);
        if (calls?.length > 0) {
          for (const call of calls) {
            if (call?.session?.state === SIP.SessionState.Established) {

              if (call.additionalDetail.localMediaType != "audio") {
                publishMediaStreamUpdateEvent(call.response.dialog.id, call.additionalDetail.localMediaType, "off", globalEventCallback)
              }
              var _mediaPermissionStatus = createMediaPermissionStatusUpdateEvent(call.response.dialog.id, "video", "denied", checkErrorReason("Camera_denied"));
              globalEventCallback(_mediaPermissionStatus);
            }
          }
        }
      }
    }
    if (microphonePermission.state === "granted") {
      // if permission is provided then check current call state, if muted then mute it else dont mute it.
      await replaceAudioTrackInCalls("videoPermissionChange");
    }
  };
});



// For the communication with freeswitch >>>>> Centralized function for all webRTC related stuff.

function postMessages(obj, callback) {
  if (Object.keys(sipconfig).length === 0) sipconfig = obj.parameter.sipConfig;
  switch (obj.action) {
    case 'login':
      // if a callback function has been passed then we add the refereance to the EventEmitter class
      if (typeof obj.parameter.clientCallbackFunction === 'function') {
        if (sipconfig.uriFs !== null && sipconfig.uriFs !== undefined) {
          connect_useragent(
            obj.parameter.extension,
            sipconfig.uriFs,
            sipconfig.extensionPassword,
            sipconfig.wssFs,
            sipconfig.enabledSipLogs,
            obj.parameter.clientCallbackFunction);
          callbackFunction = obj.parameter.clientCallbackFunction;
          globalEventCallback = obj.parameter.clientCallbackFunction;
        } else {
          error("generalerror", obj.parameter.extension, checkErrorReason('Uri_Error'), obj.parameter.clientCallbackFunction);
        }
      }
      break;
    case 'logout':
      loader3(obj.parameter.clientCallbackFunction);
      break;
    case 'makeCall':
      initiate_call(obj.parameter.calledNumber, obj.parameter.Destination_Number, obj.parameter.callType, obj.parameter.authData, obj.parameter.clientCallbackFunction, "OUT", "0000");
      break;
    case 'answerCall':
      respond_call(obj.parameter.clientCallbackFunction, obj.parameter.dialogId, obj.parameter.answerCalltype);
      break;
    case 'releaseCall':
      terminate_call(obj.parameter.dialogId);
      break;
    case 'holdCall':
      phone_hold(obj.parameter.clientCallbackFunction, obj.parameter.dialogId);
      break;
    case 'retrieveCall':
      phone_unhold(obj.parameter.clientCallbackFunction, obj.parameter.dialogId);
      break;
    case 'mute_call':
      phone_mute(obj.parameter.clientCallbackFunction, obj.parameter.dialogId);
      break;
    case 'unmute_call':
      phone_unmute(obj.parameter.clientCallbackFunction, obj.parameter.dialogId);
      break;
    case 'SendDtmf':
      sendDtmf(obj.parameter.message, obj.parameter.dialogId, obj.parameter.clientCallbackFunction);
      break;
    case 'convertCall':
      callConvert(obj.parameter.dialogId, obj.parameter.clientCallbackFunction, obj.parameter.streamType, obj.parameter.streamStatus)
      break
  }
}



/**
 * Establish a SIP connection for the user agent.
 * This function sets up the SIP configuration and initiates the connection process.
 *
 * @param {string} extension - The user's extension number.
 * @param {string} sip_uri - The URI for the SIP server.
 * @param {string} sip_password - The password for the SIP account.
 * @param {string} wssFs - The WebSocket Secure URL for the SIP connection.
 * @param {function} sip_log - A logging flag or function for SIP events.
 * @param {function} callback - A callback function to execute after attempting the connection.
 * @returns {void}
 */
function connect_useragent(extension, sip_uri, sip_password, wssFs, sip_log, callback) {

  var res = lockFunction("connect_useragent", 500); // --- seconds cooldown
  if (!res) return;
  const undefinedParams = checkUndefinedParams(connect_useragent, [extension, sip_uri, sip_password, wssFs, sip_log, callback]);

  if (undefinedParams.length > 0) {
    // console.log(`Error: The following parameter(s) are undefined or null: ${undefinedParams.join(', ')}`);
    error("generalError", extension, `Error: The following parameter(s) are undefined or null or empty: ${undefinedParams.join(', ')}`, callback);
    return;
  }
  const uri = SIP.UserAgent.makeURI("sip:" + extension + "@" + sip_uri);
  if (!uri) {
  }
  mySessionDescriptionHandlerFactory = SIP.Web.defaultSessionDescriptionHandlerFactory(myMediaStreamFactory);
  var config = {
    uri: uri,
    authorizationUsername: extension,
    authorizationPassword: sip_password,
    sessionDescriptionHandlerFactory: mySessionDescriptionHandlerFactory,    // for Custom Media Stream Factory i.e for Screen Sharing
    transportOptions: {
      server: wssFs, // wssFs Protocol
    },
    extraContactHeaderParams: ['X-Referred-By-Someone: Username'],
    extraHeaders: ['X-Referred-By-Someone12: Username12'],
    contactParams: { transport: "wss" },
    contactName: extension,
    /**
    * If true, a first provisional response after the 100 Trying will be sent automatically if UAC does not
    * require reliable provisional responses.
    * defaultValue `true`
    */
    sendInitialProvisionalResponse: true,
    refreshFrequency: 5000,
    delegate: {
      onTransportMessage: (message) => {
        console.log("==>> SIPJS CONSOLE => SIP Transport message received: ", message);
        // Handle the SIP transport message here
        // You can access the message content and headers
      },
      onConnect: () => {
        console.log("==>> SIPJS CONSOLE => Network connectivity established");
        var event = {
          "event": "xmppEvent",
          "response": {
            "loginId": extension,
            "type": "IN_SERVICE",
            "description": "Connected"
          }
        };
        const eventCopy = JSON.parse(JSON.stringify(event));
        callback(eventCopy);
        SendPostMessage(eventCopy);
        if (again_register) {
          // setupRemoteMedia(sessionall);
          //    if(dialogStatedata.response.dialog.state=="ACTIVE")
          //    terminate_call();
          registerer.register({
            requestDelegate: registrationDelegate
          })
            .then((request) => {
              console.log("==>> SIPJS CONSOLE => Successfully sent REGISTER request : ", request);
              // if(dialogStatedata.response.dialog.state=="ACTIVE")
              // terminate_call();
              again_register = false
            })
            .catch((error) => {
              console.error("==>> SIPJS CONSOLE => Failed to send REGISTER ->", error);
            });
          }
      },
      onDisconnect: (errorr) => {
        again_register = true;
        console.log("==>> SIPJS CONSOLE => Network connectivity lost going to unregister -> ", errorr);
        if (!errorr) {
          console.log("==>> SIPJS CONSOLE => User agent stopped");
          var event = {
            "event": "agentInfo",
            "response": {
              "loginId": extension,
              "extension": extension,
              "state": "LOGOUT",
              "cause": cause
            }
          };
          const eventCopy = JSON.parse(JSON.stringify(event));
          callback(eventCopy);
          SendPostMessage(eventCopy);
          return;
        }
        // On disconnect, cleanup invalid registrations
        registerer.unregister()
          .then((data) => {
            again_register = true;
          })
          .catch((e) => {
            // Unregister failed
            console.error('==>> SIPJS CONSOLE => Unregister failed  ', e);
          });
        // Only attempt to reconnect if network/server dropped the connection
        if (errorr) {
          console.log('==>> SIPJS CONSOLE => Only attempt to reconnect if network/server dropped the connection', errorr);
          var event = {
            "event": "xmppEvent",
            "response": {
              "loginId": extension,
              "type": "OUT_OF_SERVICE",
              "description": errorr.message
            }
          };
          const eventCopy = JSON.parse(JSON.stringify(event));
          callback(eventCopy);
          SendPostMessage(eventCopy);
          attemptReconnection();
        }
      },
      onInvite: (invitation) => {
        console.log("==>> SIPJS CONSOLE => INVITE received", invitation);

        // check to make sure its the only incomnig call
        if (calls[0] != undefined) {
          console.log("==>> SIPJS CONSOLE => CALL ALREADY EXISTS, so Dropping the Incoming call")
          terminateIncomingCall(invitation)
          return
        }

        //
        invitedata = JSON.parse(JSON.stringify(invitedata1));

        var sip_from = invitation.incomingInviteRequest.message.headers.From[0].raw.split(" <")
        var variablelist = sip_from[0].substring(1, sip_from[0].length - 1).split("|")
        const sysdate = new Date();
        var datetime = sysdate.toISOString();
        var dnis = sip_from[1].split(">;")[0]


        dialedNumber = invitation.incomingInviteRequest.message.headers["X-Destination-Number"];
        dialedNumber = dialedNumber != undefined ? dialedNumber[0].raw : loginid;

        /***
         * Fetching MediaType from an incoming Request
         * normal = Call coming from anywhere except Customer SDK
         * webrtc = Call coming from Customer SDK
         *
         * Incase of Consult incomingCallSource = normal
         */

        var incomingCallSource = ""
        var incomingMediaType = invitation.incomingInviteRequest.message.headers["X-Media-Type"];
        if (incomingMediaType != undefined) {
          incomingMediaType = incomingMediaType[0].raw;
          incomingCallSource = "WEB_RTC"
        }
        else {
          var sdp = invitation.incomingInviteRequest.message.body;
          if ((/\r\nm=audio /).test(sdp)) {
            incomingMediaType = "audio";
          }

          // if ((/\r\nm=video /).test(sdp)) {
          //     incomingMediaType = "video";
          //     }
          incomingCallSource = "VOICE"
        }

        call_variable_array = [];
        // Code for call variables
        // if (variablelist.length === 1) {
        //     if (variablelist[0].replace(/['"]+/g, '') == 'conference') {

        //         call_variable_array.push({
        //             "name": 'callVariable0',
        //             "value": ''
        //         })
        //         for (let index = 1; index < 10; index++) {
        //             if (invitation.incomingInviteRequest.message.headers['X-Call-Variable' + index]) {
        //                 call_variable_array.push({
        //                     "name": 'callVariable' + index,
        //                     "value": invitation.incomingInviteRequest.message.headers['X-Call-Variable' + index][0]['raw']
        //                 })
        //                 // call_variable_array['call_variable'+index]=session.request.headers['X-Call-Variable'+index][0]['raw']
        //             }
        //         }
        //     } else if (/^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/.test(variablelist[0].replace(/['"]+/g, ''))) {
        //         // call_variable_array['call_variable0'] = variablelist[0].replace(/['"]+/g, '');
        //         call_variable_array.push({
        //             "name": 'callVariable0',
        //             "value": variablelist[0].replace(/['"]+/g, '')
        //         })
        //         wrapupenabler = true;
        //     } else {
        //         // call_variable_array['call_variable0'] = session.request.headers['X-Call-Variable0'][0]['raw'];
        //         call_variable_array.push({
        //             "name": 'callVariable0',
        //             "value": invitation.incomingInviteRequest.message.headers['X-Call-Variable0'][0]['raw']
        //         })
        //         for (let index = 1; index < 10; index++) {
        //             if (invitation.incomingInviteRequest.message.headers['X-Call-Variable' + index]) {
        //                 call_variable_array.push({
        //                     "name": 'callVariable' + index,
        //                     "value": invitation.incomingInviteRequest.message.headers['X-Call-Variable' + index][0]['raw']
        //                 })
        //                 // call_variable_array['call_variable'+index]=session.request.headers['X-Call-Variable'+index][0]['raw']
        //             }
        //         }
        //     }
        // } else {
        //     if (/^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/.test(variablelist[0].replace(/['"]+/g, ''))) {
        //         // call_variable_array['call_variable0'] = variablelist[0].replace(/['"]+/g, '');
        //         call_variable_array.push({
        //             "name": 'callVariable0',
        //             "value": variablelist[0].replace(/['"]+/g, '')
        //         })
        //         wrapupenabler = true;
        //     }
        //     for (let index = 1; index < variablelist.length; index++) {
        //         call_variable_array.push({
        //             "name": 'callVariable' + index,
        //             "value": variablelist[index]
        //         })
        //     }

        // }
        dialogStatedata = JSON.parse(JSON.stringify(dialogStatedata1))
        if (invitation.incomingInviteRequest) {
          dialogStatedata.event = "dialogState";
          invitedata.event = "newInboundCall";
          if (invitation.incomingInviteRequest.message.from._displayName === 'conference') {
            dialogStatedata.response.dialog.callType = 'conference';
            invitedata.response.dialog.callType = 'conference';

          } else if (invitation.incomingInviteRequest.message.headers["X-Calltype"] !== undefined) {
            var calltype = invitation.incomingInviteRequest.message.headers["X-Calltype"][0].raw;
            if (calltype == "PROGRESSIVE") {
              dialogStatedata.response.dialog.callType = "OUTBOUND";
              invitedata.response.dialog.callType = "OUTBOUND";
              dialogStatedata.event = "campaignCall";
              invitedata.event = "campaignCall";
              setTimeout(() => {
                respond_call(callback, dialogStatedata.response.dialog.id, incomingMediaType)
              }, sipconfig.autoCallAnswer * 1000);
            }
            else if (calltype == "OUT") {
              dialogStatedata.response.dialog.callType = 'OTHER_IN'
              invitedata.response.dialog.callType = 'OTHER_IN';
            }
          }
          else {
            dialogStatedata.response.dialog.callType = 'OTHER_IN'
            invitedata.response.dialog.callType = 'OTHER_IN';

          }
        }
        var queuenameval = invitation.incomingInviteRequest.message.headers["X-Queue"] != undefined ? invitation.incomingInviteRequest.message.headers["X-Queue"][0]['raw'] : "Nil";
        var queuetypeval = invitation.incomingInviteRequest.message.headers["X-Queuetype"] != undefined ? invitation.incomingInviteRequest.message.headers["X-Queuetype"][0]['raw'] : "Nil";
        dialogStatedata.response.dialog.callVariables.CallVariable = call_variable_array;
        dialogStatedata.response.loginId = loginid;
        dialogStatedata.response.dialog.id = invitation.incomingInviteRequest.message.headers["X-Call-Id"] != undefined ? invitation.incomingInviteRequest.message.headers["X-Call-Id"][0]['raw'] : invitation.incomingInviteRequest.message.headers["Call-ID"][0]['raw'];
        dialogStatedata.response.dialog.ani = dnis.split('sip:')[1].split('@')[0];
        dialogStatedata.response.dialog.fromAddress = dnis.split('sip:')[1].split('@')[0];
        dialogStatedata.response.dialog.customerNumber = dnis.split('sip:')[1].split('@')[0];
        dialogStatedata.response.dialog.participants[0].mediaAddress = loginid;
        dialogStatedata.response.dialog.dnis = dialedNumber;
        dialogStatedata.response.dialog.serviceIdentifier = dialedNumber;
        dialogStatedata.response.dialog.participants[0].startTime = datetime;
        dialogStatedata.response.dialog.participants[0].stateChangeTime = datetime;
        dialogStatedata.response.dialog.participants[0].state = "ALERTING";
        dialogStatedata.response.dialog.state = "ALERTING";
        dialogStatedata.response.dialog.dialedNumber = dialedNumber;
        dialogStatedata.response.dialog.queueName = queuenameval == "Nil" ? null : queuenameval;
        dialogStatedata.response.dialog.queueType = queuetypeval == "Nil" ? null : queuetypeval;

        dialogStatedata.response.dialog.mediaType = incomingMediaType
        dialogStatedata.response.dialog.channelType = incomingCallSource

        invitedata.response.dialog.callVariables.CallVariable = call_variable_array;
        invitedata.response.loginId = loginid;
        invitedata.response.dialog.dnis = dialedNumber;
        invitedata.response.dialog.serviceIdentifier = dialedNumber;
        invitedata.response.dialog.id = invitation.incomingInviteRequest.message.headers["X-Call-Id"] != undefined ? invitation.incomingInviteRequest.message.headers["X-Call-Id"][0]['raw'] : invitation.incomingInviteRequest.message.headers["Call-ID"][0]['raw'];
        invitedata.response.dialog.ani = dnis.split('sip:')[1].split('@')[0];
        invitedata.response.dialog.fromAddress = dnis.split('sip:')[1].split('@')[0];
        invitedata.response.dialog.customerNumber = dnis.split('sip:')[1].split('@')[0];
        invitedata.response.dialog.participants[0].mediaAddress = loginid;
        invitedata.response.dialog.participants[0].startTime = datetime;
        invitedata.response.dialog.participants[0].stateChangeTime = datetime;
        invitedata.response.dialog.participants[0].state = "ALERTING";
        invitedata.response.dialog.state = "ALERTING";
        invitedata.response.dialog.dialedNumber = dialedNumber;
        invitedata.response.dialog.queueName = queuenameval == "Nil" ? null : queuenameval;
        invitedata.response.dialog.queueType = queuetypeval == "Nil" ? null : queuetypeval;

        invitedata.response.dialog.mediaType = incomingMediaType
        invitedata.response.dialog.channelType = incomingCallSource

        if (invitedata.additionalDetail) {
          invitedata.additionalDetail.remoteVideoDisplay = incomingMediaType == "audio" ? false : true
          if (incomingCallSource == "VOICE") {
            invitedata.additionalDetail.remoteMediaType = "audio"
          }
          else {
            invitedata.additionalDetail.remoteMediaType = incomingMediaType
          }
          invitedata.additionalDetail.localMediaType = incomingMediaType
        }
        else {
          var _remoteVideoType = ""
          if (incomingCallSource == "VOICE") {
            _remoteVideoType = "audio"
          }
          else {
            _remoteVideoType = incomingMediaType
          }
          invitedata.additionalDetail = {
            remoteVideoDisplay: incomingMediaType == "audio" ? false : true,
            remoteMediaType: _remoteVideoType,
            localMediaType: incomingMediaType
          }
        }

        if (dialogStatedata.response.dialog.callType == "CONSULT") {
          dialogStatedata.response.dialog.customerNumber = invitation.incomingInviteRequest.message.headers["X-Customernumber"] != undefined ? invitation.incomingInviteRequest.message.headers["X-Customernumber"][0]['raw'] : "0000";
          dialogStatedata.response.dialog.serviceIdentifier = invitation.incomingInviteRequest.message.headers["X-Destination-Number"] != undefined ? invitation.incomingInviteRequest.message.headers["X-Destination-Number"][0]['raw'] : "0000";
          dialogStatedata.response.dialog.dialedNumber = invitation.incomingInviteRequest.message.headers["X-Destination-Number"] != undefined ? invitation.incomingInviteRequest.message.headers["X-Destination-Number"][0]['raw'] : "0000";
          dialogStatedata.response.dialog.channelType = "VOICE"
          dialogStatedata.response.dialog.mediaType = "audio"

          invitedata.response.dialog.customerNumber = invitation.incomingInviteRequest.message.headers["X-Customernumber"] != undefined ? invitation.incomingInviteRequest.message.headers["X-Customernumber"][0]['raw'] : "0000";
          invitedata.response.dialog.serviceIdentifier = invitation.incomingInviteRequest.message.headers["X-Destination-Number"] != undefined ? invitation.incomingInviteRequest.message.headers["X-Destination-Number"][0]['raw'] : "0000";
          invitedata.response.dialog.dialedNumber = invitation.incomingInviteRequest.message.headers["X-Destination-Number"] != undefined ? invitation.incomingInviteRequest.message.headers["X-Destination-Number"][0]['raw'] : "0000";
          invitedata.response.dialog.channelType = "VOICE"
          invitedata.response.dialog.mediaType = "audio"
        }

        if (dialogStatedata.response.dialog.channelType == "WEB_RTC") {
          // for webrtc call replacing ANI with the Number provided by Customer
          dialogStatedata.response.dialog.customerNumber = invitation.incomingInviteRequest.message.headers["X-Customer-Number"] != undefined ? invitation.incomingInviteRequest.message.headers["X-Customer-Number"][0]['raw'] : dnis.split('sip:')[1].split('@')[0];
          invitedata.response.dialog.customerNumber = invitation.incomingInviteRequest.message.headers["X-Customer-Number"] != undefined ? invitation.incomingInviteRequest.message.headers["X-Customer-Number"][0]['raw'] : dnis.split('sip:')[1].split('@')[0];
        }

        const data = {}
        data.response = invitedata.response
        data.event = invitedata.event
        const invitedataCopy = JSON.parse(JSON.stringify(data));
        callback(invitedataCopy);
        SendPostMessage(invitedataCopy);
        callendDialogId = invitedata.response.dialog.id;
        var index = getCallIndex(invitedata.response.dialog.id);
        if (index == -1) {
          invitedata.session = invitation;
          // making dialogState & InviteData Event same
          invitedata.event = dialogStatedata.event;
          calls.push(invitedata);
        }

        remotesession = invitation;
        sessionall = invitation;
        addsipcallback(invitation, 'inbound', callback);
      },
      onAck: (onACk) => {
        console.log("==>> SIPJS CONSOLE => onACk received", onACk);
        //invitation.accept();
      },
      onMessage: (message) => {
        let someMessage = JSON.parse(message.request.body)
        console.log("==>> SIPJS CONSOLE => someMessage RECEIVED : ", someMessage)
        // callback(someMessage);               // Junaid -> Reason for this?  // NEED INPUT
        if (someMessage.event && someMessage.dialog.id) {
          var index = getCallIndex(someMessage.dialog.id);
          var someSession;
          if (index !== -1) {
            someSession = calls[index].session;
          }
          if (!someSession) {
            return;
          }
          switch (someMessage.event) {
            case "mediaStreamUpdate":
              someMessage.loginId = loginid
              mediaStreamUpdateEvent(someMessage, callback)
              break
            case "agentDetails":
              updateAgentDetails(someMessage)
              break
            case "MEDIA_SERVER_CALL_END":
              customerLeftEndCall(someMessage)
              break
            case "USER_BUSY":
              agentBusyError(someMessage, callback)
              break
            default:
              break
          }
        }
        message.accept()
      },
      onNotify: (notification) => {
        console.log("==>> SIPJS CONSOLE => NOTIFY received", notification);
        //notification.accept();
      },
      onRefer: (referral) => {
        console.log("==>> SIPJS CONSOLE => REFER onRefer received");
        //referral.accept();
      },
      onSubscribe: (subscription) => {
        console.log("==>> SIPJS CONSOLE => SUBSCRIBE received");
      },
      onReject: (response) => {
        console.log("==>> SIPJS CONSOLE => onReject response = ", response);
        // error("generalError",loginid,response.message.reasonPhrase,callback);
      },
    },
    logLevel: "log",
    logBuiltinEnabled: sip_log
  };

  userAgent = new SIP.UserAgent(config)
  userAgent.start()
    .then(() => {
      console.log("==>> SIPJS CONSOLE => User-agent Connected");
      registerer = new SIP.Registerer(userAgent);
      // Setup registerer state change handler
      registerer.stateChange.addListener((newState) => {
        console.log('==>> SIPJS CONSOLE => Registerer newState:', newState);
        switch (newState) {
          case SIP.RegistererState.Registered:
            console.log("==>> SIPJS Console => SIP.RegistererState.Registered")
            if (dialogStatedata == null)
              dialogStatedata = JSON.parse(JSON.stringify(dialogStatedata1));


            //there can be 2 Calls active at the same Time
            //First call can be Webrtc
            console.log("==>> SIPJS Console => Trying to send ReInvite, Calls array length is =>", calls.length)
            for (var k = 0; k < calls.length; k++) {
              var _tempDialogState = calls[k]
              if (_tempDialogState.response.dialog.state && _tempDialogState.response.dialog.state !== "DROPPED") {
                var currentCallStatus = ""

                  let data = {
                    event: _tempDialogState.event,
                    response: _tempDialogState.response
                  };
                  var _tempData = JSON.parse(JSON.stringify(data))
                  callback(_tempData)
                  SendPostMessage(_tempData)


                // adding logic to check if call is still there or not
                var index = getCallIndex(_tempDialogState.response.dialog.id)
                var sessionToestablish = calls[index].session;
                const tempSessionResponse = calls[index].response

                const options = {
                  sessionDescriptionHandlerOptions: {
                    offerOptions: {
                      iceRestart: true,
                    },
                    iceGatheringTimeout: 500
                  },
                  requestDelegate: {
                    onAccept: (response) => {
                      console.log("==>> SIPJS Console => ReInvite After Reconnect onAccept of Dialogid ", tempSessionResponse.dialog.id);
                      console.log("==>> SIPJS Console => ReInvite After Reconnect onAccept response = ", response);
                      EnableVoiceTrack(sessionToestablish)
                    },
                    onReject: (response) => {
                      console.log("==>> SIPJS Console => ReInvite After Reconnect onReject of Dialogid ", tempSessionResponse.dialog.id);
                      console.log("==>> SIPJS Console => ReInvite After Reconnect onReject response = ", response);
                      if (response.message.reasonPhrase == "Call Does Not Exist" || response.message.reasonPhrase == "Call is being terminated") {
                        error("generalError", loginid, checkErrorReason("customer_left"), callback);
                        var index = getCallIndex(tempSessionResponse.dialog.id)
                        calls[index].response.dialog.callEndReason = "customer_left"
                        terminate_call(tempSessionResponse.dialog.id)
                      }
                      else if (response.message.reasonPhrase == "Not Acceptable Here") {
                        sessionToestablish.dialog.signalingStateRollback();
                        sessionToestablish.sessionDescriptionHandler.peerConnection.setLocalDescription({ type: "rollback" })
                        EnableVoiceTrack(sessionToestablish)
                      }
                      else {
                        EnableVoiceTrack(sessionToestablish)
                      }
                    },
                  }
                };

                // first one checks simple calls, second one check conference calls
                if (_tempDialogState.response.dialog.state === 'HELD' || currentCallStatus == "HELD") {
                  options.sessionDescriptionHandlerOptions.hold = true;
                } else if (_tempDialogState.response.dialog.state === 'ACTIVE') {
                  if (_tempDialogState.response.dialog.channelType === "WEB_RTC") {
                    // Call from Customer Widget
                    const remoteVideo = _tempDialogState.additionalDetail?.remoteVideoDisplay;
                    options.sessionDescriptionHandlerOptions.constraints = {
                      audio: true,
                      video: remoteVideo === true, // If true, enable video; otherwise, disable
                      action: "CALL_ANSWER",
                      mediaType: remoteVideo ? "video" : "audio"
                    };
                  } else {
                    // Call from elsewhere, so only audio call
                    options.sessionDescriptionHandlerOptions.constraints = {
                      audio: true,
                      video: false,
                      action: "CALL_ANSWER",
                      mediaType: "audio"


                    };
                  }
                }
                console.log("==>> SIPJS CONSOLE => Reinvite OPTIONS => ", options)
                sessionToestablish.invite(options)
                  .catch((error) => {
                    console.error("==>> SIPJS CONSOLE => Failed to send ReInvite after Reconnect of Dialogid  ", tempSessionResponse.dialog.id);
                    console.error("==>> SIPJS CONSOLE => Failed to send ReInvite after Reconnect ->", error);
                  })
              }
            }


            loginid = extension;
            dialogStatedata.response.loginId = extension;
            console.log('==>> SIPJS CONSOLE => connected registered', registerer);
            var event = {
              "event": "agentInfo",
              "response": {
                "loginId": extension,
                "extension": extension,
                "state": "LOGIN",
                cause: null
              }
            };
            if (!agentInfo) {
              const eventCopy = JSON.parse(JSON.stringify(event));
              callback(eventCopy);
              SendPostMessage(eventCopy);
              callback(JSON.parse(JSON.stringify({
                "event": "dialogState",
                "response": {
                  "loginId": extension,
                  "dialog": null
                }
              })));
              SendPostMessage(JSON.parse(JSON.stringify({
                "event": "dialogState",
                "response": {
                  "loginId": extension,
                  "dialog": null
                }
              })));
              agentInfo = true;
            }
            break;
          case SIP.RegistererState.Unregistered:
            console.log("==>> SIPJS CONSOLE => RegistererState Unregistered : ", registerer);
            if (!again_register) {
              var event = {
                "event": "agentInfo",
                "response": {
                  "loginId": extension,
                  "extension": extension,
                  "state": "LOGOUT",
                  "cause": null
                }
              };
              const eventCopy = JSON.parse(JSON.stringify(event));
              callback(eventCopy);
              SendPostMessage(eventCopy);
              dialogStatedata = null;
              loginid = null;
              agentInfo = false;
              userAgent.delegate = null;
              userAgent = null;
              sessionall = null;

            }
            break;
          case SIP.RegistererState.Terminated:
            console.log("==>> SIPJS CONSOLE => RegistererState Terminated");
            break;
        }
      });
      // Send REGISTER
      registerer.register({
        requestDelegate: registrationDelegate
      })
        .then((request) => {
          console.log("==>> SIPJS CONSOLE => Successfully sent REGISTER request = ", request);
        })
        .catch((error) => {
          console.error("==>> SIPJS CONSOLE => Failed to send REGISTER ->", error);
          error("subscriptionFailed", extension, checkErrorReason(error.message), callback);
        });
    })
    .catch((errorr) => {
      console.error("==>> SIPJS CONSOLE => Failed to connect -> ", errorr);
      error("subscriptionFailed", extension, checkErrorReason(errorr.message), callback);
    });

  // Allow the function to be called again after 5 seconds
  setTimeout(() => {
    canCallFunction = true;
  }, 1000); // 5000 milliseconds = 5 seconds

}
/**
 * Initiate an outbound call.
 * This function is used to start an outbound call with the specified parameters.
 *
 * @param {string} calledNumber - The destination number to call.
 * @param {string} DN - The destination number to call.
 * @param {string} mediaType - The type of media for the call (Audio, Video, Screen Share).
 * @param {function} callback - A callback function to execute after attempting the call.
 * @param {string} callType - The type of call (OUT for Webrtc, MANUAL_OUT for outbound, MONITORING for monitoring).
 * @returns {void}
 */

function initiate_call(calledNumber, DN, mediaType, authData, callback, callType, serviceIdentifier) {

  var res = lockFunction("initiate_call", 500); // --- seconds cooldown
  if (!res) return;
  const undefinedParams = checkUndefinedParams(initiate_call, [calledNumber, DN, mediaType, authData, callback, callType, serviceIdentifier]);

  if (undefinedParams.length > 0) {
    error("generalError", loginid, `Error: The following parameter(s) are undefined or null or empty: ${undefinedParams.join(', ')}`, callback);
    return;
  }

  globalEventCallback = callback
  if (userAgent !== null && userAgent !== undefined ) {  // NEED INPUT && userAgent.transport.isConnected()
    // Target URI
    var sip_uri = SIP.UserAgent.makeURI('sip:' + calledNumber + "@" + sipconfig.uriFs);
    if (!sip_uri) {
      // console.error("Failed to create target URI.");
      error("generalError", loginid, checkErrorReason("Invalid_URI"), callback);
      return;
    }

    var tempOptions = {
      earlyMedia: true,
    }

    // Create new Session instance in "initial" state
    sessionall = new SIP.Inviter(userAgent, sip_uri, tempOptions);
    const request = sessionall.request;

    // request.extraHeaders.push('X-Agent-Id:' + authData.agentId);
    // request.extraHeaders.push('X-Agent-Name:' + authData.agentName);
    request.extraHeaders.push('X-Customer-Name:' + authData.customerName);
    request.extraHeaders.push('X-Agent-Extension:' + authData.agentExtension);
    request.extraHeaders.push('X-Customer-Number:' + authData.customerNumber);
    // request.extraHeaders.push('X-Channel:' + authData.channel);
    request.extraHeaders.push('X-Customer-Id:' + authData.customerId);
    // request.extraHeaders.push('X-Service-Identifier:' + authData.serviceIdentifier);

    // request.extraHeaders.push('X-Destination-Number:' + DN);
    // request.extraHeaders.push('X-Media-Type:' + calltype)
    // request.extraHeaders.push('Another-Header: Value2');


    request.extraHeaders.push('X-Destination-Number:' + DN);
    request.extraHeaders.push('X-Media-Type:' + mediaType)
    // if(callType == "MONITORING"){
    let _callType = callType == "MONITORING" ? "MONITORING" : "OUT"
    request.extraHeaders.push('X-Calltype: ' + _callType)
    // request.extraHeaders.push('Another-Header: Value2');

    var constraintVideo = false
    var offerToReceiveAVideo = false   // if audio
    if (mediaType == "video") { constraintVideo = true; offerToReceiveAVideo = true }
    else if (mediaType == "screenshare") { constraintVideo = "screenshare"; offerToReceiveAVideo = true }

    // Options including delegate to capture response messages
    const inviteOptions = {
      requestDelegate: {
        onAccept: (response) => {
          console.log("==>> SIPJS CONSOLE => onAccept response = ", response);
          calls[0].session.delegate.onBye = (bye) => {
            console.log("==>> SIPJS CONSOLE => onBye MESSAGE = ", bye)
            var _session = calls[0]
            if (_session && _session.event && _session.response && _session.response.dialog.callEndReason != "EXTERNAL_ATTENDED_TRANSFER") {
              if (bye.incomingByeRequest.message.headers["X-Call-Dropped-Custom-Reason"] != undefined) {
                _session.response.dialog.callEndReason = bye.incomingByeRequest.message.headers["X-Call-Dropped-Custom-Reason"][0]['raw'];
              }
              else {
                const match = bye.incomingByeRequest.message.data.match(/text="([^"]+)"/);
                if (match && match[1]) {
                  _session.response.dialog.callEndReason = match[1];
                }
              }
            }
          }
        },
        onReject: (response) => {
          console.log("==>> SIPJS CONSOLE => onReject response = ", response);

          let callEndReason = "";
          const { message } = response;

          const customReasonHeader = message.headers?.["X-Call-Dropped-Custom-Reason"];
          if (customReasonHeader) {
            console.log("==>> SIPJS CONSOLE -> CALL REJECT FOR SOME CUSTOM REASON");

            error("generalError", loginid, checkErrorReason(customReasonHeader[0]?.raw), callback);

            callEndReason = Errors.errorsList.hasOwnProperty(customReasonHeader[0]?.raw)
              ? customReasonHeader[0]?.raw
              : Errors.errorsList["CUSTOM_UNKNOWN_ERROR"]

          }
          else if (message.data?.match(/text="([^"]+)"/)?.[1] && message.data.match(/text="([^"]+)"/)[1] !== "NORMAL_CLEARING") {
            const reason = message.data.match(/text="([^"]+)"/)[1];

            if (Errors.errorsList.hasOwnProperty(reason)) {
              error("generalError", loginid, Errors.errorsList[reason], callback);
              callEndReason = reason
            } else {
              error("generalError", loginid, Errors.errorsList["CUSTOM_UNKNOWN_ERROR"], callback);
              callEndReason = Errors.errorsList["CUSTOM_UNKNOWN_ERROR"]
            }

          }
          else if (["Service Unavailable", "Request Timeout"].includes(message.reasonPhrase)) {
            const errorKey = callType === "MONITORING"
              ? "Silent_Transaction_Error"
              : "OB_Transaction_Error";

            error("generalError", loginid, checkErrorReason(errorKey), callback);
            callEndReason = message.reasonPhrase;
          }
          else if (callType !== "MONITORING") {

            error("generalError", loginid, checkErrorReason(message.reasonPhrase), callback);

            callEndReason = Errors.errorsList.hasOwnProperty(message.reasonPhrase)
              ? message.reasonPhrase
              : Errors.errorsList["CUSTOM_UNKNOWN_ERROR"]
          }

          // Assign the final callEndReason
          calls[0].response.dialog.callEndReason = callEndReason;
        },
        onCancel: (response) => {
          console.log("==>> SIPJS CONSOLE => onCancel response = ", response);
          error("generalError", loginid, checkErrorReason("CUSTOM_UNKNOWN_ERROR"), callback);
        },
        onBye: (response) => {
          console.log("==>> SIPJS CONSOLE => onBye response = ", response);
          error("generalError", loginid, checkErrorReason("CUSTOM_UNKNOWN_ERROR"), callback);
        },
        onTerminate: (response) => {
          console.log("==>> SIPJS CONSOLE => onTerminate response = ", response);
          error("generalError", loginid, checkErrorReason("CUSTOM_UNKNOWN_ERROR"), callback);
        },
        onProgress: (response) => {
          console.log("==>> SIPJS CONSOLE => INITIATED response = onProgress", response);

          outboundDialingdata = null;
          outboundDialingdata = calls[0]

          dialogStatedata = null
          dialogStatedata = calls[0]

          const sysdate = new Date();
          var datetime = sysdate.toISOString();
          dialogStatedata.response.dialog.participants[0].state = "INITIATED";
          dialogStatedata.response.dialog.state = "INITIATED";
          outboundDialingdata.response.dialog.participants[0].startTime = datetime;
          outboundDialingdata.response.dialog.participants[0].state = "INITIATED";
          outboundDialingdata.response.dialog.state = "INITIATED";
          outboundDialingdata.response.dialog.isCallEnded = 0;
          var { session, ...dataToPass } = outboundDialingdata;
          var data = {}
          data.event = dataToPass.event
          data.response = dataToPass.response
          const dataToPassCopy = JSON.parse(JSON.stringify(data));
          callback(dataToPassCopy);
          SendPostMessage(dataToPassCopy);
        },
        onTrying: (response) => {
          console.log("==>> SIPJS CONSOLE => INITIATING response = onTrying", response);
          if (response.message) {
            outboundDialingdata = null;
            outboundDialingdata = JSON.parse(JSON.stringify(outboundDialingdata12));

            dialogStatedata = null
            dialogStatedata = JSON.parse(JSON.stringify(dialogStatedata1))

            const sysdate = new Date();
            var datetime = sysdate.toISOString();
            dialedNumber = response.message.to.uri.raw.user;

            dialogStatedata.response.loginId = loginid;
            dialogStatedata.response.dialog.fromAddress = loginid;
            dialogStatedata.response.dialog.callType = callType == "MONITORING" ? "MONITORING" : "OUT";
            dialogStatedata.response.dialog.ani = dialedNumber;
            dialogStatedata.response.dialog.id = response.message.callId;
            dialogStatedata.response.dialog.dialedNumber = dialedNumber;
            dialogStatedata.response.dialog.fromAddress = loginid;
            dialogStatedata.response.dialog.customerNumber = dialedNumber;
            dialogStatedata.response.dialog.participants[0].stateChangeTime = datetime;
            //change dialogStatedata.response.dialog.participants[0].mediaAddress = agentlogindata.agent_contact.split('/')[1].split('@')[0];

            outboundDialingdata.response.loginId = loginid;
            outboundDialingdata.response.dialog.fromAddress = loginid;
            outboundDialingdata.response.dialog.callType = callType == "MONITORING" ? "MONITORING" : "OUT";
            outboundDialingdata.response.dialog.ani = dialedNumber;
            outboundDialingdata.response.dialog.dnis = dialedNumber;
            outboundDialingdata.response.dialog.serviceIdentifier = callType == "MONITORING" ? _monitoringServiceIdentifier : DN;
            outboundDialingdata.response.dialog.id = response.message.callId;
            outboundDialingdata.response.dialog.dialedNumber = dialedNumber;
            outboundDialingdata.response.dialog.customerNumber = dialedNumber;
            outboundDialingdata.response.dialog.participants[0].mediaAddress = loginid;
            outboundDialingdata.response.dialog.participants[0].startTime = datetime;
            outboundDialingdata.response.dialog.participants[0].stateChangeTime = datetime;
            outboundDialingdata.response.dialog.participants[0].state = "INITIATING";
            outboundDialingdata.response.dialog.state = "INITIATING";
            outboundDialingdata.response.dialog.isCallEnded = 0;

            dialogStatedata.response.dialog.participants[0].startTime = datetime;
            dialogStatedata.response.dialog.participants[0].state = "INITIATING";
            dialogStatedata.response.dialog.state = "INITIATING";
            outboundDialingdata.event = "outboundDialing";
            sessionall.request.extraHeaders.push('X-Call-Unique-ID:' + DN);

            outboundDialingdata.response.dialog.mediaType = mediaType
            var _channelType = ""
            if (callType == "OUT") {
              _channelType = "WEB_RTC"
            }
            else {
              _channelType = "VOICE"
            }
            outboundDialingdata.response.dialog.channelType = _channelType;

            dialogStatedata.response.dialog.mediaType = mediaType
            dialogStatedata.response.dialog.channelType = _channelType;
            var data = {}
            data.event = outboundDialingdata.event
            data.response = outboundDialingdata.response

            if (outboundDialingdata.additionalDetail) {
              outboundDialingdata.additionalDetail.remoteVideoDisplay = mediaType == "audio" ? false : true
              outboundDialingdata.additionalDetail.localMediaType = mediaType
              outboundDialingdata.additionalDetail.remoteMediaType = mediaType == "screenshare" ? "onlyviewscreenshare" : mediaType
            }
            else {
              outboundDialingdata.additionalDetail = {
                remoteVideoDisplay: mediaType == "audio" ? false : true,
                remoteMediaType: mediaType == "screenshare" ? "onlyviewscreenshare" : mediaType,
                localMediaType: mediaType
              }
            }

            const outboundDialingdataCopy = JSON.parse(JSON.stringify(data));
            callback(outboundDialingdataCopy);
            SendPostMessage(outboundDialingdataCopy);

            var index = getCallIndex(outboundDialingdata.response.dialog.id);
            if (index == -1) {
              outboundDialingdata.session = sessionall;
              // making dialogState & outboundDialingdata Event same
              outboundDialingdata.event = "dialogState"
              calls.push(outboundDialingdata);
            }
            setupRemoteMedia(outboundDialingdata.session, callback, outboundDialingdata.response.dialog.id)
          }

        },
        onRedirect: (response) => {
          console.log("Negative response = onRedirect" + response);
        },
        onRefer: (response) => {
          console.log("onRefer response = onRefer" + response);
        }
      },
      sessionDescriptionHandlerOptions: {
        constraints: {
          audio: true,
          video: constraintVideo,
          action: "CALL_INITIATE",
          mediaType: mediaType.toUpperCase()
        },
        offerOptions: {
          offerToReceiveAudio: true,
          offerToReceiveVideo: offerToReceiveAVideo
        },
        iceGatheringTimeout: 500
      },
      // earlyMedia: true,
      requestOptions: {
        extraHeaders: [
          'X-Referred-By-Someone: Username'
        ]
      },
    };

    // Send initial INVITE
    sessionall.invite(inviteOptions)
      .then((request) => {
        console.log("==>> SIPJS CONSOLE => Successfully sent INVITE request = ", request);
      })
      .catch((errorr) => {
        console.error("==>> SIPJS CONSOLE => Failed to send INVITE -> ", errorr.message);
        error("generalError", loginid, checkErrorReason(errorr.message), callback);

      });
    addsipcallback(sessionall, 'outbound', callback);
  } else {
    error('generalError', loginid, checkErrorReason("User_Not_Registered"), callback);
  }
}
/**
 * Terminate an active call.
 * This function is used to terminate an ongoing call identified by the dialog ID.
 *
 * @param {string} dialogId - The identifier for the call dialog to be terminated.
 * @returns {void}
 */
function terminate_call(dialogId) {
  var res = lockFunction("terminate_call", 500); // --- seconds cooldown
  if (!res) return;
  var index = getCallIndex(dialogId);
  var sessionToEnd = null;
  if (index !== -1) {
    sessionToEnd = calls[index].session;
  }
  if (!sessionToEnd) {
    if (typeof callbackFunction === "function")
      error('invalidState', loginid, "invalid action releaseCall", callbackFunction);
    return;
  }
  console.log('==>> SIPJS CONSOLE => Call Current state Before Terminating: ', sessionToEnd.state);
  switch (sessionToEnd.state) {
    case SIP.SessionState.Initial:
    case SIP.SessionState.Establishing:
      if (sessionToEnd instanceof SIP.Inviter) {
        // An unestablished outgoing session
        sessionToEnd.cancel();
      } else {
        // An unestablished incoming session
        dialogStatedata.response.dialog.callEndReason = "Rejected";
        sessionToEnd.reject();
      }
      break;
    case SIP.SessionState.Established:
      // An established session
      sessionToEnd.bye();
      break;
    case SIP.SessionState.Terminating:
    case SIP.SessionState.Terminated:
      // Cannot terminate a session that is already terminated
      break;
  }
  sessionall = null;
}


/**
 * Hold an active call.
 * This function is used to put an ongoing call on hold.
 *
 * @param {function} callback - The callback function to execute after the call is put on hold.
 * @param {string} dialogId - The identifier for the call dialog to be put on hold.
 * @returns {void}
 */
function phone_hold(callback, dialogId) {
  var res = lockFunction("phone_hold", 1500); // --- seconds cooldown
  if (!res) return;
  var res = lockFunction("phone_unhold", 1500); // --- seconds cooldown
  if (!res) return
  var index = getCallIndex(dialogId);
  var sessionall = null
  if (index !== -1) {
    sessionall = calls[index];
  }
  if (!sessionall) {
    error('invalidState', loginid, "invalid action holdCall", callback);
    return;
  }
  //for mute/unmute
  let peer = sessionall.session.sessionDescriptionHandler.peerConnection;
  let senders = peer.getSenders();

  if (!senders.length) return;

  const holdOptions = {
    sessionDescriptionHandlerOptions: {
      hold: true,
    },
    requestDelegate: {
      onAccept: (response) => {
        console.log("==>> SIPJS Console => HOLD onAccept response = ", response);
        console.log("==>> SIPJS Console => Session held successfully.");
        const sysdate = new Date();
        var datetime = sysdate.toISOString();

        var data = {}
        data.response = calls[index].response;
        data.event = calls[index].event;
        data.response.dialog.participants[0].stateChangeTime = datetime;
        data.response.dialog.participants[0].state = "HELD";
        data.response.dialog.state = "HELD";
        data.response.dialog.isCallAlreadyActive = true;

        if (typeof callback === 'function') {
          var _sessionDialog = {}
          _sessionDialog.response = sessionall.response;
          _sessionDialog.event = sessionall.event;
          const eventCopy = JSON.parse(JSON.stringify(_sessionDialog))
          callback(eventCopy)
          SendPostMessage(eventCopy);

        }
      },
      onReject: (response) => {
        console.log("==>> SIPJS Console => HOLD onReject response = ", response);
        console.log("==>> SIPJS Console => HOLD onReject response Reason = ", response.message.reasonPhrase, " so call is getting hold");

        sessionall.session.dialog.signalingStateRollback();
        sessionall.session.sessionDescriptionHandler.peerConnection.setLocalDescription({ type: "rollback" }).then(() => {
          ReEstablishVoiceCall(sessionall.session, "HOLD", "", callback, dialogId)
        })

      }
    }
  };

  sessionall.session.invite(holdOptions)
    .catch((errorr) => {
      console.error("==>> SIPJS Console => Failed to hold the session -> ", errorr);
      error("generalError", loginid, checkErrorReason(errorr.message), callback);
    });

}
/**
 * Unhold a held call.
 * This function is used to take a held call off hold and resume it.
 *
 * @param {function} callback - The callback function to execute after the call is taken off hold.
 * @param {string} dialogId - The identifier for the call dialog to be taken off hold.
 * @returns {void}
 */
function phone_unhold(callback, dialogId) {
  var res = lockFunction("phone_unhold", 1500); // --- seconds cooldown
  if (!res) return;
  var res = lockFunction("phone_hold", 1500); // --- seconds cooldown
  if (!res) return;
  var index = getCallIndex(dialogId);
  var sessionall = null
  if (index !== -1) {
    sessionall = calls[index];
  }
  if (!sessionall) {
    error('invalidState', loginid, "invalid action unholdCall", callback);
    return;
  }
  //for mute/unmute
  let peer = sessionall.session.sessionDescriptionHandler.peerConnection;
  let senders = peer.getSenders();

  if (!senders.length) return;

  //let that = this;
  senders.forEach(function (sender) {
    if (sender.track) sender.track.enabled = true;
  });

  // Hold the session by sending a re-INVITE with hold session description
  const holdOptions = {
    sessionDescriptionHandlerOptions: {
      hold: false,
    },
    requestDelegate: {
      onAccept: (response) => {
        console.log("==>> SIPJS Console => UNHOLD onAccept response = ", response);
        const sysdate = new Date();
        var datetime = sysdate.toISOString();

        var data = {}
        data.response = calls[index].response;
        data.event = calls[index].event;
        data.response.dialog.participants[0].stateChangeTime = datetime;
        data.response.dialog.participants[0].state = "ACTIVE";
        data.response.dialog.participants[0].mute = false
        data.response.dialog.state = "ACTIVE";
        data.response.dialog.isCallAlreadyActive = true;

        if (typeof callback === 'function') {
          var _sessionDialog = {}
          _sessionDialog.response = sessionall.response;
          _sessionDialog.event = sessionall.event;
          const eventCopy = JSON.parse(JSON.stringify(_sessionDialog))
          callback(eventCopy)
          SendPostMessage(eventCopy);
          setupRemoteMedia(sessionall.session, callback, dialogId)
        }
        EnableVoiceTrack(sessionall.session)
      },
      onReject: (response) => {
        console.log("==>> SIPJS Console => UNHOLD onReject response = ", response);
        if (response.message.reasonPhrase == "Not Acceptable Here") {
          console.log("==>> SIPJS Console => UNHOLD onReject response Reason = ", response.message.reasonPhrase, " so call is unhold, putting it back on Hold");
          sessionall.session.dialog.signalingStateRollback();
          sessionall.session.sessionDescriptionHandler.peerConnection.setLocalDescription({ type: "rollback" }).then(() => {
            ReEstablishVoiceCall(sessionall.session, "HOLD", "websocketissue_unhold", callback, dialogId)
          })
        }
        else {
          console.log("==>> SIPJS Console => UNHOLD onReject Reason UNKNOWN ->", response.message.reasonPhrase);
          sessionall.session.dialog.signalingStateRollback();
          sessionall.session.sessionDescriptionHandler.peerConnection.setLocalDescription({ type: "rollback" }).then(() => {
            ReEstablishVoiceCall(sessionall.session, "ACTIVE", "", callback, dialogId)
          })
        }
      }
    }
  };

  sessionall.session.invite(holdOptions)
    .catch((errorr) => {
      console.error("==>> SIPJS Console => Failed to unhold the session -> ", errorr);
      error("generalError", loginid, checkErrorReason(errorr.message), callback);
    });
}
/**
 * Mute audio of a call.
 * This function is used to mute the audio of an ongoing call.
 *
 * @param {function} callback - The callback function to execute after muting the call audio.
 * @param {string} dialogId - The identifier for the call dialog to mute audio.
 * @returns {void}
 */
function phone_mute(callback, dialogId) {
  var res = lockFunction("phone_mute", 500); // --- seconds cooldown
  if (!res) return;
  var index = getCallIndex(dialogId);
  var sessionall = null
  if (index !== -1) {
    sessionall = calls[index];
  }
  if (!sessionall) {
    //console.warn("No session to toggle mute");
    error('invalidState', loginid, "invalid action mute_call", callback);
    return;
  }
  //for mute/unmute
  let peer = sessionall.session.sessionDescriptionHandler.peerConnection;
  let senders = peer.getSenders();

  if (!senders.length) return;

  //let that = this;
  // This will only disable the Audio Track
  senders.forEach(sender => {
    if (sender.track && sender.track.kind === "audio") {
      sender.track.enabled = false;
    }
  });
  const sysdate = new Date();
  var datetime = sysdate.toISOString();

  var data = {}
  data.response = calls[index].response;
  data.event = calls[index].event;
  data.response.dialog.participants[0].stateChangeTime = datetime;
  data.response.dialog.participants[0].mute = true;

  if (typeof callback === 'function') {
    var _sessionDialog = {}
    _sessionDialog.response = sessionall.response;
    _sessionDialog.event = sessionall.event;
    const eventCopy = JSON.parse(JSON.stringify(_sessionDialog))
    callback(eventCopy);
    SendPostMessage(eventCopy);
  }
}

/**
 * Unmute audio of a call.
 * This function is used to unmute the audio of an ongoing call.
 *
 * @param {function} callback - The callback function to execute after unmuting the call audio.
 * @param {string} dialogId - The identifier for the call dialog to unmute audio.
 * @returns {void}
 */
function phone_unmute(callback, dialogId) {
  var res = lockFunction("phone_unmute", 500); // --- seconds cooldown
  if (!res) return;
  var index = getCallIndex(dialogId);
  var sessionall = null
  if (index !== -1) {
    sessionall = calls[index];
  }
  if (!sessionall) {
    error('invalidState', loginid, "invalid action unmute_call", callback);
    return;
  }

  //for mute/unmute
  let peer = sessionall.session.sessionDescriptionHandler.peerConnection;
  let senders = peer.getSenders();

  if (!senders.length) return;

  //let that = this;
  // This will only enable the Audio Track
  senders.forEach(sender => {
    if (sender.track && sender.track.kind === "audio") {
      sender.track.enabled = true;
    }
  });

  const sysdate = new Date();
  var datetime = sysdate.toISOString();

  var data = {}
  data.response = calls[index].response;
  data.event = calls[index].event;
  data.response.dialog.participants[0].stateChangeTime = datetime;
  data.response.dialog.participants[0].mute = false;

  if (typeof callback === 'function') {
    var _sessionDialog = {}
    _sessionDialog.response = sessionall.response;
    _sessionDialog.event = sessionall.event;
    const eventCopy = JSON.parse(JSON.stringify(_sessionDialog))
    callback(eventCopy)
    SendPostMessage(eventCopy);    // consult Jazeb on this
  }
}
/**
 * Respond to an incoming call.
 * This function is used to answer an incoming call or perform specific actions based on the call type.
 *
 * @param {function} callback - The callback function to execute after responding to the call.
 * @param {string} dialogId - The identifier for the incoming call dialog.
 * @param {string} type - Type of response: "audio", "video", "onlyviewscreenshare", or "screenshare".
 * @returns {void}
 */
function respond_call(callback, dialogId, type) {
  var res = lockFunction("respond_call", 500); // --- seconds cooldown
  if (!res) return;
  var index = getCallIndex(dialogId);
  var sessionall = null
  if (index !== -1) {
    sessionall = calls[index].session;
  }
  if (!sessionall || sessionall.state === SIP.SessionState.Established) {
    if (typeof callback === "function")
      error('invalidState', loginid, "invalid action answerCall", callback);
    return;
  }

  globalEventCallback = callback

  // answer a call
  if (sessionall.status === SIP.SessionState.Established) {
    console.log('==>> SIPJS CONSOLE => Call already answered');
  } else {
    // var sdp = sessionall.request.body;
    // var offeredAudio = false, offeredVideo = false;

    // if ((/\r\nm=audio /).test(sdp)) {
    //     offeredAudio = true;
    // }

    // if ((/\r\nm=video /).test(sdp)) {
    //     offeredVideo = true;
    // }
    sessionall.delegate = inviteDelegate
    let sessionDescriptionHandlerOption = {
      constraints: {
        audio: true,
        video: false,
        action: "",
        mediaType: ""
      },
      offerOptions: {
        offerToReceiveAudio: true,
        offerToReceiveVideo: false
      },
      iceGatheringTimeout: 500
    }
    if (type === "audio") {
      sessionDescriptionHandlerOption.constraints.audio = true
      sessionDescriptionHandlerOption.constraints.video = false
      sessionDescriptionHandlerOption.constraints.action = "CALL_ANSWER"
      sessionDescriptionHandlerOption.constraints.mediaType = "AUDIO"
      sessionDescriptionHandlerOption.offerOptions.offerToReceiveAudio = true
      sessionDescriptionHandlerOption.offerOptions.offerToReceiveVideo = false
    }
    else if (type === "video") {
      sessionDescriptionHandlerOption.constraints.audio = true
      sessionDescriptionHandlerOption.constraints.video = true
      sessionDescriptionHandlerOption.constraints.action = "CALL_ANSWER"
      sessionDescriptionHandlerOption.constraints.mediaType = "VIDEO"
      sessionDescriptionHandlerOption.offerOptions.offerToReceiveAudio = true
      sessionDescriptionHandlerOption.offerOptions.offerToReceiveVideo = true
    }
    else if (type === "screenshare") {
      sessionDescriptionHandlerOption.constraints.audio = true
      sessionDescriptionHandlerOption.constraints.video = "screenshare"
      sessionDescriptionHandlerOption.constraints.action = "CALL_ANSWER"
      sessionDescriptionHandlerOption.constraints.mediaType = "SCREENSHARE"
      sessionDescriptionHandlerOption.offerOptions.offerToReceiveAudio = true
      sessionDescriptionHandlerOption.offerOptions.offerToReceiveVideo = true
    }
    else if (type === "onlyviewscreenshare") {
      sessionDescriptionHandlerOption.constraints.audio = true
      sessionDescriptionHandlerOption.constraints.video = true
      sessionDescriptionHandlerOption.constraints.action = "CALL_ANSWER"
      sessionDescriptionHandlerOption.constraints.mediaType = "ONLYVIEWSCREENSHARE"
      sessionDescriptionHandlerOption.offerOptions.offerToReceiveAudio = true
      sessionDescriptionHandlerOption.offerOptions.offerToReceiveVideo = true
    }

    var temp_session = null
    if (index !== -1) {
      temp_session = calls[index];
    }
    if (temp_session.additionalDetail) {
      temp_session.additionalDetail.localMediaType = type
    }
    else {
      temp_session.additionalDetail = {
        localMediaType: type
      }
    }

    sessionall.accept({
      sessionDescriptionHandlerOptions: sessionDescriptionHandlerOption
    }).then((res) => {
      console.log('==>> SIPJS CONSOLE => Call Accepted : ', type)
      dialogStatedata.response.dialog.mediaType = type

      if (type === "onlyviewscreenshare") {
        let peer = sessionall.sessionDescriptionHandler.peerConnection;
        let senders = peer.getSenders();
        senders.forEach(async sender => {
          if (sender && sender.track && sender.track.kind === "video") {
            sender.track.stop()
          }
        })
      }

      // Send Message to Customer / Agent about agent Extention
      agentDetailsToOtherParticiapnt(dialogId)
    }).catch((e) => {
      console.error("==>> SIPJS CONSOLE => respond_call FAILED -> ", e)
      error("generalError", loginid, checkErrorReason(e.message), callback);
    });
    video = true;
    sessionall = sessionall;

  }
}

/**
 * Toggle stream on/off for a given dialog.
 *
 * @param {string} dialogId - The ID of the dialog for which stream conversion is performed.
 * @param {function} callback - The callback function to execute after stream conversion.
 * @param {string} streamType - The type of stream to convert (video / screen-share).
 * @param {string} streamStatus - The status to set for the stream (on / off).
 * @returns {void}
 */
function callConvert(dialogId, callback, streamType, streamStatus) {
  var res = lockFunction("callConvert", 500); // --- seconds cooldown
  if (!res) return;
  const undefinedParams = checkUndefinedParams(callConvert, [streamType, streamStatus, callback, dialogId]);

  if (undefinedParams.length > 0) {
    // console.log(`Error: The following parameter(s) are undefined or null: ${undefinedParams.join(', ')}`);
    error("generalError", loginid, `Error: The following parameter(s) are undefined or null or empty: ${undefinedParams.join(', ')}`, callback);
    return;
  }
  var index = getCallIndex(dialogId);
  var sessionall = null
  if (index !== -1) {
    sessionall = calls[index].session;
  }

  if (!sessionall) {
    error('invalidState', loginid, "invalid action ConvertCall", callback);
    return;
  }

  /****/
  var _tempSession = calls[index]
  /****/

  let peer = sessionall.sessionDescriptionHandler.peerConnection;
  let senders = peer.getSenders();
  if (!senders.length) return;

  var videoTrackcheck = false
  const sysdate = new Date();

  if (streamStatus === "off") {
    senders.forEach(sender => {
      if (sender.track && sender.track.kind === "video") {
        sender.track.stop()
      }
    });
    _tempSession.additionalDetail.localMediaType = "audio"
    setupRemoteMedia(sessionall, callback, dialogId)
    publishMediaStreamUpdateEvent(dialogId, streamType, streamStatus, callback)
    return
  }

  senders.forEach(async sender => {
    if (sender && sender.track && sender.track.kind && sender.track.kind === "video") {
      videoTrackcheck = true
      if (sender.track.readyState === "live") {
        sender.track.stop()
      }

      var sysdate1 = new Date();
      var datetime = sysdate1.toISOString();

      if (streamType === "video") {
        await navigator.mediaDevices.getUserMedia({ video: true }).then(async (videoStream) => {
          let videoTrack = videoStream.getVideoTracks()[0]
          await sender.replaceTrack(videoTrack)
          _tempSession.additionalDetail.localMediaType = "video"
          setupRemoteMedia(sessionall, callback, dialogId)
        }).catch(async (errors) => {
          var customResponse = await mediaDeviceErrors(errors.name, "video")
          console.error("==>> SIPJS CONSOLE => callConvert Turing on Camera Failed -> ", customResponse)
          error('generalError', loginid, `${customResponse.alert}`, callback);

          const _mediaStreamUpdate = createMediaStreamUpdateEvent(
            {
              loginId: loginid,
              status: "error",
              dialogId: dialogId,
              eventRequest: "local",
              stream: streamType,
              streamStatus: streamStatus,
              errorReason: customResponse.reason
            });

          callback(_mediaStreamUpdate);
          SendPostMessage(_mediaStreamUpdate);

          const mediaPermissionStatus = createMediaPermissionStatusUpdateEvent(dialogId, "video", "denied", customResponse.alert)
          callback(mediaPermissionStatus);
          SendPostMessage(mediaPermissionStatus);

          return Promise.reject(customResponse.alert)
        })
      }
      else if (streamType === "screenshare") {
        await navigator.mediaDevices.getDisplayMedia({ video: true }).then(async (videoStream) => {
          let videoTrack = videoStream.getVideoTracks()[0]
          await sender.replaceTrack(videoTrack);
          _tempSession.additionalDetail.localMediaType = "screenshare"
          setupRemoteMedia(sessionall, callback, dialogId)
        }).catch(async (errors) => {
          var customResponse = await displayDeviceErrors(errors.name)
          console.error("==>> SIPJS CONSOLE => callConvert Turing on Screen-share Failed -> ", customResponse)
          error('generalError', loginid, `${customResponse.alert}`, callback);

          const _mediaStreamUpdate = createMediaStreamUpdateEvent(
            {
              loginId: loginid,
              status: "error",
              dialogId: dialogId,
              eventRequest: "local",
              stream: streamType,
              streamStatus: streamStatus,
              errorReason: customResponse.reason
            });

          callback(_mediaStreamUpdate);
          SendPostMessage(_mediaStreamUpdate);

          return Promise.reject(customResponse.alert)
        })
      }

      publishMediaStreamUpdateEvent(dialogId, streamType, streamStatus, callback)

    }
  })

  if (!videoTrackcheck) {
    _tempSession.additionalDetail.localMediaType = streamType
    sendingReInvite(dialogId, callback, streamType)
  }
}

function addsipcallback(temp_session, call_type, callback) {
  try {
    //
    remotesession = temp_session;
    temp_session.stateChange.addListener(async (newState) => {
      console.log(newState);
      var dialogId;
      if (temp_session.incomingInviteRequest) {
        dialogId = temp_session.incomingInviteRequest.message.headers["X-Call-Id"] != undefined ? temp_session.incomingInviteRequest.message.headers["X-Call-Id"][0]['raw'] : temp_session.incomingInviteRequest.message.headers["Call-ID"][0]['raw'];
      } else {
        dialogId = temp_session.outgoingRequestMessage.headers["X-Call-Id"] != undefined ? temp_session.outgoingRequestMessage.headers["X-Call-Id"][0]['raw'] : temp_session.outgoingRequestMessage.headers["Call-ID"][0];
      }
      var index = getCallIndex(dialogId);
      var sessionall = null
      if (index != -1) {
        dialogStatedata.response = calls[index].response;
      }
      switch (newState) {
        case SIP.SessionState.Establishing:
          console.log("==>> SIPJS CONSOLE => Ringing");

          break;
        case SIP.SessionState.Established:
          console.log("==>> SIPJS CONSOLE => Answered");

          dialogStatedata = null
          dialogStatedata = calls[0]

          temp_session = null
          temp_session = calls[0].session

          setupRemoteMedia(temp_session, callback, dialogId);


          var call_type1;
          if (temp_session.incomingInviteRequest) {

            if (temp_session.incomingInviteRequest.message.from._displayName === 'conference') {
              call_type1 = 'conference'
            } else {
              call_type1 = 'incoming'
            }
          } else {
            call_type1 = 'outbound'
          }
          const sysdate = new Date();
          var datetime = sysdate.toISOString();
          temp_session.startTime = datetime;

          // console.log(event);
          if (call_type != 'inbound') {
            call_variable_array = [];
            if (temp_session.outgoingRequestMessage.headers['X-Call-Variable0']) {
              call_variable_array.push({
                "name": 'callVariable0',
                "value": data.headers['X-Call-Variable0'][0]['raw']
              })
            } else {
              call_variable_array.push({
                "name": 'callVariable0',
                "value": ''
              })
            }
            for (let index = 1; index < 10; index++) {
              if (temp_session.outgoingRequestMessage.headers['X-Call-Variable' + index]) {
                call_variable_array.push({
                  "name": 'callVariable' + index,
                  "value": data.headers['X-Call-Variable' + index]
                })
              }
            }
            dialogStatedata.response.dialog.callVariables.CallVariable = call_variable_array;
            dialogStatedata.response.dialog.participants[0].stateChangeTime = datetime;
            dialogStatedata.response.dialog.participants[0].startTime = datetime;
            dialogStatedata.response.dialog.participants[0].state = "ACTIVE";
            dialogStatedata.response.dialog.state = "ACTIVE";
            dialogStatedata.response.dialog.isCallEnded = 0;
          } else {
            dialogStatedata.response.dialog.participants[0].stateChangeTime = datetime;
            dialogStatedata.response.dialog.participants[0].startTime = datetime;
            dialogStatedata.response.dialog.participants[0].state = "ACTIVE";
            dialogStatedata.response.dialog.state = "ACTIVE";
            dialogStatedata.response.dialog.isCallEnded = 0;

          }
          var data = {}
          data.event = dialogStatedata.event
          data.response = dialogStatedata.response
          var dialogstatemedia = JSON.parse(JSON.stringify(data));
          dialogstatemedia.response.dialog.participants[0].mute = false;
          callback(dialogstatemedia);
          SendPostMessage(dialogstatemedia);
          if (index != -1) {
            calls[index].response = dialogStatedata.response;
            if (dialogStatedata.response.dialog.callType == "OUT" || dialogStatedata.response.dialog.callType == "OTHER_IN" || dialogStatedata.response.dialog.callType == "MONITORING") {
              calls[index].event = "dialogState";
            }
            // removing Dummy Video & Publish Event
            removeDummyTracks(dialogStatedata.response.dialog.id, callback)
          }

          break;
        case SIP.SessionState.Terminated:
          console.log("==>> SIPJS CONSOLE => Ended");

          dialogStatedata = null
          dialogStatedata = calls[0]

          var sysdate1 = new Date();
          var datetime = sysdate1.toISOString();
          if (dialogStatedata != null) {
            dialogStatedata.response.dialog.participants[0].mute = false;
            dialogStatedata.response.dialog.participants[0].stateChangeTime = datetime;
            dialogStatedata.response.dialog.participants[0].state = "DROPPED";
            if (dialogStatedata.response.dialog.callEndReason == "direct_transfered" ||
              dialogStatedata.response.dialog.callEndReason == "External_direct_transfered" ||
              dialogStatedata.response.dialog.callEndReason == "EXTERNAL_ATTENDED_TRANSFER" ||
              dialogStatedata.response.dialog.callEndReason == "ATTENDED_TRANSFER" ||
              dialogStatedata.response.dialog.callEndReason == "CONSULT_CONFERENCE" ||
              dialogStatedata.response.dialog.callEndReason == "ATTENDED_CONFERENCE" ||
              dialogStatedata.response.dialog.callEndReason == "BARGE_CONFERENCE" ||
              dialogStatedata.response.dialog.callEndReason == "EXTERNAL_CONSULT_CONFERENCE") {
              //  dialogStatedata.response.dialog.callEndReason = "transfered";
              dialogStatedata.response.dialog.isCallEnded = 0;
            } else {
              // dialogStatedata.response.dialog.callEndReason = null;
              dialogStatedata.response.dialog.isCallEnded = 1;
            }
            dialogStatedata.response.dialog.state = "DROPPED";
            dialogStatedata.response.dialog.isCallAlreadyActive = false;
            var data = {}
            data.event = dialogStatedata.event
            data.response = dialogStatedata.response
            const dialogStatedataCopy = JSON.parse(JSON.stringify(data));
            callback(dialogStatedataCopy);
            console.log('==>> SIPJS CONSOLE -> Call EndReason :', dialogStatedata.response.dialog.callEndReason);
            SendPostMessage(dialogStatedataCopy);
            dialogStatedata.response.dialog.callEndReason = null;
            // clearTimeout(myTimeout);
          }
          // End All Calls if C1 Leaves
          dialogId = dialogStatedata.response.dialog.id
          await terminateAllRemainingCalls().then(() => {
            calls.splice(index, 1)
          })
          break;
      }
    });
    temp_session.delegate = {
      onCancel: (invitation) => {
        console.log("==>> SIPJS CONSOLE => onCancel received", invitation);
        var dialogId;
        if (temp_session.incomingInviteRequest) {
          dialogId = temp_session.incomingInviteRequest.message.headers["X-Call-Id"] != undefined ? temp_session.incomingInviteRequest.message.headers["X-Call-Id"][0]['raw'] : temp_session.incomingInviteRequest.message.headers["Call-ID"][0]['raw'];
        } else {
          dialogId = temp_session.outgoingRequestMessage.message.headers["X-Call-Id"] != undefined ? temp_session.outgoingRequestMessage.message.headers["X-Call-Id"][0]['raw'] : temp_session.outgoingRequestMessage.message.headers["Call-ID"][0]['raw'];
        }
        var index = getCallIndex(dialogId);
        var sessionall = null
        if (index != -1) {
          sessionall = calls[index]
        }
        const match = invitation.incomingCancelRequest.data.match(/text="([^"]+)"/);

        if (match && match[1]) {
          sessionall.response.dialog.callEndReason = match[1];
        } else {
          sessionall.response.dialog.callEndReason = "Canceled";
        }
        //invitation.accept();
      },
      onFailed: (invitation) => {
        console.log("==>> SIPJS CONSOLE => onFailed received", invitation);
        //invitation.accept();
      },
      onAccepted: (invitation) => {
        console.log("==>> SIPJS CONSOLE => onAccepted received", invitation);
        //invitation.accept();
      },
      onrejectionhandled: (invitation) => {
        console.log("==>> SIPJS CONSOLE => onrejectionhandled received", invitation);
        //invitation.accept();
      },
      onunhandledrejection: (invitation) => {
        console.log("==>> SIPJS CONSOLE => onunhandledrejection received", invitation);
        //invitation.accept();
      },
      onTerminated: (invitation) => {
        console.log("==>> SIPJS CONSOLE => onTerminated received", invitation);
        //invitation.accept();
      },
      onTerminate: (invitation) => {
        console.log("==>> SIPJS CONSOLE => onTerminate received", invitation);
        //invitation.accept();
      },
      onRefer: (refer) => {
        console.log('==>> SIPJS CONSOLE => onRefer received : ', refer)
      }

    };
    //

  } catch (e) {
    console.error("==>> SIPJS CONSOLE => Error on addSipCallback : ", e);
    error('generalError', loginid, checkErrorReason("CUSTOM_UNKNOWN_ERROR"), callback);
  }
}
/**
 * Send DTMF tones in a session.
 *
 * @param {string} message - The DTMF message to send.
 * @param {string} dialogId - The ID of the dialog where DTMF tones will be sent.
 * @param {function} callback - The callback function to execute after sending DTMF.
 * @returns {void}
 */
function sendDtmf(message, dialogId, callback) {
  var index = getCallIndex(dialogId);
  var sessionall = null
  if (index !== -1) {
    sessionall = calls[index];
    if (sessionall.session.state !== SIP.SessionState.Established) {
      if (typeof callback === "function")
        error('invalidState', loginid, "invalid action SendDtmf", callback);
      return;
    }
    if (sessionall.response.dialog.state == "HELD") {
      console.log("==>> SIPJS CONSOLE => Blocking DTMF during Hold !")
      return
    }
    const options = {
      requestOptions: {
        body: {
          contentDisposition: "render",
          contentType: "application/dtmf-relay",
          content: "Signal=" + message + "\r\nDuration=150"
        }
      },
      requestDelegate: {
        onAccept: (response) => {
          console.log("==>> SIPJS Console => DTMF onAccept")
          var event = {
            "event": "DTMF",
            "response":
            {
              "loginId": loginid,
              "type": 1,
              "description": "Success",
            }
          }
          const eventCopy = JSON.parse(JSON.stringify(event));
          callback(eventCopy);
          SendPostMessage(eventCopy);
        },
        onReject: (response) => {
          console.log("==>> SIPJS Console => DTMF onReject", response)
          error("generalError", loginid, checkErrorReason("DTMF_Transaction_Error"), callback);
        }
      }
    };
    sessionall.session.info(options)
      .catch((error) => {
        // Actions when DTMF fails
        console.error("==>> SIPJS CONSOLE => Error Sending Dtmf :", error);
        var event = {
          "event": "DTMF",
          "response":
          {
            "loginId": loginid,
            "type": 0,
            "description": "Failed " + error,
          }
        }
        const eventCopy = JSON.parse(JSON.stringify(event));
        callback(eventCopy);
        SendPostMessage(eventCopy);
      });;
  }
}

window.addEventListener('beforeunload', (event) => {
  //need to check here.
  var droppedReason = loginid + "_REFRESH"
  terminateAllCalls(droppedReason);
  call_variable_array = {};
  dialogStatedata = null;
  invitedata = null;
  outboundDialingdata = null;
  if (userAgent) userAgent.stop()
});
if (window.addEventListener)
  window.addEventListener("message", function (e) {
    if (e.data.SourceType == 'CTI' && e.data.calledNumber) {
      initiate_call(e.data.calledNumber, e.data.Destination_Number, "audio", callbackFunction, e.data.callType, "0000");
    }
  });

function loader3(callback) {
  if (!userAgent || !registerer) {
    error("invalidState", '', 'Invalid action logout', callback);
  } else {
    // Send un-REGISTER
    var droppedReason = loginid + "_FORCE-LOGOUT"
    terminateAllCalls(droppedReason)
    setTimeout(() => {
      // console.log(registerer.state);
      console.log("==>> SIPJS CONSOLE => Logout Current Agent")
      registerer.unregister()
        .then((request) => {
          console.log("==>> SIPJS CONSOLE => Successfully Sent UN-Register request = " + request);
        })
        .catch((error) => {
          console.error("==>> SIPJS CONSOLE => Failed to send un-REGISTER", error);
        });
    }, 500); // Because for now, there can be a maximum of two calls.
  }
}

function error(type, loginid, cause, callback) {
  if (typeof callback !== 'function') {
    console.error("invalid call back function");
    return;
  }
  const sysdate = new Date();
  let datetime = sysdate.getFullYear() + '-' + (sysdate.getMonth() + 1) + '-' + sysdate.getDate() + ' ' + sysdate.getHours() + ':' + sysdate.getMinutes() + ':' + sysdate.getSeconds() + '.' + sysdate.getMilliseconds()
  let event = {
    "event": "Error",
    "response":
    {
      "type": type,
      "loginId": loginid,
      "description": cause,
      'event_time': datetime
    }
  };
  const eventCopy = JSON.parse(JSON.stringify(event));
  callback(eventCopy);
  SendPostMessage(eventCopy);
}

var Errors = {
  errorMediaDevice: {
    "NotAllowedError": {
      "reason": "",
      "alert": ""
    },
    "PermissionDeniedError": {
      "reason": "",
      "alert": ""
    },
    "NotFoundError": {
      "reason": "Audio/Video Device Not Found. Please make sure your Audio/Video Device are working",
      "alert": "Audio/Video Device Not Found. Please make sure your Audio/Video Device are working"
    },
    "NotReadableError": {
      "reason": "Audio/Video Device is being used by Someother Party",
      "alert": "Audio/Video Device is being used by Someother Party"
    },
    "OverconstrainedError": {
      "reason": "The specified constraints cannot be satisfied by any of the available devices.",
      "alert": "Requested media constraints cannot be met. Please adjust the constraints and try again."
    },
    "SecurityError": {
      "reason": "The user agent blocked access to the media devices for security reasons.",
      "alert": "Access to media devices is blocked due to security reasons. Ensure the page is served over HTTPS and try again."
    },
    "AbortError": {
      "reason": "The operation was aborted, possibly due to user intervention or other interruptions.",
      "alert": "The operation was aborted. Please try again."
    },
    "TypeError": {
      "reason": "The constraints object passed to getUserMedia is not valid.",
      "alert": "Invalid constraints provided. Please check the constraints and try again."
    }
  },
  errorsList: {
    "Forbidden": "Invalid Credentials. Please provide valid credentials.",
    "websocketissue_unhold": "websocketissue_unhold",  //unHold Failed due to Network Issue
    "customer_left": "customer_left",                  //When Customer Leave during Network Disconnection
    "Microphone_denied": "Microphone permission denied. Please enable.",
    "Camera_denied": "Camera permission denied. Please enable.",
    "Screen_denied": "Screen Share permission denied. Please allow it.",
    "Microphone permission denied. Please enable.": "Microphone permission denied. Please enable.",
    "Camera permission denied. Please enable.": "Camera permission denied. Please enable.",
    "Screen Share permission denied. Please allow it.": "Screen Share permission denied. Please allow it.",
    "Uri_Error": "sipconfig.uri is null & undefined",
    "Invalid_URI": "Invalid URI",
    "NO-DIALPLAN-FOUND": "No Dialplan Found",
    "ON-ANOTHER-CALL": "User is on Another Call",
    "INVALID_GATEWAY": "Something Wrong with SIP trunk / Gateway",
    "Address Incomplete": "Something Wrong with SIP trunk / Gateway",
    "GATEWAY_DOWN": "Something Wrong with SIP trunk / Gateway",
    "Not Found": "Something Wrong with SIP trunk / Gateway",
    "OB_Transaction_Error": "OB_Transaction_Error",
    "DTMF_Transaction_Error": "DTMF_Transaction_Error",
    "Stream_Transaction_Error": "Stream_Transaction_Error",
    "Stream_Request_Error": "Something went wrong while turing on Video/Screen-share",
    "Session.getOffer unknown error.": "Session.getOffer unknown error.",
    "Session.setOfferAndGetAnswer unknown error.": "Session.setOfferAndGetAnswer unknown error.",
    "User_Not_Registered": "User is not Registered",
    "Reinvite in progress. Please wait until complete, then try again.": "Please Wait until Previous action is Completed",
    "Consult_Customer_left": "Cannot consult when Customer Call doesn't Exists",
    "Unknown": "Something went wrong",    // addsicallback function error
    "USER_BUSY": "USER BUSY",
    "Busy Here": "Call Not Connected",
    "Decline": "Call Not Connected",
    "Temporarily Unavailable": "Call Not Connected",
    "Request Terminated": "Request Terminated",
    "Invalid signaling state have-local-offer": "Something Went wrong with Signalling State, Please Contact your Supervisor",
    "Invalid signaling state have-local-pranswer": "Something Went wrong with Signalling State, Please Contact your Supervisor",
    "Invalid signaling state have-remote-offer": "Something Went wrong with Signalling State, Please Contact your Supervisor",
    "Invalid signaling state have-remote-pranswer": "Something Went wrong with Signalling State, Please Contact your Supervisor",
    "Invalid signaling state closed": "Something Went wrong with Signalling State, Please Contact your Supervisor",
    "CUSTOM_UNKNOWN_ERROR": "Reason unknown",
    "NORMAL_CLEARING": "NORMAL_CLEARING",
    "ORIGINATOR_CANCEL": "ORIGINATOR_CANCEL",
    "Rejected": "Rejected",
    "MANAGER_REQUEST": "MANAGER_REQUEST",
    "Call completed elsewhere": "Call completed elsewhere",
    "LOSE_RACE": "Call Not Connected",
    "SYSTEM_SHUTDOWN": "SYSTEM_SHUTDOWN",
    "CALL_REJECTED": "Call Not Connected",
    "INCOMPATIBLE_DESTINATION": "Call Not Connected",
    "NORMAL_TEMPORARY_FAILURE": "Call Not Connected",
    "RECOVERY_ON_TIMER_EXPIRE": "Call Not Connected",
  }
};



// Number of times to attempt reconnection before giving up
const reconnectionAttempts = 20;
// Number of seconds to wait between reconnection attempts
const reconnectionDelay = 5;

// Used to guard against overlapping reconnection attempts
let attemptingReconnection = false;
// If false, reconnection attempts will be discontinued or otherwise prevented
let shouldBeConnected = true;

// Function which recursively attempts reconnection
const attemptReconnection = (reconnectionAttempt = 1) => {
  // If not intentionally connected, don't reconnect.
  if (!shouldBeConnected) {
    return;
  }

  // Reconnection attempt already in progress
  if (attemptingReconnection) {
    return;
  }

  // Reconnection maximum attempts reached
  if (reconnectionAttempt > reconnectionAttempts) {
    // maximum reconnect reached, logout Agent
    console.log("==>> SIPJS Console => Maximum Reconnected Reached. ")
    return;
  }

  // We're attempting a reconnection
  attemptingReconnection = true;

  setTimeout(() => {
    // If not intentionally connected, don't reconnect.
    if (!shouldBeConnected) {
      attemptingReconnection = false;
      return;
    }
    // Attempt reconnect
    userAgent.reconnect()
      .then(() => {
        // Reconnect attempt succeeded
        attemptingReconnection = false;
      })
      .catch((error) => {
        // Reconnect attempt failed
        console.error("==>> SIPJS Console => Reconnection Attempt Failed, trying again : ", error)
        var event = {
          event: "xmppEvent",
          response: {
            loginId: loginid,
            type: "OUT_OF_SERVICE",
            description: error.message
          }
        };
        // console.log("==>> SIPJS Console => EVENT ->",event)
        if (typeof globalEventCallback === "function") globalEventCallback(event)

        attemptingReconnection = false;
        attemptReconnection(++reconnectionAttempt);
      });
  }, reconnectionAttempt === 1 ? 0 : reconnectionDelay * 1000);
};

/**
 * Set up remote stream and local stream to UI Element after the call is in Established state.
 *
 * @param {Object} session - The session in Established state.
 * @param {Function} callback - The callback function to execute after setting up media.
 */
function setupRemoteMedia(session, callback, dialogId) {
  var pc = session.sessionDescriptionHandler.peerConnection;
  var remoteStream;
  remoteStream = new MediaStream();
  var sendersize = pc.getSenders().length;
  console.log('==>>  SIPJS CONSOLE => Sender RTPSenders size is ', sendersize);
  var receiversize = pc.getReceivers().length;
  console.log('==>>  SIPJS CONSOLE => Receivers RTPReceivers size is ', receiversize);
  var receiver = pc.getReceivers()[0];
  var receivervideo = pc.getReceivers()[1];
  remoteStream.addTrack(receiver.track);

  var index = getCallIndex(dialogId)
  var _sessionall = null
  if (index !== -1) {
    _sessionall = calls[index]
  }
  if (!_sessionall) {
    return
  }

  // audio, video and screenshare
  if (_sessionall.additionalDetail.remoteMediaType == "video" || _sessionall.additionalDetail.remoteMediaType == "screenshare") {
    if (receivervideo) {
      console.log('==>> SIPJS CONSOLE => video found');
      remoteStream.addTrack(receivervideo.track);
    }
  }
  remote_stream = remoteStream;
  setTimeout(() => {

    if (document.getElementById('remoteVideo')) {
      console.log("document.getElementById('remoteVideo').srcObject", document.getElementById('remoteVideo').srcObject)
      document.getElementById('remoteVideo').srcObject = remoteStream;
    } else {
      console.error("Element with ID 'remoteVideo' does not exist.");
    }


    // var remoteVideo = document.getElementById('remoteVideo');
    // if (remoteVideo) remoteVideo.srcObject = remoteStream;
    console.log('<== remote Stream Audio Track:', remoteStream.getAudioTracks());
    console.log('<== remote Video Tag:', document.getElementById('remoteVideo'));
    console.log('<== remote Stream Video Track:', remoteStream.getVideoTracks());
  }, 2000)


  // var remoteVideo = document.getElementById('remoteVideo');
  // if (remoteVideo) remoteVideo.srcObject = remoteStream;


  // session.sessionDescriptionHandler.peerConnection.getReceivers().forEach((receiver) => {
  //     if (receiver.track) {
  //       remoteStream.addTrack(receiver.track);
  //     }
  //   });
  //   remoteVideo.srcObject = remoteStream;

  var localStream_1;
  if (pc.getSenders) {
    localStream_1 = new window.MediaStream();
    pc.getSenders().forEach(function (sender) {
      var track = sender.track;
      // audio, video and screenshare
      if (_sessionall.additionalDetail.localMediaType == "video" || _sessionall.additionalDetail.localMediaType == "screenshare") {

        if (track && track.kind === "video") {
          localStream_1.addTrack(track);

          //trigger when user press browser button of Stop Sharing
          // track.addEventListener('ended', (e) => {
          //   console.log("==>> SIPJS CONSOLE -> Screen Sharing / Video is Tured off -> ", e)
          //   _sessionall.additionalDetail.localMediaType = "audio"
          //   if (typeof session.incomingInviteRequest !== 'undefined') {
          //     let _dialogId = session.incomingInviteRequest.message.headers["X-Call-Id"] != undefined ? session.incomingInviteRequest.message.headers["X-Call-Id"][0]['raw'] : session.incomingInviteRequest.message.headers["Call-ID"][0]['raw'];
          //     setupRemoteMedia(session, callback, _dialogId)
          //     publishMediaStreamUpdateEvent(_dialogId, "screenshare", "off", callback)
          //   }
          //   else if (typeof session.outgoingInviteRequest !== 'undefined') {
          //     let _dialogId = session.outgoingInviteRequest.message.headers["Call-ID"][0]
          //     setupRemoteMedia(session, callback, _dialogId)
          //     publishMediaStreamUpdateEvent(_dialogId, "screenshare", "off", callback)
          //   }
          // });
        }
      }
    });
  }
  else {
    localStream_1 = pc.getLocalStreams()[0];
  }

  var localVideo = document.getElementById('localVideo');
  if (localVideo) localVideo.srcObject = localStream_1;
  local_stream = localStream_1;
}


function registrationFailed(response) {
  //console.log('helo ',msg);
  error("subscriptionFailed", loginid, checkErrorReason(response.message.reasonPhrase), callbackFunction);
}

function getCallIndex(dialogId) {
  for (let index = 0; index < calls.length; index++) {
    var element = calls[index];
    if (element.response.dialog.id == dialogId) {
      return index;
    }
  }
  return -1;
}

function checkUndefinedParams(func, params) {
  const paramNames = getParameterNames(func);
  const undefinedParams = [];

  paramNames.forEach((paramName, index) => {
    const paramValue = params[index];
    if (paramValue === undefined || paramValue === null || paramValue === "") {
      undefinedParams.push(paramName);
    }
  });

  return undefinedParams;
}

function getParameterNames(func) {
  const functionString = func.toString();
  const parameterRegex = /function\s*\w*\s*\(([\s\S]*?)\)/;
  const match = parameterRegex.exec(functionString);
  if (match && match[1]) {
    return match[1].split(',').map(param => param.trim());
  }
  return [];
}

function SendPostMessage(data) {
  try {
    if (sipconfig.voicePostMessageSending == true) {
      var obj = JSON.stringify(data, getCircularReplacer());
      window.parent.postMessage(obj, "*"); // "*" means sending to all origins
      console.log("==>> SIPJS CONSOLE => SendPostMessage Sent !!")
    }
  } catch (e) {
    console.error("==>> SIPJS CONSOLE => Exception: ", e);
  }
}

const getCircularReplacer = () => {
  const seen = new WeakSet();
  return (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return;
      }
      seen.add(value);
    }
    return value;
  };
};

function terminateAllCalls(reason) {
  if (calls.length > 0) {
    for (let index = calls.length - 1; index >= 0; index--) {
      const sessionToEnd = calls[index];
      if (sessionToEnd.response.dialog.id) {
        if (!sessionToEnd) {
          console.log("==>> SIPJS CONSOLE => terminateAllCalls -> Session doesn't Exist")
          return;
        }
        var options = {
          requestOptions: {
            body: [],
            extraHeaders: [`X-Call-Dropped-Custom-Reason : ${reason}`]
          }
        }

        console.log('==>> SIPJS CONSOLE => Call State before Termination : ', sessionToEnd.session.state);
        switch (sessionToEnd.session.state) {
          case SIP.SessionState.Initial:
          case SIP.SessionState.Establishing:
            if (sessionToEnd.session instanceof SIP.Inviter) {
              sessionToEnd.session.cancel();
            } else {
              sessionToEnd.response.dialog.callEndReason = "Rejected";
              sessionToEnd.session.reject();
            }
            break;
          case SIP.SessionState.Established:
            sessionToEnd.response.dialog.callEndReason = reason;
            sessionToEnd.session.bye(options);
            break;
          case SIP.SessionState.Terminating:
          case SIP.SessionState.Terminated:
            break;
        }
      }
    }
  }
}

// Reusable function to check and set the lock state for a specific function
function lockFunction(funcName, delay) {
  if (!functionLocks[funcName]) {
    // If the function is not locked, lock it and allow execution
    functionLocks[funcName] = true;

    setTimeout(() => {
      // After the specified delay, unlock the function
      functionLocks[funcName] = false;
    }, delay);
    return true;
  } else {
    console.log(`${funcName} is not allowed to be called yet`);
    return false;
  }
}


function createMessage(message, dialogId) {
  var destination = 0
  var index = getCallIndex(dialogId);
  var sessionall = null
  if (index !== -1) {
    sessionall = calls[index];
  }
  if (!sessionall) {
    return
  }
  // callType = "OUT" means Call Initaited by Either Agent or Customer
  // by Customer means Call is from WebRTC
  // by Agent means Call is from SIP/OUTBOUND
  if (sessionall.response.dialog.callType == "OUT") {
    // if (dialogStatedata && dialogStatedata.response && dialogStatedata.response.dialog) {
    if (sessionall.additionalDetail.agentExt) destination = sessionall.additionalDetail.agentExt
    else {
      console.log("==>> SIPJS Console => createMessage -> Agent Extension is not defined")
      pendingEventNotification = message
      isPendingEventNotification = true
      return
    }
  }
  else {
    if (typeof sessionall.session.incomingInviteRequest !== 'undefined') {
      destination = sessionall.session.incomingInviteRequest.message.from.uri.normal.user
    }
    else if (typeof sessionall.session.outgoingInviteRequest !== 'undefined') {
      destination = sessionall.session.outgoingInviteRequest.message.to.uri.normal.user
    }
  }
  const message_targetUri_value = new SIP.URI("sip", destination, sipconfig.uriFs)
  sendMessage(message_targetUri_value, message)
}

/**
 * Internal function used to convert an audio call to a video call by sending a re-INVITE.
 *
 * @param {string} dialogId - The ID of the dialog/call.
 * @param {Function} callback - The callback function to be executed after sending the re-INVITE.
 * @param {string} streamType - The type of stream to be added ('audio' or 'video').
 */
function sendingReInvite(dialogId, callback, streamType) {

  var res = lockFunction("sendingReInvite", 1000); // --- seconds cooldown
  if (!res) return;
  var index = getCallIndex(dialogId);
  var sessionall = null
  if (index !== -1) {
    sessionall = calls[index].session;
  }

  if (!sessionall) {
    console.log("==>> SIPJS CONSOLE => Sending ReInvite -> No Session Found / invalid action sendingReInvite")
    return;
  }

  var _functionCallerName = arguments.callee.caller.name


  let peer = sessionall.sessionDescriptionHandler.peerConnection;
  let senders = peer.getSenders();
  if (!senders.length) return;


  let sessionDescriptionHandlerOption = {
    constraints: {
      audio: true,
      video: false
    },
    offerOptions: {
      iceRestart: true,
      offerToReceiveAudio: true,
      offerToReceiveVideo: false

    },
    iceGatheringTimeout: 500
  }

  if (streamType === "video") {


    sessionDescriptionHandlerOption.constraints.audio = true
    sessionDescriptionHandlerOption.constraints.video = true
    sessionDescriptionHandlerOption.offerOptions.offerToReceiveAudio = true
    sessionDescriptionHandlerOption.offerOptions.offerToReceiveVideo = true

  }
  else if (streamType === "screenshare") {

    sessionDescriptionHandlerOption.constraints.audio = true
    sessionDescriptionHandlerOption.constraints.video = "screenshare"
    sessionDescriptionHandlerOption.offerOptions.offerToReceiveAudio = true
    sessionDescriptionHandlerOption.offerOptions.offerToReceiveVideo = true

  }

  const updateCallOptions = {
    sessionDescriptionHandlerOptions: sessionDescriptionHandlerOption,
    requestDelegate: {
      onAccept: () => {
        console.log("==>> SIPJS Console => sendingReInvite onAccept")
        console.log("==>> SIPJS Console => Session converted successfully.");
        const sysdate = new Date();
        var datetime = sysdate.toISOString();
        if (_functionCallerName !== "mediaStreamUpdateEvent") {
          console.log("==>> SIPJS Console => Call is converting, Manually triggered")
          var data = {}
          data.response = calls[index].response;
          data.event = calls[index].event;
          data.response.dialog.participants[0].stateChangeTime = datetime;
          data.response.dialog.isCallAlreadyActive = true;

          calls[index].additionalDetail.localMediaType = streamType

          if (typeof callback === 'function') {
            const dataCopy = JSON.parse(JSON.stringify(data));
            callback(dataCopy);
            SendPostMessage(dataCopy);
          }

          publishMediaStreamUpdateEvent(dialogId, streamType, "on", callback)
        }
        else {
          console.log("==>> SIPJS Console => Call is converting, Automatic triggered")
          // remove video Tag
          let peer = sessionall.sessionDescriptionHandler.peerConnection;
          let senders = peer.getSenders();
          console.log(senders)
          senders.forEach(async sender => {
            if (sender && sender.track && sender.track.kind === "video") {
              sender.track.stop()
            }
          })
        }
        var _tempSession = calls[index]
        _tempSession.additionalDetail.remoteVideoDisplay = true
        setupRemoteMedia(sessionall, callback, dialogId)

      },
      onReject: async (response) => {
        console.log("==>> SIPJS Console => sendingReInvites onReject -> ", response)

        sessionall.dialog.signalingStateRollback();
        sessionall.sessionDescriptionHandler.peerConnection.setLocalDescription({ type: "rollback" })

        calls[index].additionalDetail.localMediaType = "audio"
        // for some reason SDP is updated
        calls[index].additionalDetail.remoteVideoDisplay = true
        DisableVideoTrack(sessionall)

        if (response.message.reasonPhrase == "Service Unavailable" || response.message.reasonPhrase == "Request Timeout") {
          error("generalError", loginid, checkErrorReason("Stream_Transaction_Error"), callback);
          return
        }
      }
    }
  };
  sessionall.invite(updateCallOptions)
    .catch(async (errorr) => {
      console.error("==>> SIPJS CONSOLE => Failed to Convert the session -> ", errorr);
      calls[index].additionalDetail.localMediaType = "audio"
      error('generalError', loginid, checkErrorReason("Stream_Request_Error"), callback);
      // there can be any reason for this, update the local Media stream back to audio
      sessionall.sessionDescriptionHandler.localMediaStreamConstraints.video = false
    });
}

/**
 * Function used to identify what kind of media device error occurred.
 *
 * @param {string} errorName - The name of the media device error.
 * @param {Object} constraints - The constraints related to the media device.
 * @returns {Promise<void>} - A promise that resolves once the error is handled.
 */

async function mediaDeviceErrors(errorName, mediaType) {
  if (errorName === 'NotAllowedError' || errorName === 'PermissionDeniedError') {
    const permissions = await Promise.all([
      navigator.permissions.query({ name: 'camera' }),
      navigator.permissions.query({ name: 'microphone' })
    ]);
    var _alert = ""

    let denied_component = ""
    permissions.forEach((permission) => {
      // console.log(permission)
      if (permission.state === 'denied' || permission.state === 'prompt') {
        if (permission.name === "audio_capture" && mediaType == "audio") { denied_component = "Microphone" }
        if (permission.name === "video_capture" && mediaType == "video") { denied_component = "Camera" }
        _alert = `${denied_component} permission denied. Please enable.`;
      }
      // if (permission.state === 'prompt' && permission.name === "video_capture") {
      //     denied_component = "Screen-share"
      //     _alert = `Access to ${denied_component} is denied. Please enable it in your browser settings.`;
      // }
    });
    return {
      reason: "Permisssion Deined !!",
      alert: _alert
    };
  }
  else {
    if (Errors.errorMediaDevice.hasOwnProperty(errorName)) {
      return Errors.errorMediaDevice[errorName];
    } else {
      return {
        reason: checkErrorReason("CUSTOM_UNKNOWN_ERROR"),
        alert: checkErrorReason("CUSTOM_UNKNOWN_ERROR")
      };
    }
  }
}

async function displayDeviceErrors(errorName) {
  if (errorName === 'NotAllowedError' || errorName === 'PermissionDeniedError') {
    var _alert = ""
    _alert = `Screen Share permission denied. Please allow it.`;
    return {
      reason: "Permisssion Deined !!",
      alert: _alert
    };
  }
  else {
    if (Errors.errorMediaDevice.hasOwnProperty(errorName)) {
      return Errors.errorMediaDevice[errorName];
    } else {
      return {
        reason: checkErrorReason("CUSTOM_UNKNOWN_ERROR"),
        alert: checkErrorReason("CUSTOM_UNKNOWN_ERROR")
      };
    }
  }
}


function agentDetailsToOtherParticiapnt(dialogId) {
  var index = getCallIndex(dialogId);
  var sessionall = null
  if (index !== -1) {
    sessionall = calls[index];
  }
  if (!sessionall) {
    // error('invalidState', loginid, "invalid action agentDetailsToOtherParticiapnt", callback);
    console.log('==>> SIPJS CONSOLE => invalidState invalid action agentDetailsToOtherParticiapnt -> No Session FOUND');
    return;
  }
  if (sessionall.response && sessionall.response.dialog && (sessionall.response.dialog.callType == "OTHER_IN" /*|| sessionall.response.dialog.callType == "CONSULT" */) && sessionall.response.dialog.channelType == "WEB_RTC") {
    let customEvent = {
      "event": "agentDetails",
      "dialog": {
        "id": dialogId,
        "agentExt": loginid,
        "callType": sessionall.response.dialog.callType == "OTHER_IN" ? "OUT" : "CONSULT"
      }
    }
    createMessage(customEvent, dialogId)
  }
}

function updateAgentDetails(message) {
  var index = getCallIndex(message.dialog.id);
  var sessionall = null
  if (index !== -1) {
    sessionall = calls[index];
  }
  if (!sessionall) {
    // error('invalidState', loginid, "invalid action updateAgentDetails", callback);
    console.log('==>> SIPJS CONSOLE => invalidState invalid action updateAgentDetails -> No Session FOUND');
    return;
  }
  if (message.dialog.callType == "OUT") {
    // if (dialogStatedata && dialogStatedata.response && dialogStatedata.response.dialog) {
    if (sessionall.additionalDetail) {
      sessionall.additionalDetail.agentExt = message.dialog.agentExt;
    } else {
      sessionall.additionalDetail = {
        agentExt: message.dialog.agentExt
      };
    }

    // Publish Event if there was any Pending Event
    if (isPendingEventNotification) {
      console.log("==>> SIPJS CONSOLE => Pending Event Notification -> ", pendingEventNotification)
      // console.log("==>> SIPJS CONSOLE => Pending Event Notification -> ", message.dialog.id)
      createMessage(pendingEventNotification, message.dialog.id)
      pendingEventNotification = null
      isPendingEventNotification = false

    }
    // console.log("==>> SIPJS CONSOLE => DIALOG STATE : ", dialogStatedata)
    // }
  }
}

/**
 * Generates a conversion event indicating changes in media stream status.
 *
 * @param {string} dialogId - The dialog ID associated with the conversation.
 * @param {string} streamType - Type of stream (e.g., "video", "screen-share").
 * @param {string} streamStatus - The status of the stream ("on" or "off").
 * @param {Function} callback - Callback function to handle the event generation.
 */
function publishMediaStreamUpdateEvent(dialogId, streamType, streamStatus, callback) {
  const sysdate = new Date();
  const datetime = sysdate.toISOString();

  // Local media conversion
  const _mediaStreamUpdate = createMediaStreamUpdateEvent(
    {
      loginId: loginid,
      status: "success",
      dialogId: dialogId,
      eventRequest: "local",
      stream: streamType,
      streamStatus: streamStatus,
      errorReason: ""
    });

  // const mediaConversionCopy = JSON.parse(JSON.stringify(_mediaStreamUpdate));
  callback(_mediaStreamUpdate);
  SendPostMessage(_mediaStreamUpdate)

  // Remote media conversion
  const __mediaStreamUpdate = createMediaStreamUpdateEvent(
    {
      loginId: loginid,
      status: "success",
      dialogId: dialogId,
      eventRequest: "remote",
      stream: streamType,
      streamStatus: streamStatus,
      errorReason: ""
    });

  createMessage(__mediaStreamUpdate, dialogId);
}

/**
 * Terminates all remaining calls when an agent or customer leaves the call.
 *
 * @returns {Promise} - A promise that resolves after all remaining calls are terminated.
 */
async function terminateAllRemainingCalls() {
  console.log("==>> SIPJS CONSOLE => TERMINATING ALL REMAINING CALLS")
  console.log("==>> SIPJS CONSOLE => TERMINATING Index 1 Call")
  terminateIndexOneCall()
}

function terminateIndexOneCall(){
  if (calls && calls[1] && calls[1].session && calls[1].session.state !== SIP.SessionState.Terminating && calls[1].session.state !== SIP.SessionState.Terminated) {
      var terminate_session_id = calls[1].response.dialog.id
      if (functionLocks['terminate_call']) {
          setTimeout(() => {
              terminate_call(terminate_session_id);
          }, 1000);
      } else {
          terminate_call(terminate_session_id);
      }
  }
}
function terminateIndexZeroCall(){
  if (calls && calls[0] && calls[0].session && calls[0].session.state !== SIP.SessionState.Terminating && calls[0].session.state !== SIP.SessionState.Terminated) {
      var terminate_session_id = calls[0].response.dialog.id
      if (functionLocks['terminate_call']) {
          setTimeout(() => {
              terminate_call(terminate_session_id);
          }, 1000);
      } else {
          terminate_call(terminate_session_id);
      }
  }
}

/**
 * Handles mediaConversion event received by the user.
 *
 * @param {Object} eventData - Data associated with the mediaConversion event.
 * @param {Function} callback - Callback function to execute after handling the event.
 */
function mediaStreamUpdateEvent(someMessage, callback) {

  const _event = { ...someMessage };
  // _event.event="mediaStreamUpdate"
  if (_event.status !== "success" || _event.dialog.eventRequest !== "remote") {
    return; // Exit early if conditions are not met
  }


  const index = getCallIndex(_event.dialog.id);
  if (index === -1) {
    console.log("==>> SIPJS CONSOLE => Media Conversion Event -> No Session Found / invalid action mediaStreamUpdateEvent");
    return;
  }

  const sessionall = calls[index];
  if (!sessionall) {
    console.log("==>> SIPJS CONSOLE => Media Conversion Event -> No Session Found / invalid action mediaStreamUpdateEvent");
    return;
  }

  // Set the remote media type based on stream status
  sessionall.additionalDetail.remoteMediaType = _event.dialog.streamStatus === "on" ? _event.dialog.stream : "audio";

  // Handle audio to video conversion
  if (sessionall.response.dialog.mediaType === "audio" && sessionall.additionalDetail && !sessionall.additionalDetail.remoteVideoDisplay) {
    sendingReInvite(_event.dialog.id, callback, "video");
    // setupRemoteMedia(sessionall.session, callback, _event.dialog.id);
    callback(_event);
    SendPostMessage(_event);
    return;
  }
  // Handle general media setup
  setupRemoteMedia(sessionall.session, callback, _event.dialog.id);
  callback(_event);
  SendPostMessage(_event);


}


function ReEstablishVoiceCall(currentSession, currentState, errorType, callback, dialogId) {
  console.log("==>> SIPJS Console => Re-establishing VoiceCall")
  console.log("==>> SIPJS Console => Re-establishing VoiceCall currentState ", currentState)
  console.log("==>> SIPJS Console => Re-establishing VoiceCall errorType ", errorType)


  const callDelegate = {
    onAccept: (response) => {
      console.log("==>> SIPJS Console => Re-establishing onAccept -> ", response)
      if (errorType != null && errorType != undefined && errorType != "") {
        error("generalError", loginid, checkErrorReason(errorType), callback);
      } else {

        var index = getCallIndex(dialogId);
        var sessionall = null
        var sessionall = calls[index];

        const sysdate = new Date();
        var datetime = sysdate.toISOString();


        var data = {}
        data.response = calls[index].response;
        data.event = calls[index].event;
        data.response.dialog.participants[0].stateChangeTime = datetime;
        data.response.dialog.participants[0].state = currentState == "HOLD" ? "HELD" : "ACTIVE";
        data.response.dialog.state = currentState == "HOLD" ? "HELD" : "ACTIVE";
        data.response.dialog.isCallAlreadyActive = true;

        if (typeof callback === 'function') {
          var _sessionDialog = {}
          _sessionDialog.response = sessionall.response;
          _sessionDialog.event = sessionall.event;
          const eventCopy = JSON.parse(JSON.stringify(_sessionDialog))
          callback(eventCopy)
          SendPostMessage(eventCopy);
        }
        if (currentState == "ACTIVE") {
          EnableVoiceTrack(currentSession)
        }
      }
    },
    onReject: (response) => {
      console.log("==>> SIPJS Console => Re-establishing onReject -> ", response)
      currentSession.dialog.signalingStateRollback();
      currentSession.sessionDescriptionHandler.peerConnection.setLocalDescription({ type: "rollback" }).then(() => {
        if (response.message.reasonPhrase == "Call Does Not Exist" || response.message.reasonPhrase == "Call is being terminated") {
          // display error that customer left the call
          error("generalError", loginid, checkErrorReason("customer_left"), callback);
          var index = getCallIndex(dialogId)
          calls[index].response.dialog.callEndReason = "customer_left"
          terminate_call(dialogId)
        }
        else {
          ReEstablishVoiceCall(currentSession, currentState, errorType, callback, dialogId)
        }

      })
    }
  }

  if (currentSession.userAgent.transport.isConnected()) {
    console.log("==>> SIPJS Console => Re-establishing VoiceCall Websocket is Connected")
    if (currentState == "HOLD") {
      currentSession.invite({
        sessionDescriptionHandlerOptions: {
          hold: true,
        },
        requestDelegate: callDelegate
      })
    }
    if (currentState == "ACTIVE") {
      currentSession.invite({
        sessionDescriptionHandlerOptions: {
          constraints: {
            audio: true,
            video: false
          },
          iceGatheringTimeout: 500
        },
        requestDelegate: callDelegate
      })
    }
  }
  else {
    //Websocket is not Connected
    console.log("==>> SIPJS Console => Re-establishing VoiceCall Websocket is Not Connected")
    const sysdate = new Date();
    var datetime = sysdate.toISOString();
    var index = getCallIndex(dialogId);
    var data = calls[index];


    if (data.response.dialog.callType !== "CONSULT_CONFERENCE" &&
      data.response.dialog.callType !== "BARGE_CONFERENCE" &&
      data.response.dialog.callType !== "ATTENDED_CONFERENCE" &&
      data.response.dialog.callType !== "EXTERNAL_CONSULT_CONFERENCE") {
      data.response.dialog.participants[0].stateChangeTime = datetime;
      data.response.dialog.participants[0].state = currentState == "HOLD" ? "HELD" : "ACTIVE";
      data.response.dialog.state = currentState == "HOLD" ? "HELD" : "ACTIVE";
    }
    else {
      var _members = data.response.dialog.participants
      for (var i = 0; i < _members.length; i++) {
        if (_members[i].mediaAddress == loginid) {
          _members[i].state = currentState == "HOLD" ? "HELD" : "ACTIVE";
          _members[i].stateChangeTime = datetime;
        }
      }
    }
    data.response.dialog.isCallAlreadyActive = true;
    console.log("==>> SIPJS Console => Will wait for UserAgent To Register & then Re-establish Call")
  }
}


function EnableVoiceTrack(currentSession) {
  console.log("==>> SIPJS Console => ENABLE VOICE TRACK GET CALLED")
  var _peer = currentSession.sessionDescriptionHandler.peerConnection;
  let _senders = _peer.getSenders();

  if (!_senders.length) return;
  _senders.forEach(function (sender) {
    if (sender.track && sender.track.kind == "audio") {
      sender.track.enabled = false;
      sender.track.enabled = true;
    }
  });
}

function DisableVoiceTrack(currentSession) {
  console.log("==> SIPJS Console => DISABLE VOICE TRACK GET CALLED")
  var _peer = currentSession.sessionDescriptionHandler.peerConnection;
  let _senders = _peer.getSenders();

  if (!_senders.length) return;
  _senders.forEach(function (sender) {
    if (sender.track && sender.track.kind == "audio") {
      sender.track.enabled = false;
    }
  });
}

function DisableVideoTrack(currentSession) {
  console.log("==>> SIPJS Console => DISABLE VIDEO TRACK GET CALLED")
  var _peer = currentSession.sessionDescriptionHandler.peerConnection;
  let _senders = _peer.getSenders();

  if (!_senders.length) return;
  _senders.forEach(function (sender) {
    if (sender.track && sender.track.kind == "video") {
      sender.track.stop()
    }
  });
}

function customerLeftEndCall(message) {
  var index = getCallIndex(message.dialog.id);
  var someSession;
  if (index !== -1) {
    someSession = calls[index];
  }
  if (!someSession) {
    return;
  }

  // Updating callEndReason
  const callEndReason = someSession.response.dialog.callEndReason;
  if (!callEndReason || (!callEndReason.includes("direct_transfered") && callEndReason !== "EXTERNAL_ATTENDED_TRANSFER")) {
    someSession.response.dialog.callEndReason = message.reasonCode;
  }

  // Check for External Consult Call in case of Attended Transfer
  // this will fail  if No consult call is found
  if (someSession.response.dialog.callEndReason === "ATTENDED_TRANSFER") {
    const isExternalConsult = calls.some(call => call?.response?.dialog?.callType === "EXTERNAL-CONSULT");

    if (isExternalConsult) {
      someSession.response.dialog.callEndReason = "EXTERNAL_ATTENDED_TRANSFER";
      // as it was External Consult which ended wih Reason EXTERNAL_ATTENDED_TRANSFER
      if (calls[0]?.response?.dialog) {
        calls[0].response.dialog.callEndReason = "EXTERNAL_ATTENDED_TRANSFER";
      }
    }
  }

  switch (someSession.session.state) {
    case SIP.SessionState.Initial:
    case SIP.SessionState.Establishing:
      if (someSession.session instanceof SIP.Inviter) {
        // An unestablished outgoing session
        someSession.session.cancel();
      } else {
        // An unestablished incoming session
        someSession.session.reject();
      }
      break;
    case SIP.SessionState.Established:
      // An established session
      someSession.session.bye();
      break;
    case SIP.SessionState.Terminating:
    case SIP.SessionState.Terminated:
      // Cannot terminate a session that is already terminated
      break;
  }
}


function createMediaStreamUpdateEvent({ loginId, status, dialogId, eventRequest, stream, streamStatus, errorReason }) {

  const sysdate = new Date();
  var datetime = sysdate.toISOString();

  return {
    ...mediaStreamUpdate,
    loginId: loginId,
    status: status,
    dialog: {
      ...mediaStreamUpdate.dialog,
      id: dialogId,
      eventRequest: eventRequest,
      stream: stream,
      streamStatus: streamStatus,
      timeStamp: datetime,
      errorReason: errorReason
    }
  };
}

function sendMessage(message_targetUri_value, message) {
  messager = new SIP.Messager(userAgent, message_targetUri_value, JSON.stringify(message));
  var messageOptions = {
    requestDelegate: {
      onAccept: (response) => {
        console.log("==>> SIPJS Console => sendMesage onAccept ->", response)
      },
      onReject: (response) => {
        console.log("==>> SIPJS Console => sendMesage onReject ->", response)
      }
    }
  }
  messager.message(messageOptions);
}

function terminateIncomingCall(session, options = {}) {
  let dest = ""

  if (session.incomingInviteRequest.message.headers["From"][0].parsed.uri.normal.user) {
    dest = session.incomingInviteRequest.message.headers["From"][0].parsed.uri.normal.user
  }
  if (dest == undefined || dest == "" || dest == null) {
    console.log("==>> SIPJS CONSOLE => terminateIncomingCall Dest Not Found");
    return
  }

  dest = new SIP.URI("sip", dest, sipconfig.uriFs)

  let id = session.incomingInviteRequest.message.headers["X-Call-Id"] != undefined ? session.incomingInviteRequest.message.headers["X-Call-Id"][0]['raw'] : session.incomingInviteRequest.message.headers["Call-ID"][0]['raw'];
  var message = {}
  message.event = "USER_BUSY"
  message.dialog = {}
  message.dialog.id = id


  sendMessage(dest, message)
  var options = {
    extraHeaders: [`X-Call-Dropped-Custom-Reason : ON-ANOTHER-CALL`],
    statusCode: 486,
  }
  session.reject(options)
}

function agentBusyError(message, callback) {
  // message.event = "USER_BUSY"
  error("generalError", loginid, checkErrorReason(message.event), callback);
}

function checkErrorReasonGeneric(errorObject, errorKey) {
  if (errorObject.hasOwnProperty(errorKey)) {
    return errorObject[errorKey];
  } else {
    return Errors.errorsList["CUSTOM_UNKNOWN_ERROR"];
  }
}

function checkErrorReason(errorKey) {
  return checkErrorReasonGeneric(Errors.errorsList, errorKey);
}


const handleConstraintsError = async (message) => {
  console.error(`==>> SIPJS CONSOLE => ${message}`);
  const customResponse = await mediaDeviceErrors("TypeError", "none");
  error('generalError', loginid, customResponse.alert, globalEventCallback);
  return Promise.reject(new Error(customResponse.alert));
};

// Handle CALL_INITIATE logic
const handleCallInitiate = async (constraints) => {
  let mediaStream = new MediaStream();

  try {
    if (constraints.mediaType === "AUDIO") {
      mediaStream = await getAudioStream(constraints.audio);
    } else if (constraints.mediaType === "VIDEO") {
      mediaStream = await getAudioAndVideoStream(constraints.audio, constraints.video);
    } else if (constraints.mediaType === "SCREENSHARE") {
      mediaStream = await getAudioAndScreenShareStream(constraints.audio, constraints.video);
    }
  } catch (error) {
    // console.log("==>> SIPJS CONSOLE => Error during CALL_INITIATE:", error);
    // console.log(error.description)
    throw error;
  }

  return mediaStream;
};

// Handle CALL_ANSWER logic (placeholder for future implementation)
const handleCallAnswer = async (constraints) => {
  const mediaStream = new MediaStream();
  try {
    switch (constraints.mediaType) {
      case "AUDIO":
        await handleAudioAnswer(constraints, mediaStream);
        break;

      case "VIDEO":
        await handleVideoAnswer(constraints, mediaStream);
        break;

      case "SCREENSHARE":
        await handleScreenShareAnswer(constraints, mediaStream);
        break;

      case "ONLYVIEWSCREENSHARE":
        await handleOnlyViewScreenShareAnswer(constraints, mediaStream);
        break;

      default:
        console.error("==>> SIPJS CONSOLE => Unknown mediaType for CALL_ANSWER.");
        throw new Error("Unknown mediaType for CALL_ANSWER.");
    }
  } catch (error) {
    console.error("==>> SIPJS CONSOLE => Error during CALL_ANSWER:", error);
    throw error;
  }

  return mediaStream;
};

// Get audio stream
const getAudioStream = async (audioStatus) => {
  try {
    return await navigator.mediaDevices.getUserMedia({ audio: audioStatus });
  } catch (error) {
    await handleMediaError(error, "audio");
  }
};

// Get audio and video stream
const getAudioAndVideoStream = async (audioStatus, videoStatus) => {
  const mediaStream = new MediaStream();

  // Handle Audio
  try {
    const audioStream = await navigator.mediaDevices.getUserMedia({ audio: audioStatus });
    console.log("==>> SIPJS CONSOLE => Audio Stream:", audioStream);
    mediaStream.addTrack(audioStream.getAudioTracks()[0]);
  } catch (audioError) {
    console.error("==>> SIPJS CONSOLE => Audio Error:", audioError);
    await handleMediaError(audioError, "audio");
    // Optional: add dummy audio if needed
    // mediaStream.addTrack(createDummyAudioTrack());
  }

  // Handle Video
  try {
    const videoStream = await navigator.mediaDevices.getUserMedia({ video: videoStatus });
    console.log("==>> SIPJS CONSOLE => Video Stream:", videoStream);
    mediaStream.addTrack(videoStream.getVideoTracks()[0]);
  } catch (videoError) {
    console.warn("==>> SIPJS CONSOLE => Video Error -> ", videoError);
    console.warn("==>> SIPJS CONSOLE => Creating Dummy Video and using that");
    handleMediaDeviceError(videoError, "video");
    dummyVideoErrorReason = videoError.name;
    mediaStream.addTrack(createDummyVideoTrack());
  }

  return mediaStream;
};

// Get audio and screenshare stream
const getAudioAndScreenShareStream = async (audioStatus, videoStatus) => {
  const mediaStream = new MediaStream();

  // Handle Audio
  try {
    const audioStream = await navigator.mediaDevices.getUserMedia({ audio: audioStatus });
    mediaStream.addTrack(audioStream.getAudioTracks()[0]);
  } catch (audioError) {
    // if (audioError.message === "Access to Screen-share is denied. Please enable it.") {
    //     throw new Error(audioError.message); // Preserve this specific flow
    // }
    console.error("==>> SIPJS CONSOLE => Audio Error:", audioError);
    await handleMediaError(audioError, "audio");
    // Optionally: mediaStream.addTrack(createDummyAudioTrack());
  }

  // Handle Screen Share
  try {
    const videoStream = await navigator.mediaDevices.getDisplayMedia({ video: videoStatus });
    mediaStream.addTrack(videoStream.getVideoTracks()[0]);
  } catch (screenShareError) {
    console.warn("==>> SIPJS CONSOLE => Screenshare Error -> ", screenShareError);
    console.warn("==>> SIPJS CONSOLE => Creating Dummy Video and using that");
    // await handleDisplayError(screenShareError, "Screenshare Error while INITIATING ScreenShare Call");
    mediaStream.addTrack(createDummyVideoTrack());

    // throw error at this point or after the call, turn off stream and throw error
  }

  return mediaStream;
};

// Handle media device errors and throw ERROR
const handleMediaError = async (errorMessage, mediaType) => {
  const customResponse = await mediaDeviceErrors(errorMessage.name, mediaType);
  error('generalError', loginid, customResponse.alert, globalEventCallback);
  throw new Error(customResponse.alert);
};

// Handle media device errors and dont throw ERROR
const handleMediaDeviceError = async (errorMessage, mediaType) => {
  const customResponse = await mediaDeviceErrors(errorMessage.name, mediaType);
  error('generalError', loginid, customResponse.alert, globalEventCallback);
};





// Handle AUDIO case
const handleAudioAnswer = async (constraints, mediaStream) => {
  try {
    const audioStream = await navigator.mediaDevices.getUserMedia({ audio: constraints.audio });
    mediaStream.addTrack(audioStream.getAudioTracks()[0]);
  } catch (audioError) {
    console.warn("==>> SIPJS CONSOLE => Audio Error:", audioError);
    console.warn("==>> SIPJS CONSOLE => Creating Dummy Audio and using that");
    handleMediaDeviceError(audioError, "audio");
    dummyAudioErrorReason = audioError.name;
    // await handleMediaError(audioError, "Microphone Error while ANSWERING Audio Call");
    mediaStream.addTrack(createDummyAudioTrack());
  }
};

// Handle VIDEO case
const handleVideoAnswer = async (constraints, mediaStream) => {
  // Handle Audio
  try {
    const audioStream = await navigator.mediaDevices.getUserMedia({ audio: constraints.audio });
    mediaStream.addTrack(audioStream.getAudioTracks()[0]);
  } catch (audioError) {
    console.warn("==>> SIPJS CONSOLE => Audio Error:", audioError);
    console.warn("==>> SIPJS CONSOLE => Creating Dummy Audio and using that");
    handleMediaDeviceError(audioError, "audio");
    dummyAudioErrorReason = audioError.name;
    // await handleMediaError(audioError, "Microphone Error while ANSWERING Video Call");
    mediaStream.addTrack(createDummyAudioTrack());
  }

  // Handle Video
  try {
    const videoStream = await navigator.mediaDevices.getUserMedia({ video: constraints.video });
    mediaStream.addTrack(videoStream.getVideoTracks()[0]);
  } catch (videoError) {
    console.warn("==>> SIPJS CONSOLE => Video Error:", videoError);
    console.warn("==>> SIPJS CONSOLE => Creating Dummy Video and using that");
    handleMediaDeviceError(videoError, "video");
    dummyVideoErrorReason = videoError.name;
    // await handleMediaError(videoError, "Video Error while ANSWERING Video Call");
    mediaStream.addTrack(createDummyVideoTrack());
  }
};

// Handle SCREENSHARE case
const handleScreenShareAnswer = async (constraints, mediaStream) => {
  // Handle Audio
  try {
    const audioStream = await navigator.mediaDevices.getUserMedia({ audio: constraints.audio });
    mediaStream.addTrack(audioStream.getAudioTracks()[0]);
  } catch (audioError) {
    console.warn("==>> SIPJS CONSOLE => Audio Error:", audioError);
    console.warn("==>> SIPJS CONSOLE => Creating Dummy Audio and using that");
    handleMediaDeviceError(audioError, "audio");
    dummyAudioErrorReason = audioError.name;
    // await handleMediaError(audioError, "Audio Error while ANSWERING ScreenShare Call");
    mediaStream.addTrack(createDummyAudioTrack());
  }

  // Handle Screen Share
  try {
    const screenShareStream = await navigator.mediaDevices.getDisplayMedia({ video: constraints.video });
    mediaStream.addTrack(screenShareStream.getVideoTracks()[0]);
  } catch (screenShareError) {
    console.warn("==>> SIPJS CONSOLE => Screenshare Error -> ", screenShareError);
    console.warn("==>> SIPJS CONSOLE => Creating Dummy Video and using that");
    // await handleDisplayError(screenShareError, "Screenshare Error while ANSWERING ScreenShare Call");
    mediaStream.addTrack(createDummyVideoTrack());
  }
};

// Handle ONLYVIEWSCREENSHARE case
const handleOnlyViewScreenShareAnswer = async (constraints, mediaStream) => {
  try {
    const audioStream = await navigator.mediaDevices.getUserMedia({ audio: constraints.audio });
    mediaStream.addTrack(audioStream.getAudioTracks()[0]);
  } catch (audioError) {
    console.warn("==>> SIPJS CONSOLE => Audio Error:", audioError);
    console.warn("==>> SIPJS CONSOLE => Creating Dummy Audio and using that");
    // await handleMediaError(audioError, "Microphone Error while ANSWERING OnlyViewScreenShare Call");
    mediaStream.addTrack(createDummyAudioTrack());
  }

  // Always create a dummy video track
  mediaStream.addTrack(createDummyVideoTrack());
};


/**
 * @returns {void}
 * @description This function creates a dummy audio track.
 */

const createDummyAudioTrack = () => {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const destination = audioContext.createMediaStreamDestination();
  const silentSource = audioContext.createBufferSource();

  // Create an empty (silent) buffer
  const buffer = audioContext.createBuffer(1, 1, 44100); // 1 channel, 1 sample frame, 44.1kHz
  silentSource.buffer = buffer;

  silentSource.connect(destination);
  silentSource.start();
  destination.stream.getAudioTracks()[0].customInfo = "dummy";

  return destination.stream.getAudioTracks()[0];
};


/**
 *
 * @param {*} width
 * @param {*} height
 * @returns {void}
 * @description This function creates a dummy video track using a canvas element.
 */

const createDummyVideoTrack = (width = 640, height = 480) => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  context.fillStyle = 'black';
  context.fillRect(0, 0, width, height);

  const stream = canvas.captureStream(1); // 1 fps
  stream.getVideoTracks()[0].customInfo = "dummy";
  return stream.getVideoTracks()[0];
};

/**
 * @param {*} dialogId
 * @param {*} callback
 * @returns {void}
 * @description This function iterates through the senders of the session and stops any dummy tracks found.
 */

const removeDummyTracks = (dialogId, callback) => {
  console.log("==>> SIPJS CONSOLE => Removing Dummy Tracks");

  const index = getCallIndex(dialogId);
  if (index === -1) return;

  const sessionall = calls[index];
  if (!sessionall) return;

  const senders = sessionall.session.sessionDescriptionHandler.peerConnection.getSenders();
  console.log("==>> SIPJS CONSOLE => Checking senders for dummy tracks");

  senders.forEach(async sender => {
    const track = sender.track;
    if (track && track.customInfo === "dummy") {
      track.stop();
      console.log("==>> SIPJS CONSOLE => Dummy Track Stopped with Type ->", track.kind);

      const localMediaType = sessionall.additionalDetail.localMediaType.toLowerCase();

      if (track.kind === "video") {
        if (localMediaType !== "onlyviewscreenshare") {
          console.log("==>> SIPJS CONSOLE => Adjusting localMediaType ->", localMediaType);
          sessionall.additionalDetail.localMediaType = "audio";
          setupRemoteMedia(sessionall.session, callback, dialogId);
          publishMediaStreamUpdateEvent(dialogId, "video", "off", callback);
        }
        if (localMediaType !== "screenshare" && localMediaType !== "onlyviewscreenshare") {
          console.log("==>> SIPJS CONSOLE => dummyVideoErrorReason ->", dummyVideoErrorReason);
          var customResponse = await mediaDeviceErrors(dummyVideoErrorReason, "video");
          const mediaPermissionStatus = createMediaPermissionStatusUpdateEvent(dialogId, "video", "denied", customResponse.alert);
          callback(mediaPermissionStatus);
          dummyVideoErrorReason = null;
        }
      }

      if (track.kind === "audio") {
        sessionall.additionalDetail.localMediaType = "audio";
        console.log("==>> SIPJS CONSOLE => dummyAudioErrorReason ->", dummyAudioErrorReason);
        var customResponse = await mediaDeviceErrors(dummyAudioErrorReason, "audio");
        const mediaPermissionStatus = createMediaPermissionStatusUpdateEvent(dialogId, "microphone", "denied", customResponse.alert);
        callback(mediaPermissionStatus);
        dummyAudioErrorReason = null;
      }
    }
  });
};

/**
 * @param {*} dialogId
 * @param {*} mediaType
 * @param {*} status
 * @param {*} errorMessage
 * @returns {Object} - The media permission status update event object.
 * @description This function creates an event object that contains information about the media permission status.
 */
const createMediaPermissionStatusUpdateEvent = (dialogId, mediaType, status, errorMessage) => {
  const sysdate = new Date();
  var datetime = sysdate.toISOString();

  return {
    ...mediaPermissionStatus,
    id: dialogId,
    loginId: loginid,
    dialog: {
      ...mediaPermissionStatus.dialog,
      permissionType: mediaType,
      permissionStatus: status,
      timeStamp: datetime,
      errorReason: errorMessage
    }
  };
}

function getLocalStream(){
  return local_stream;
}

function getRemoteStream(){
  return remote_stream;
}