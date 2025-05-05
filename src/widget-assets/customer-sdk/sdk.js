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
  return fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      'Authorization': `Bearer ${token}`,
    },
  });
}


function widgetConfigs(ccmUrl, widgetIdentifier, callback) {
  authorizedFetch(`${ccmUrl}/widget-configs/${widgetIdentifier}`)
    .then(response => response.json())
    .then((data) => {
      callback(data);
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
      let error = localStorage.getItem("widget-error");
      if (error) {
        callback({ type: "SOCKET_RECONNECTED", data: this.socket });
      } else {
        callback({ type: "SOCKET_CONNECTED", data: this.socket });
      }
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

  this.socket.on('connect_error', (error) => {
    console.log(`unable to establish connection with the server: `, error.message);
    localStorage.setItem("widget-error", "1");
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
      if (!response.ok) {
        const errorText = await response.text();
        console.log("Error: ", errorText);
        throw new Error(errorText);
      }
      return response.json();
    })
    .then((result) => {
      console.log('Success: ', result);
      callback(result);
    })
    .catch((error) => {
      let errorDetails = {};

      try {
        errorDetails = JSON.parse(error.message);
      } catch (e) {
        errorDetails.message = "Error parsing JSON response.";
      }
    
      if (errorDetails.result && errorDetails.result.isInfected) {
        callback({ errorDetails, isFileInvalid: true, errorMesage: "The file could not be uploaded due to security concerns. Please try a different file." });
      } else {
        callback({ errorDetails, isFileInvalid: true, errorMesage: "The file name contains special characters. Only underscore, hyphen and space are allowed in file name." });
      }
    });
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
  // console.log("here is the authenicateRequest in SDK", authenticatorUrl, "and the authData", authData)
  // console.log('authenticateRequest: in sdk function:', JSON.stringify(authData));
  // const url = "https://e70a1560-fa32-4009-a6be-a27f764bcfa6.mock.pstmn.io"
  fetch(`${authenticatorUrl}/verifySecureLink`, {
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

function getCalendarEvents(calendarId,url, startTime,endTime,callback) {
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
  authorizedFetch(`${webhookUrl}`, {
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
 * FS_JS Version 3.2.6
 * Sip.js Version 0.21.2
 */

// Initialize an object to keep track of function locks

const functionLocks = {};
var canCallFunction = true;
var callendDialogId;
var endcal = false;
var calls = [];
var consultSessioin;
var userAgent;
var registerer;
var again_register = false;
var sessionall = null;
var remotesession = null;
var loginid = null;
var wrapupenabler = null;
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

// var remoteVideo = document.getElementById('remoteVideo');
// var localVideo = document.getElementById('localVideo');
var mySessionDescriptionHandlerFactory = null

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
      "serviceIdentifer": null,
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
      "callOriginator": "webrtc"

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
      "serviceIdentifer": null,
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
      "callOriginator": "webrtc"
    }
  }
}
const ConsultCalldata1 = {
  "event": "ConsultCall",
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
      "serviceIdentifer": null,
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
      "callOriginator": "webrtc"
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
      "serviceIdentifer": null,
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
      "callOriginator": "webrtc"
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
var myMediaStreamFactory = async (constraints, sessionDescriptionHandler) => {
  let mediaStream = new MediaStream();
  if (constraints.audio === undefined) {
    constraints.audio = true;
  }
  if (constraints.video === undefined) {
    constraints.video = false;
  }
  if (constraints.video == "screenshare") {
    await navigator.mediaDevices.getDisplayMedia({ video: true }).then(async (stream) => {
      await navigator.mediaDevices.getUserMedia({ audio: true }).then((audioStream) => {
        mediaStream = stream
        mediaStream.addTrack(audioStream.getAudioTracks()[0])
      }).catch(async (error) => {
        var customResponse = await mediaDeviceErrors(error.name)
        error('generalError', loginid, `${customResponse.alert}`, callback);
        return Promise.reject(customResponse.reason)
      })
    }).catch(async (error) => {
      var customResponse = await mediaDeviceErrors(error.name)
      error('generalError', loginid, `${customResponse.alert}`, callback);
      return Promise.reject(customResponse.reason)
    })
  }
  else {
    await navigator.mediaDevices.getUserMedia({ audio: constraints.audio, video: constraints.video }).then((stream) => {
      mediaStream = stream
    }).catch(async (error) => {
      var customResponse = await mediaDeviceErrors(error.name)
      error('generalError', loginid, `${customResponse.alert}`, callback);
      return Promise.reject(customResponse.reason)
    })
  }
  return Promise.resolve(mediaStream);
}

/**
 * Event object for media conversion
 * This event is received when the UserAgent turns video/screen share stream on or off.
 */
let mediaConversion = {
  "event": "mediaConversion",
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

let inviteDelegate = {
  onAck(ack) {
    console.log("onAck MESSAGE  ********  ", ack)
  },
  onBye(bye) {
    // need to discuss this 
    console.log("onBye MESSAGE  ********  ", bye)
    // event = ConsultCall, dialogState , newInboundCall
    if (dialogStatedata && dialogStatedata.event && dialogStatedata.event === "ConsultCall") {
      const match = bye.incomingByeRequest.message.data.match(/text="([^"]+)"/);
      if (match && match[1]) {
        dialogStatedata.response.dialog.callEndReason = match[1];
      }
    }
    if (invitedata && invitedata.event && invitedata.event === "ConsultCall") {
      const match = bye.incomingByeRequest.message.data.match(/text="([^"]+)"/);

      if (match && match[1]) {
        invitedata.response.dialog.callEndReason = match[1];
      }
    }
    // if (consultCalldata && consultCalldata.event && consultCalldata.event === "ConsultCall") {
    //     const match = bye.incomingByeRequest.message.data.match(/text="([^"]+)"/);

    //     if (match && match[1]) {
    //         consultCalldata.response.dialog.callEndReason = match[1];
    //     }
    // }



    if (dialogStatedata && dialogStatedata.event && dialogStatedata.event === "dialogState") {
      const match = bye.incomingByeRequest.message.data.match(/text="([^"]+)"/);
      if (match && match[1]) {
        dialogStatedata.response.dialog.callEndReason = match[1];
      }
    }

    if (invitedata && invitedata.event && invitedata.event === "dialogState") {
      const match = bye.incomingByeRequest.message.data.match(/text="([^"]+)"/);

      if (match && match[1]) {
        invitedata.response.dialog.callEndReason = match[1];
      }
    }
  //   if (consultCalldata && consultCalldata.event && consultCalldata.event === "dialogState") {
  //       const match = bye.incomingByeRequest.message.data.match(/text="([^"]+)"/);

  //       if (match && match[1]) {
  //           consultCalldata.response.dialog.callEndReason = match[1];
  //       }
  //   }

  // onCancel(cancel ){console.log("onCancel MESSAGE  ********  ", cancel)},
  // onInfo(info ) {console.log("onInfo MESSAGE  ********  ", info)},
  // onInvite(reqeust , response , statusCode ){console.log("onInvite MESSAGE  ********  ", reqeust,response,statusCode)},
  // onMessage(message ){console.log("onMessage MESSAGE  ********  ", message)},
  // onRefer(referral){console.log("onRefer MESSAGE  ********  ", referral)},
  // onNotify(notification){console.log("onNotify MESSAGE  ********  ", notification)}

  },
}

var errorsList = {
  Forbidden: "Invalid Credentials.Plese provide valid credentials.",
  Busy: "Device is busy",
  Redirected: "Redirected",
  Unavailable: "Unavailable",
  "Not Found": "Not Found",
  "Address Incomplete": "Address Incomplete",
  "Incompatible SDP": "Incompatible SDP",
  "Authentication Error": "Authentication Error",
  "Request Timeout": "The timeout expired for the client transaction before a response was received.",
  "Connection Error": "WebSocket connection error occurred.",
  "Invalid target": "The specified target can not be parsed as a valid SIP.URI",
  "SIP Failure Code": "A negative SIP response was received which is not part of any of the groups defined in the table below.",
  Terminated: "Session terminated normally by local or remote peer.",
  Canceled: "Session canceled by local or remote peer",
  "No Answer": "Incoming call was not answered in the time given in the configuration no_answer_timeout parameter.",
  Expires: "Incoming call contains an Expires header and the local user did not answer within the time given in the header",
  "No ACK": "An incoming INVITE was replied to with a 2XX status code, but no ACK was received.",
  "No PRACK": "An incoming iNVITE was replied to with a reliable provisional response, but no PRACK was received",
  "User Denied Media Access": "Local user denied media access when prompted for audio/video devices.",
  "WebRTC not supported": "The browser or device does not support the WebRTC specification.",
  "RTP Timeout": "There was an error involving the PeerConnection associated with the call.",
  "Bad Media Description": "Received SDP is wrong.",
  "‘Dialog Error": "	An in-dialog request received a 408 or 481 SIP error.",
};

var myMediaStreamFactory = async (constraints, sessionDescriptionHandler) => {
  let mediaStream = new MediaStream();
  if (constraints.audio === undefined) {
    constraints.audio = true;
  }
  if (constraints.video === undefined) {
    constraints.video = false;
  }
  if (constraints.video == "screenshare") {
    await navigator.mediaDevices.getDisplayMedia({ video: true }).then(async (stream) => {
      await navigator.mediaDevices.getUserMedia({ audio: true }).then((audioStream) => {
        mediaStream = stream
        mediaStream.addTrack(audioStream.getAudioTracks()[0])
      }).catch((error) => {
        permissionDenied(error, constraints)
        return Promise.reject("Permisssion Deined !!")
      })
    }).catch((error) => {
      permissionDenied(error, constraints)
      return Promise.reject("Permisssion Deined !!")
    })
  }
  else {
    await navigator.mediaDevices.getUserMedia({ audio: constraints.audio, video: constraints.video }).then((stream) => {
      mediaStream = stream
    }).catch((error) => {
      permissionDenied(error, constraints)
      if (error.name === "NotFoundError") {
        return Promise.reject("No Audio/Video Device Found")
      }
      return Promise.reject("Permisssion Deined !!")
    })
  }
  return Promise.resolve(mediaStream);
}

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
        } else {
          error("invalidState", obj.parameter.extension, 'Server configurations not feteched ', obj.parameter.clientCallbackFunction);
        }
      }
      break;
    case 'logout':
      loader3(obj.parameter.clientCallbackFunction);
      break;
    case 'makeCall':
      initiate_call(obj.parameter.calledNumber, obj.parameter.Destination_Number, obj.parameter.callType, obj.parameter.authData, obj.parameter.clientCallbackFunction, "OUT");
      break;
    case 'SST':
      blind_transfer(obj.parameter.numberToTransfer, obj.parameter.clientCallbackFunction, obj.parameter.dialogId);
      break;
    case 'SST_Queue':
      blind_transfer_queue(obj.parameter.numberToTransfer, obj.parameter.queue, obj.parameter.queueType, obj.parameter.clientCallbackFunction, obj.parameter.dialogId);
      break;
    case 'makeConsult':
      makeConsultCall(obj.parameter.numberToConsult, obj.parameter.clientCallbackFunction);
      break;
    case 'makeConsultQueue':
      makeConsultCall_queue(obj.parameter.numberToTransfer, obj.parameter.queue, obj.parameter.queueType, obj.parameter.clientCallbackFunction);
      break;
    case 'makeConsultQueue':
      makeConsultCall_queue(obj.parameter.numberToTransfer, obj.parameter.queue, obj.parameter.queueType, obj.parameter.clientCallbackFunction);
      // console.log('Freeswitch do not support makeConsult currently');
      break;
    case 'consultTransfer':
      makeConsultTransferCall(obj.parameter.clientCallbackFunction);
      break;
    case 'silentMonitor':
      console.log('Freeswitch do not support silentMonitor currently');
      break;
    case 'answerCall':
      respond_call(obj.parameter.clientCallbackFunction, obj.parameter.dialogId, obj.parameter.answerCalltype);
      break;
    case 'releaseCall':
      terminate_call(obj.parameter.dialogId);
      break;
    case 'rejectCall':
      console.log('Freeswitch do not support rejectCall currently');
      break;
    case 'closeCall':
      console.log('Freeswitch do not support closeCall currently');
      break;
    case 'end_call':
      console.log(obj);
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
    case 'conferenceCall':
      console.log('Freeswitch do not support conferenceCall currently');
      break;
    case 'makeNotReadyWithReason':
      console.log('Freeswitch do not support makeNotReadyWithReason currently');
      break;
    case 'makeReady':
      console.log('Freeswitch do not support makeReady currently');
      break;
    case 'makeWorkReady':
      console.log('Freeswitch do not support makeWorkReady currently');
      break;
    case 'getDialog':
      console.log('Freeswitch do not support getDialog currently');
      break;
    case 'getWrapUpReasons':
      console.log('Freeswitch do not support getWrapUpReasons currently');
      break;
    case 'updateCallVariableData':
      console.log('Freeswitch do not support updateCallVariableData currently');
      break;
    case 'updateWrapupData':
      console.log('Freeswitch do not support updateWrapupData currently');
      break;
    case 'acceptCall':
      console.log('Freeswitch do not support updateWrapupData currently');
      break;
    case 'dropParticipant':
      console.log('Freeswitch do not support dropParticipant currently');
      break;
    case 'bargeIn':
      console.log('Freeswitch do not support bargeIn currently');
      break;
    case 'SendDtmf':
      sendDtmf(obj.parameter.message, obj.parameter.dialogId, obj.parameter.clientCallbackFunction);
      break;
    case 'team_agent_update_status':
      console.log(obj);
      break;
    case 'team_agent_update_state':
      console.log(obj);
      break;
    case 'team_agent_update_reg':
      console.log(obj);
      break;
    case 'getState':
      console.log('Freeswitch do not support getState currently');
      break;
    case 'getNotReadyLogoutReasons':
      console.log('Freeswitch do not support getNotReadyLogoutReasons currently');
      break;
    case 'getTeamUsers':
      console.log('Freeswitch do not support getTeamUsers currently');
      break;
    case 'convertCall':
      callConvert(obj.parameter.dialogId, obj.parameter.clientCallbackFunction, obj.parameter.streamType, obj.parameter.streamStatus)
      break
    case 'conference_consult':
      initiate_consult_Conference(obj.parameter.dialogId, obj.parameter.clientCallbackFunction)
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
  //
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
        console.log("SIP Transport message received:", message);
        // Handle the SIP transport message here
        // You can access the message content and headers
      },
      onConnect: () => {
        console.log("Network connectivity established");
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
        if (again_register) {
          // setupRemoteMedia(sessionall);
          //    if(dialogStatedata.response.dialog.state=="ACTIVE")
          //    terminate_call();
          registerer.register()
            .then((request) => {
              console.log("Successfully sent REGISTER");
              console.log("Sent request = ", request);
              // if(dialogStatedata.response.dialog.state=="ACTIVE")
              // terminate_call();
              again_register = false
            })
            .catch((error) => {
              console.error("Failed to send REGISTER", error.message);
            });
        }
      },
      onDisconnect: (errorr) => {
        again_register = true;
        console.log("Network connectivity lost going to unregister");
        error("networkIssue", extension, errorr.message, callback);
        endcal = true;
        if (!errorr) {
          console.log("User agent stopped");
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
          return;
        }
        // On disconnect, cleanup invalid registrations
        registerer.unregister()
          .then((data) => {
            again_register = true;
          })
          .catch((e) => {
            // Unregister failed
            console.log('Unregister failed  ', e);
          });
        // Only attempt to reconnect if network/server dropped the connection
        if (errorr) {
          console.log('Only attempt to reconnect if network/server dropped the connection', errorr);
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
          attemptReconnection();
        }
      },
      onInvite: (invitation) => {
        console.log("INVITE received", invitation);
        //
        invitedata = invitedata1;

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

        //develop changes
        // var incomingCallSource = ""
        // var incomingMediaType = invitation.incomingInviteRequest.message.headers["X-Media-Type"];
        // if (incomingMediaType != undefined) {
        //   incomingMediaType = incomingMediaType[0].raw;
        //   incomingCallSource = "webrtc"
        // } else {
        //   var sdp = invitation.incomingInviteRequest.message.body;
        //   if ((/\r\nm=audio /).test(sdp)) {
        //     incomingMediaType = "audio";
        //   }
        //   if ((/\r\nm=video /).test(sdp)) {
        //     incomingMediaType = "video";
        //   }
        //   incomingCallSource = "normal"
        // }

        call_variable_array = [];

        var incomingCallSource = ""
        var incomingMediaType = invitation.incomingInviteRequest.message.headers["X-Media-Type"];
        if (incomingMediaType != undefined) {
          incomingMediaType = incomingMediaType[0].raw;
          incomingCallSource = "webrtc"
        }
        else {
          var sdp = invitation.incomingInviteRequest.message.body;
          if ((/\r\nm=audio /).test(sdp)) {
            incomingMediaType = "audio";
          }

          if ((/\r\nm=video /).test(sdp)) {
            incomingMediaType = "video";
          }
          incomingCallSource = "normal"
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
              setTimeout(respond_call, sipconfig.autoCallAnswer * 1000, callback);
            }
            else if (calltype == "CONSULT") {
              dialogStatedata.response.dialog.callType = "CONSULT";
              invitedata.response.dialog.callType = "CONSULT";
              dialogStatedata.event = "ConsultCall";
              invitedata.event = "ConsultCall";
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
        dialogStatedata.response.dialog.callOriginator = incomingCallSource

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
        invitedata.response.dialog.callOriginator = incomingCallSource

        if (invitedata.additionalDetail) {
          invitedata.additionalDetail.remoteVideoDisplay = incomingMediaType == "audio" ? false : true
        }
        else {
          invitedata.additionalDetail = {
            remoteVideoDisplay: incomingMediaType == "audio" ? false : true
          }
        }

        if (calltype == "CONSULT") {
          dialogStatedata.response.dialog.customerNumber = invitation.incomingInviteRequest.message.headers["X-Customernumber"] != undefined ? invitation.incomingInviteRequest.message.headers["X-Customernumber"][0]['raw'] : "0000";
          dialogStatedata.response.dialog.serviceIdentifier = invitation.incomingInviteRequest.message.headers["X-Destination-Number"] != undefined ? invitation.incomingInviteRequest.message.headers["X-Destination-Number"][0]['raw'] : "0000";
          dialogStatedata.response.dialog.dialedNumber = invitation.incomingInviteRequest.message.headers["X-Destination-Number"] != undefined ? invitation.incomingInviteRequest.message.headers["X-Destination-Number"][0]['raw'] : "0000";
          dialogStatedata.response.dialog.callOriginator = "normal"
          dialogStatedata.response.dialog.mediaType = "audio"

          invitedata.response.dialog.customerNumber = invitation.incomingInviteRequest.message.headers["X-Customernumber"] != undefined ? invitation.incomingInviteRequest.message.headers["X-Customernumber"][0]['raw'] : "0000";
          invitedata.response.dialog.serviceIdentifier = invitation.incomingInviteRequest.message.headers["X-Destination-Number"] != undefined ? invitation.incomingInviteRequest.message.headers["X-Destination-Number"][0]['raw'] : "0000";
          invitedata.response.dialog.dialedNumber = invitation.incomingInviteRequest.message.headers["X-Destination-Number"] != undefined ? invitation.incomingInviteRequest.message.headers["X-Destination-Number"][0]['raw'] : "0000";
          invitedata.response.dialog.callOriginator = "normal"
          invitedata.response.dialog.mediaType = "audio"
        }

        const data = {}
        data.response = invitedata.response
        data.event = invitedata.event
        const invitedataCopy = JSON.parse(JSON.stringify(data));
        callback(invitedataCopy);
        SendPostMessage(invitedata);
        callendDialogId = invitedata.response.dialog.id;
        var index = getCallIndex(invitedata.response.dialog.id);
        if (index == -1) {
          invitedata.session = invitation;
          calls.push(invitedata);
        }

        remotesession = invitation;
        sessionall = invitation;
        addsipcallback(invitation, 'inbound', callback);
      },
      onAck: (onACk) => {
        console.log("onACk received", onACk);
        //invitation.accept();
      },
      onMessage: (message) => {
        let someMessage = JSON.parse(message.request.body)
        console.log("someMessage RECEIVED ====>", someMessage)
        callback(someMessage);
        if (!someMessage.event.includes("CONFERENCE_MEMBER")) {
          if (someMessage.event && someMessage.dialog.id) {
            var index = getCallIndex(someMessage.dialog.id);
            var someSession;
            if (index !== -1) {
              someSession = calls[index].session;
            }
            if (!someSession) {
              return;
            }
            // console.log("THIS SESSION EXISTS")
            // console.log("MESSAGE RECEIVED" , message)
            switch (someMessage.event) {
              case "Transfer":
                attendedTransferEvent(someMessage, callback)
                break
              case "mediaConversion":
                someMessage.loginId = loginid
                mediaConversionEvent(someMessage, callback)
                // callback(JSON.parse(JSON.stringify(someMessage)))
                break
              case "agentDetails":
                updateAgentDetails(someMessage)
                break
              case "MONITORED":
                callMonitored(someMessage, callback)
                console.log("CALL IS => MONITORED")
                break
              case "MONITORING_ENDED":
                callMonitoringEnded(someMessage, callback)
                console.log("CALL IS => callMonitoringEnded")
                break
              case "CONFERENCE":
                console.log("CALL IS => CONFERENCE with some Change")
                conferenceChange(someMessage, callback)
                break
              case "CONSULT_TRANSFER":
                attendedTransferEvent(someMessage, callback)
                console.log("CALL IS => CONSULT_TRANSFER")
                break
              case "CONSULT_TRANSFER_FAILED":
                console.log("CALL IS => CONSULT_TRANSFER_FAILED")
                break
              case "CONSULT_CONFERENCE_FAILED":
                console.log("CALL IS => CONSULT_CONFERENCE_FAILED")
                conferenceFailed(someMessage, callback)
                break
              case "BARGE_FAILED":
                console.log("CALL IS => BARGE_FAILED")
                conferenceFailed(someMessage, callback)
                break
              default:
                break
            }
          }
        }
        else {
          switch (someMessage.event) {   // Custom Event for Conference
            case "CONFERENCE_MEMBER_HOLD":
              conferenceMemberHold(someMessage, callback)
              console.log("CALL IS => CONFERENCE_MEMBER_HOLD")
              break
            case "CONFERENCE_MEMBER_UNHOLD":
              conferenceMemberUnHold(someMessage, callback)
              console.log("CALL IS => CONFERENCE_MEMBER_UNHOLD")
              break
            case "CONFERENCE_MEMBER_MUTE":
              conferenceMemberMute(someMessage, callback)
              console.log("CALL IS => CONFERENCE_MEMBER_MUTE")
              break
            case "CONFERENCE_MEMBER_UNMUTE":
              conferenceMemberUnMute(someMessage, callback)
              console.log("CALL IS => CONFERENCE_MEMBER_UNMUTE")
              break
            default:
              break
          }
        }
      },
      onNotify: (notification) => {
        console.log("NOTIFY received", notification);
        //notification.accept();
      },
      onRefer: (referral) => {
        console.log("REFER onRefer received");
        //referral.accept();
      },
      onSubscribe: (subscription) => {
        console.log("SUBSCRIBE received");
      },
      onReject: (response) => {
        console.log("onReject response = ", response);
        // error("generalError",loginid,response.message.reasonPhrase,callback);
      },
    }
  };

  userAgent = new SIP.UserAgent(config)
  userAgent.start()
    .then(() => {
      console.log("Connected");
      registerer = new SIP.Registerer(userAgent);
      // Setup registerer state change handler
      registerer.stateChange.addListener((newState) => {
        console.log('newState:', newState);
        switch (newState) {
          case SIP.RegistererState.Registered:
            console.log("Registered");
            if (dialogStatedata == null)
              dialogStatedata = dialogStatedata1;
            if (dialogStatedata.response.dialog.state == "ACTIVE" && endcal == true) {
              //need to setup for loop here . 
              setTimeout(terminateAllCalls, 5000);
              endcal = false;
            }
            loginid = extension;
            dialogStatedata.response.loginId = extension;
            console.log(' connected registered', registerer);
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
              callback(JSON.parse(JSON.stringify({
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
            console.log("Unregistered", registerer);
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
              dialogStatedata = null;
              loginid = null;
              agentInfo = false;
              userAgent.delegate = null;
              userAgent = null;
              sessionall = null;

            }
            break;
          case SIP.RegistererState.Terminated:
            console.log("Terminated");
            break;
        }
      });
      // Send REGISTER
      registerer.register()
        .then((request) => {
          console.log("Successfully sent REGISTER");
          console.log("Sent request = ", request);
          // request.delegate={
          //     onReject: (response) => {
          //     },
          //     onAccept: (response) => {

          //         //error("generalError",loginid,response.message.reasonPhrase,callback);
          //     },
          //     onProgress: (response) => {
          //         console.log("onProgress response = ", response);
          //         //error("generalError",loginid,response.message.reasonPhrase,callback);
          //     },
          //     onRedirect: (response) => {
          //         console.log("onRedirect response = ", response);
          //         //error("generalError",loginid,response.message.reasonPhrase,callback);
          //     },
          //     onTrying: (response) => {
          //         console.log("onTrying response = ", response);
          //         //error("generalError",loginid,response.message.reasonPhrase,callback);
          //     },
          // }
        })
        .catch((error) => {
          console.error("Failed to send REGISTER", error.message);
          error("subscriptionFailed", extension, error.message, callback);
        });
    })
    .catch((errorr) => {
      console.error("Failed to connect", errorr);
      error("subscriptionFailed", extension, errorr.message, callback);
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
 * @param {string} callType - The type of call (OUT for outbound, MONITORING for monitoring).
 * @returns {void}
 */

function initiate_call(calledNumber, DN, mediaType, authData, callback, callType) {
  var res = lockFunction("initiate_call", 500); // --- seconds cooldown
  if (!res) return;
  const undefinedParams = checkUndefinedParams(initiate_call, [calledNumber, DN, mediaType, authData, callback, callType]);

  if (undefinedParams.length > 0) {
    error("generalError", loginid, `Error: The following parameter(s) are undefined or null or empty: ${undefinedParams.join(', ')}`, callback);
    return;
  }

  if (userAgent !== null && userAgent !== undefined) {
    // Target URI
    var sip_uri = SIP.UserAgent.makeURI('sip:' + calledNumber + "@" + sipconfig.uriFs);
    if (!sip_uri) {
      // console.error("Failed to create target URI.");
      error("generalError", loginid, "Invalid target Uri:" + calledNumber, callback);
      return;
    }
    // Create new Session instance in "initial" state
    sessionall = new SIP.Inviter(userAgent, sip_uri);
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
          console.log("onAccept response = ", response);
        },
        onReject: (response) => {
          console.log("onReject response = ", response);
          error("generalError", loginid, response.message.reasonPhrase, callback);
          if (response.message.data?.match(/text="([^"]+)"/)?.[1] && response.message.data.match(/text="([^"]+)"/)[1] !== "NORMAL_CLEARING") {
            const reason = response.message.data.match(/text="([^"]+)"/)[1];
            calls[0].response.dialog.callEndReason = reason;
          }
        },
        onCancel: (response) => {
          console.log("onCancel response = ", response);
          error("generalError", loginid, response.message.reasonPhrase, callback);
        },
        onBye: (response) => {
          console.log("onBye response = ", response);
          error("generalError", loginid, response.message.reasonPhrase, callback);
        },
        onTerminate: (response) => {
          console.log("onTerminate response = ", response);
          error("generalError", loginid, response.message.reasonPhrase, callback);
        },
        onProgress: (response) => {
          console.log("INITIATED response = onProgress", response);
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
          SendPostMessage(dataToPass);
        },
        onTrying: (response) => {
          console.log("INITIATING response = onTrying", response);
          if (response.message) {
            outboundDialingdata = null;
            outboundDialingdata = outboundDialingdata12;

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
            outboundDialingdata.response.dialog.serviceIdentifier = dialedNumber;
            outboundDialingdata.response.dialog.id = response.message.callId;
            outboundDialingdata.response.dialog.dialedNumber = dialedNumber;
            outboundDialingdata.response.dialog.customerNumber = dialedNumber;
            outboundDialingdata.response.dialog.participants[0].mediaAddress = loginid;
            outboundDialingdata.response.dialog.participants[0].startTime = datetime;
            outboundDialingdata.response.dialog.participants[0].stateChangeTime = datetime;
            outboundDialingdata.response.dialog.participants[0].startTime = datetime;
            outboundDialingdata.response.dialog.participants[0].state = "INITIATING";
            outboundDialingdata.response.dialog.state = "INITIATING";
            outboundDialingdata.response.dialog.isCallEnded = 0;

            dialogStatedata.response.dialog.participants[0].startTime = datetime;
            dialogStatedata.response.dialog.participants[0].state = "INITIATING";
            dialogStatedata.response.dialog.state = "INITIATING";
            outboundDialingdata.event = "outboundDialing";
            sessionall.request.extraHeaders.push('X-Call-Unique-ID:' + DN);

            outboundDialingdata.response.dialog.mediaType = mediaType
            outboundDialingdata.response.dialog.callOriginator = callType == "MONITORING" ? "normal" : "webrtc";

            dialogStatedata.response.dialog.mediaType = mediaType
            dialogStatedata.response.dialog.callOriginator = callType == "MONITORING" ? "normal" : "webrtc";

            var data = {}
            data.event = outboundDialingdata.event
            data.response = outboundDialingdata.response

            if (outboundDialingdata.additionalDetail) {
              outboundDialingdata.additionalDetail.remoteVideoDisplay = mediaType == "audio" ? false : true
            }
            else {
              outboundDialingdata.additionalDetail = {
                remoteVideoDisplay: mediaType == "audio" ? false : true
              }
            }

            const outboundDialingdataCopy = JSON.parse(JSON.stringify(data));
            callback(outboundDialingdataCopy);
            SendPostMessage(outboundDialingdata);

            var index = getCallIndex(outboundDialingdata.response.dialog.id);
            if (index == -1) {
              outboundDialingdata.session = sessionall;
              calls.push(outboundDialingdata);
            }

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
          // video: calltype == "video" ? true : false
          video: constraintVideo
        },
        offerOptions: {
          offerToReceiveAudio: true,
          offerToReceiveVideo: offerToReceiveAVideo
        }
      },
      earlyMedia: true,
      requestOptions: {
        extraHeaders: [
          'X-Referred-By-Someone: Username'
        ]
      },
    };

    // Send initial INVITE
    sessionall.invite(inviteOptions)
      .then((request) => {
        console.log("Successfully sent INVITE");
        console.log("INVITE request = ", request);

        if (sessionall.outgoingRequestMessage) {

        }
      })
      .catch((errorr) => {
        console.log("Failed to send INVITE", errorr.message);
        error("generalError", loginid, errorr.message, callback);


      });
    addsipcallback(sessionall, 'outbound', callback);
  } else {
    error('invalidState', loginid, "invalid action makeCall", callback);
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
  console.log('state', sessionToEnd.state);
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
function reject_call() {
  // reject a call
  if (remotesession) {
    remotesession.reject();
  }
  else {
    error('invalidState', loginid, "invalid action rejectCall", callback);
  }
}
/**
 * Transfer a call to a new extension.
 * This function is used to transfer an ongoing call to a specified extension.
 *
 * @param {string} numberToTransfer - The extension number to which the call will be transferred.
 * @param {function} callback - The callback function to execute after the transfer.
 * @param {string} dialogId - The identifier for the call dialog to be transferred.
 * @returns {void}
 */
function blind_transfer(numberToTransfer, callback, dialogId) {
  var res = lockFunction("blind_transfer", 500); // --- seconds cooldown
  if (!res) return;
  const undefinedParams = checkUndefinedParams(blind_transfer, [numberToTransfer, callback, dialogId]);

  if (undefinedParams.length > 0) {
    // console.log(`Error: The following parameter(s) are undefined or null: ${undefinedParams.join(', ')}`);
    error("generalError", loginid, `Error: The following parameter(s) are undefined or null or empty: ${undefinedParams.join(', ')}`, callback);
    return;
  }
  var index = getCallIndex(dialogId);
  var sessionall = null
  if (index !== -1) {
    sessionall = calls[index];
  }
  if (!sessionall) {
    return;
  }

  for (var i = 0; i < calls.length; i++) {
    if (calls && calls[i] && calls[i].response && calls[i].response.dialog && (calls[i].response.dialog.callType == "CONSULT" || calls[i].response.dialog.callType == "CONFERENCE")) {
      error("generalError", loginid, `Connot trigger Blind Transfer when Call type is ${calls[i].response.dialog.callType}`, callback);
      return;
    }
  }
  // Target URI
  var target = SIP.UserAgent.makeURI('sip:' + numberToTransfer + "@" + sipconfig.uriFs);
  if (!target) {
    // console.error("Failed to create target URI.");
    error("generalError", loginid, "Invalid target Uri:" + numberToTransfer, callback);
    return;
  }
  const options = {
    eventHandlers: {
      accepted: () => {
        console.log('REFER request accepted');
      },
      failed: (response) => {
        console.log('REFER request failed:', response.statusCode);
      }
    },
    requestDelegate: {
      onAccept: (request) => {
        console.log('Custom onAccept logic');
        // Custom logic for accepting the REFER request
      },
      onReject: (request) => {
        console.log('Custom onReject logic');
        // Custom logic for rejecting the REFER request
      }
    },
  };
  // if(DN){
  //     options.requestOptions ={
  //         extraHeaders: [
  //             'X-DN: ' + DN, // Replace with your desired header and value
  //         ]
  //     }
  // }
  sessionall.session.refer(target, options).then((res) => {
    console.log('success blind_transfer', res);
    dialogStatedata.response.dialog.callEndReason = "direct-transfered";

  }).catch((e) => {
    console.log('blind_transfer error ', e);
    error("generalError", loginid, e.message, callback);
  })
}
/**
 * Transfer a call to a queue.
 * This function is used to transfer an ongoing call to a specified queue.
 *
 * @param {string} numberToTransfer - The destination number or extension to which the call will be transferred (99887766).
 * @param {string} queue - The queue to which the call will be transferred.
 * @param {string} queuetype - The type of the queue.
 * @param {function} callback - The callback function to execute after the transfer.
 * @param {string} dialogId - The identifier for the call dialog to be transferred.
 * @returns {void}
 */
function blind_transfer_queue(numberToTransfer, queue, queuetype, callback, dialogId) {
  var res = lockFunction("blind_transfer_queue", 500); // --- seconds cooldown
  if (!res) return;
  const undefinedParams = checkUndefinedParams(blind_transfer_queue, [numberToTransfer, queue, queuetype, callback, dialogId]);

  if (undefinedParams.length > 0) {
    // console.log(`Error: The following parameter(s) are undefined or null: ${undefinedParams.join(', ')}`);
    error("generalError", loginid, `Error: The following parameter(s) are undefined or null or empty: ${undefinedParams.join(', ')}`, callback);
    return;
  }
  var index = getCallIndex(dialogId);
  var sessionall = null
  if (index !== -1) {
    sessionall = calls[index];
  }

  if (!sessionall) {
    return;
  }

  for (var i = 0; i < calls.length; i++) {
    if (calls && calls[i] && calls[i].response && calls[i].response.dialog && (calls[i].response.dialog.callType == "CONSULT" || calls[i].response.dialog.callType == "CONFERENCE")) {
      error("generalError", loginid, `Connot trigger Blind Transfer when Call type is ${calls[i].response.dialog.callType}`, callback);
      return;
    }
  }
  // Target URI
  var target = SIP.UserAgent.makeURI('sip:' + numberToTransfer + "-" + queue + "@" + sipconfig.uriFs);
  if (!target) {
    error("generalError", loginid, "Invalid target Uri:" + numberToTransfer, callback);
    return;
  }
  const options = {
    eventHandlers: {
      accepted: () => {
        // console.log('REFER request accepted');
      },
      failed: (response) => {
        // console.log('REFER request failed:', response.statusCode);
      }
    },
    requestOptions: {
      extraHeaders: [
        'X-queueTransfer: ' + queue, // Replace with your desired header and value
        'X-queueTypeTransfer: ' + queuetype,
      ]
    },
    requestDelegate: {
      onAccept: (request) => {
        //console.log('Custom onAccept logic');
        // Custom logic for accepting the REFER request
      },
      onReject: (request) => {
        //console.log('Custom onReject logic');
        // Custom logic for rejecting the REFER request
      }
    },
  };
  sessionall.session.refer(target, options).then((res) => {
    console.log('success blind_transfer_queue', res);
    dialogStatedata.response.dialog.callEndReason = "direct-transfered";
  }).catch((e) => {
    console.log('blind_transfer_queue error ', e);
    error("generalError", loginid, e.message, callback);
  })

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

  //let that = this;
  //Commented this because it was causing localstream to stop, while only remotestream needed to be stoped
  // senders.forEach(function (sender) {
  //     if (sender.track) sender.track.enabled = false;
  // });

  // Hold the session by sending a re-INVITE with hold session description
  const holdOptions = {
    sessionDescriptionHandlerOptions: {
      hold: true,
    }
  };

  sessionall.session.invite(holdOptions)
    .then(() => {
      console.log("Session held successfully.");
      const sysdate = new Date();
      var datetime = sysdate.toISOString();

      if (sessionall.response.dialog.callType == "CONFERENCE") {
        var _members = sessionall.response.dialog.participants
        for (var i = 0; i < _members.length; i++) {
          if (_members[i].mediaAddress != loginid) {
            generateConferenceEvent("CONFERENCE_MEMBER_HOLD", _members[i].mediaAddress, loginid, sessionall.additionalDetail.conference_name)
          }
          if (_members[i].mediaAddress == loginid) {
            _members[i].state = "HELD"
            _members[i].stateChangeTime = datetime;
          }
        }
      }
      else {
        var data = {}
        data.response = calls[index].response;
        data.event = calls[index].event;
        data.response.dialog.participants[0].stateChangeTime = datetime;
        data.response.dialog.participants[0].state = "HELD";
        data.response.dialog.state = "HELD";
        data.response.dialog.isCallAlreadyActive = true;
      }
      if (typeof callback === 'function') {
        var _sessionDialog = {}
        _sessionDialog.response = sessionall.response;
        _sessionDialog.event = sessionall.event;
        const eventCopy = JSON.parse(JSON.stringify(_sessionDialog))
        callback(eventCopy)
        SendPostMessage(data);
      }
    })
    .catch((errorr) => {
      console.error("Failed to hold the session:", errorr);
      error('generalError', loginid, errorr.message, callback);
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
    }
  };

  sessionall.session.invite(holdOptions)
    .then(() => {
      console.log("Session unhold successfully.");
      const sysdate = new Date();
      var datetime = sysdate.toISOString();
      if (sessionall.response.dialog.callType == "CONFERENCE") {
        var _members = sessionall.response.dialog.participants
        for (var i = 0; i < _members.length; i++) {
          if (_members[i].mediaAddress != loginid) {
            generateConferenceEvent("CONFERENCE_MEMBER_UNHOLD", _members[i].mediaAddress, loginid, sessionall.additionalDetail.conference_name)
          }
          if (_members[i].mediaAddress == loginid) {
            _members[i].state = "ACTIVE"
            _members[i].stateChangeTime = datetime;
          }
        }
      }
      else {
        var data = {}
        data.response = calls[index].response;
        data.event = calls[index].event;
        data.response.dialog.participants[0].stateChangeTime = datetime;
        data.response.dialog.participants[0].state = "ACTIVE";
        data.response.dialog.state = "ACTIVE";
        data.response.dialog.isCallAlreadyActive = true;
      }
      if (typeof callback === 'function') {
        var _sessionDialog = {}
        _sessionDialog.response = sessionall.response;
        _sessionDialog.event = sessionall.event;
        const eventCopy = JSON.parse(JSON.stringify(_sessionDialog))
        callback(eventCopy)
        SendPostMessage(data);
      }
    })
    .catch((errorr) => {
      console.error("Failed to unhold the session:", errorr);
      error('generalError', loginid, errorr.message, callback);
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
  console.log("PHONE <UTED IN THE SDK and dialogueID is", dialogId)
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
  if (sessionall.response.dialog.callType == "CONFERENCE") {
    var _members = sessionall.response.dialog.participants
    for (var i = 0; i < _members.length; i++) {
      if (_members[i].mediaAddress != loginid) {
        generateConferenceEvent("CONFERENCE_MEMBER_MUTE", _members[i].mediaAddress, loginid, sessionall.additionalDetail.conference_name)
      }
      if (_members[i].mediaAddress == loginid) {
        _members[i].mute = true
        _members[i].stateChangeTime = datetime;
      }
    }
  }
  else {
    var data = {}
    data.response = calls[index].response;
    data.event = calls[index].event;
    data.response.dialog.participants[0].stateChangeTime = datetime;
    data.response.dialog.participants[0].mute = true;
  }
  if (typeof callback === 'function') {
    var _sessionDialog = {}
    _sessionDialog.response = sessionall.response;
    _sessionDialog.event = sessionall.event;
    const eventCopy = JSON.parse(JSON.stringify(_sessionDialog))
    callback(eventCopy);
    SendPostMessage(data);
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
  if (sessionall.response.dialog.callType == "CONFERENCE") {
    var _members = sessionall.response.dialog.participants
    for (var i = 0; i < _members.length; i++) {
      if (_members[i].mediaAddress != loginid) {
        generateConferenceEvent("CONFERENCE_MEMBER_UNMUTE", _members[i].mediaAddress, loginid, sessionall.additionalDetail.conference_name)
      }
      if (_members[i].mediaAddress == loginid) {
        _members[i].mute = false
        _members[i].stateChangeTime = datetime;
      }
    }
  }
  else {
    var data = {}
    data.response = calls[index].response;
    data.event = calls[index].event;
    data.response.dialog.participants[0].stateChangeTime = datetime;
    data.response.dialog.participants[0].mute = false;
  }
  if (typeof callback === 'function') {
    var _sessionDialog = {}
    _sessionDialog.response = sessionall.response;
    _sessionDialog.event = sessionall.event;
    const eventCopy = JSON.parse(JSON.stringify(_sessionDialog))
    callback(eventCopy)
    SendPostMessage(dialogStatedata);    // consult Jazeb on this 
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
  // answer a call
  if (sessionall.status === SIP.SessionState.Established) {
    console.log('Call already answered');
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
        video: false
      },
      offerOptions: {
        offerToReceiveAudio: true,
        offerToReceiveVideo: false
      }
    }
    if (type === "audio") {
      sessionDescriptionHandlerOption.constraints.audio = true
      sessionDescriptionHandlerOption.constraints.video = false
      sessionDescriptionHandlerOption.offerOptions.offerToReceiveAudio = true
      sessionDescriptionHandlerOption.offerOptions.offerToReceiveVideo = false
    }
    else if (type === "video") {
      sessionDescriptionHandlerOption.constraints.audio = true
      sessionDescriptionHandlerOption.constraints.video = true
      sessionDescriptionHandlerOption.offerOptions.offerToReceiveAudio = true
      sessionDescriptionHandlerOption.offerOptions.offerToReceiveVideo = true
    }
    else if (type === "screenshare") {
      sessionDescriptionHandlerOption.constraints.audio = true
      sessionDescriptionHandlerOption.constraints.video = "screenshare"
      sessionDescriptionHandlerOption.offerOptions.offerToReceiveAudio = true
      sessionDescriptionHandlerOption.offerOptions.offerToReceiveVideo = true
    }
    else if (type === "onlyviewscreenshare") {
      sessionDescriptionHandlerOption.constraints.audio = true
      sessionDescriptionHandlerOption.constraints.video = true
      sessionDescriptionHandlerOption.offerOptions.offerToReceiveAudio = true
      sessionDescriptionHandlerOption.offerOptions.offerToReceiveVideo = true
    }

    sessionall.accept({
      sessionDescriptionHandlerOptions: sessionDescriptionHandlerOption
    }).then((res) => {
      console.log('call accepted : ', type)
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
    })
      .catch((e) => {
        console.log('error :', e.message);
        error("generalError", loginid, e.message, callback);

      });
    video = true;
    sessionall = sessionall;

  }


}
/**
 * Initiate a consult call.
 * This function allows an agent to initiate a consult call with the specified destination number.
 *
 * @param {string} calledNumber - The number to which the consult call is initiated.
 * @param {function} callback - The callback function to execute after initiating the consult call.
 * @returns {void}
 */
function makeConsultCall(calledNumber, callback) {
  var res = lockFunction("makeConsultCall", 500); // --- seconds cooldown
  if (!res) return;
  const undefinedParams = checkUndefinedParams(makeConsultCall, [calledNumber, callback]);

  if (undefinedParams.length > 0) {
    // console.log(`Error: The following parameter(s) are undefined or null: ${undefinedParams.join(', ')}`);
    error("generalError", loginid, `Error: The following parameter(s) are undefined or null or empty: ${undefinedParams.join(', ')}`, callback);
    return;
  }

  var _mainSessionCallType = calls[0].response.dialog.callType
  if (_mainSessionCallType == "CONFERENCE" || _mainSessionCallType == "CONSULT") {
    error('generalError', loginid, `Cannot consult on ${_mainSessionCallType}`, callback);
    return
  }
  if (calls && calls[1] && calls[1].session && calls[1].session.state == SIP.SessionState.Established) {
    error('generalError', loginid, "Cannot consult when Consult Call already Exists", callback);
    return;
  }

  if (userAgent !== null && userAgent !== undefined) {
    // Target URI
    var sip_uri = SIP.UserAgent.makeURI('sip:' + calledNumber + "@" + sipconfig.uriFs);
    if (!sip_uri) {
      // console.error("Failed to create target URI.");
      error("generalError", loginid, "Invalid target Uri:" + sip_id, callback);
      return;
    }
    // Create new Session instance in "initial" state
    consultSessioin = new SIP.Inviter(userAgent, sip_uri);
    const request = consultSessioin.request;

    request.extraHeaders.push('X-Calltype: CONSULT');

    let firstsession = calls[0].session
    let customerNumber = ""
    if (typeof firstsession.incomingInviteRequest !== 'undefined') {
      customerNumber = firstsession.incomingInviteRequest.message.from.uri.normal.user
    }

    let destinationNumber = firstsession.incomingInviteRequest.message.headers["X-Destination-Number"];
    destinationNumber = destinationNumber != undefined ? destinationNumber[0].raw : "0000";

    request.extraHeaders.push('X-CustomerNumber: ' + customerNumber);
    request.extraHeaders.push('X-Destination-Number: ' + destinationNumber);
    request.extraHeaders.push('X-Media-Type:' + "audio")


    // Options including delegate to capture response messages
    const inviteOptions1 = {
      requestDelegate: {
        onAccept: (response) => {
          console.log("onAccept response = ", response);
        },
        onReject: (response) => {
          console.log("onReject response = ", response);
          error("generalError", loginid, response.message.reasonPhrase, callback);
        },
        onCancel: (response) => {
          console.log("onCancel response = ", response);
          error("generalError", loginid, response.message.reasonPhrase, callback);
        },
        onBye: (response) => {
          console.log("onBye response = ", response);
          error("generalError", loginid, response.message.reasonPhrase, callback);
        },
        onTerminate: (response) => {
          console.log("onTerminate response = ", response);
          error("generalError", loginid, response.message.reasonPhrase, callback);
        },
        onProgress: (response) => {
          console.log("INITIATED response = onProgress", response);
          const sysdate = new Date();
          var datetime = sysdate.toISOString();
          consultCalldata.response.dialog.participants[0].state = "INITIATED";
          consultCalldata.response.dialog.state = "INITIATED";
          consultCalldata.response.dialog.participants[0].startTime = datetime;
          consultCalldata.response.dialog.participants[0].state = "INITIATED";
          consultCalldata.response.dialog.state = "INITIATED";
          // var { session, ...dataToPass } = consultCalldata;
          // callback(dataToPass);
          var data = {}
          data.response = consultCalldata.response
          data.event = consultCalldata.event
          const consultCalldataCopy = JSON.parse(JSON.stringify(data));
          callback(consultCalldataCopy);
          SendPostMessage(consultCalldata)

        },
        onTrying: (response) => {
          console.log("INITIATING response = onTrying", response);
          if (response.message) {
            consultCalldata = null;
            consultCalldata = ConsultCalldata1;

            const sysdate = new Date();
            var datetime = sysdate.toISOString();

            var dialedNumber = response.message.to.uri.raw.user;
            consultCalldata.response.loginId = loginid;
            consultCalldata.response.dialog.fromAddress = loginid;
            consultCalldata.response.dialog.callType = 'CONSULT';
            consultCalldata.response.dialog.ani = dialedNumber;
            consultCalldata.response.dialog.dnis = dialedNumber;
            consultCalldata.response.dialog.serviceIdentifier = dialedNumber;
            consultCalldata.response.dialog.id = response.message.callId;
            consultCalldata.response.dialog.dialedNumber = dialedNumber;
            consultCalldata.response.dialog.customerNumber = dialedNumber;
            consultCalldata.response.dialog.participants[0].mediaAddress = loginid;
            consultCalldata.response.dialog.participants[0].startTime = datetime;
            consultCalldata.response.dialog.participants[0].stateChangeTime = datetime;
            consultCalldata.response.dialog.participants[0].startTime = datetime;
            consultCalldata.response.dialog.participants[0].state = "INITIATING";
            consultCalldata.response.dialog.state = "INITIATING";
            consultCalldata.response.dialog.mediaType = "audio"
            consultCalldata.response.dialog.callOriginator = "normal"
            // var { session, ...dataToPass } = consultCalldata;
            // callback(dataToPass);
            var data = {}
            data.response = consultCalldata.response
            data.event = consultCalldata.event
            const consultCalldataCopy = JSON.parse(JSON.stringify(data));
            callback(consultCalldataCopy);
            SendPostMessage(consultCalldata);

            var index = getCallIndex(consultCalldata.response.dialog.id);
            if (index == -1) {
              consultCalldata.session = consultSessioin;
              calls.push(consultCalldata);
            }
            phone_hold(callback, calls[0].response.dialog.id);
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
          video: false
        }
      },
      earlyMedia: true,
      requestOptions: {
        extraHeaders: [
          'X-Referred-By-Someone: Username'
        ]
      },
    };

    // Send initial INVITE
    consultSessioin.invite(inviteOptions1)
      .then((request) => {
        console.log("Successfully sent INVITE");
        console.log("INVITE request = ", request);

        if (consultSessioin.outgoingRequestMessage) {

        }
      })
      .catch((errorr) => {
        console.log("Failed to send INVITE", errorr.message);
        error("generalError", loginid, errorr.message, callback);
      });

    consultSessioin.delegate = {
      onBye: (bye) => {
        console.log(`we received a bye message!`, bye);
        const match = bye.incomingByeRequest.message.data.match(/text="([^"]+)"/);
        if (match && match[1]) {
          // if(consultCalldata.response.dialog.callEndReason != "consult-transfer"){
          consultCalldata.response.dialog.callEndReason = match[1];
          // }
        }
        console.log(consultCalldata.response.dialog.callEndReason)

      },
      // onRejec: (invitation) => {
      //     console.log("onReject received", invitation);
      //     //invitation.accept();
      // },
      // onRejected: (invitation) => {
      //     console.log("we received a onRejected received", invitation);
      //     //invitation.accept();
      // },
      onCancel: (invitation) => {
        console.log("we received a onCancel", invitation);

      },
      // onFailed: (invitation) => {
      //     console.log("we received a onFailed received", invitation);
      //     //invitation.accept();
      // },
      // onAccepted: (invitation) => {
      //     console.log("we received a onAccepted received", invitation);
      //     //invitation.accept();
      // },
      // onrejectionhandled: (invitation) => {
      //     console.log("we received a onrejectionhandled received", invitation);
      //     //invitation.accept();
      // },
      // onunhandledrejection: (invitation) => {
      //     console.log("we received a onunhandledrejection received", invitation);
      //     //invitation.accept();
      // },
      // onTerminated: (invitation) => {
      //     console.log("we received a onTerminated received", invitation);
      //     //invitation.accept();
      // },
      // onTerminate: (invitation) => {
      //     console.log("we received a onTerminate received", invitation);
      //     //invitation.accept();
      // },
      // onRefer: (refer) => {
      //     console.log('we received a onRefer received : ', refer)
      //     referral.reject();
      // }
    };

    consultSessioin.stateChange.addListener((newState) => {
      console.log(newState);
      var dialogId;
      if (consultSessioin.incomingInviteRequest) {
        dialogId = consultSessioin.incomingInviteRequest.message.headers["X-Call-Id"] != undefined ? consultSessioin.incomingInviteRequest.message.headers["X-Call-Id"][0]['raw'] : consultSessioin.incomingInviteRequest.message.headers["Call-ID"][0]['raw'];
      } else {
        dialogId = consultSessioin.outgoingRequestMessage.headers["X-Call-Id"] != undefined ? consultSessioin.outgoingRequestMessage.headers["X-Call-Id"][0]['raw'] : consultSessioin.outgoingRequestMessage.headers["Call-ID"][0];
      }
      var index = getCallIndex(dialogId);
      switch (newState) {
        case SIP.SessionState.Establishing:
          console.log("Ringing");

          break;
        case SIP.SessionState.Established:
          console.log("consult call Answered");
          setupRemoteMedia(consultSessioin, callback);


          var call_type1;
          if (consultSessioin.incomingInviteRequest) {

            if (consultSessioin.incomingInviteRequest.message.from._displayName === 'conference') {
              call_type1 = 'conference'
            } else {
              call_type1 = 'incoming'
            }
          } else {
            call_type1 = 'outbound'
          }
          const sysdate = new Date();
          var datetime = sysdate.toISOString();
          consultSessioin.startTime = datetime;

          // console.log(event);
          if (call_type1 != 'inbound') {
            call_variable_array = [];
            if (consultSessioin.outgoingRequestMessage.headers['X-Call-Variable0']) {
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
              if (consultSessioin.outgoingRequestMessage.headers['X-Call-Variable' + index]) {
                call_variable_array.push({
                  "name": 'callVariable' + index,
                  "value": data.headers['X-Call-Variable' + index]
                })
              }
            }
            consultCalldata.response.dialog.callVariables.CallVariable = call_variable_array;
          }
          consultCalldata.response.dialog.participants[0].stateChangeTime = datetime;
          consultCalldata.response.dialog.participants[0].state = "ACTIVE";
          consultCalldata.response.dialog.state = "ACTIVE";
          consultCalldata.response.dialog.isCallEnded = 0;
          consultCalldata.response.dialog.participants[0].mute = false;
          var { session, ...dataToPass } = consultCalldata;
          var data = {}
          data.response = consultCalldata.response
          data.event = consultCalldata.event
          const dataToPassCopy = JSON.parse(JSON.stringify(data));
          callback(dataToPassCopy);
          SendPostMessage(dataToPass);
          if (index != -1) {
            calls[index].response = consultCalldata.response;
          }
          break;
        case SIP.SessionState.Terminated:
          console.log("Consult Call Ended");
          var sysdate1 = new Date();
          var datetime = sysdate1.toISOString();
          if (consultCalldata != null) {
            consultCalldata.response.dialog.participants[0].mute = false;
            consultCalldata.response.dialog.participants[0].stateChangeTime = datetime;
            consultCalldata.response.dialog.participants[0].state = "DROPPED";
            if (consultCalldata.response.dialog.callEndReason == "direct-transfered" || consultCalldata.response.dialog.callEndReason == "ATTENDED_TRANSFER") {
              consultCalldata.response.dialog.isCallEnded = 0;
            } else {
              consultCalldata.response.dialog.isCallEnded = 1;
            }
            consultCalldata.response.dialog.state = "DROPPED";
            consultCalldata.response.dialog.isCallAlreadyActive = false;
            var data = {}
            data.response = consultCalldata.response
            data.event = consultCalldata.event
            const consultCalldataCopy = JSON.parse(JSON.stringify(data));
            callback(consultCalldataCopy);
            SendPostMessage(consultCalldata);
            if (consultCalldata.response.dialog.callEndReason === "PRE_EMPTED") {
              var _callMembers = calls[0].response.dialog.participants
              _callMembers.forEach(member => {
                if (member.mediaAddress === loginid) {
                  member.state = "ACTIVE"
                  member.stateChangeTime = datetime
                }
              })
              calls[0].response.dialog.state = "ACTIVE"
              var data = {}
              data.response = calls[0].response
              data.event = calls[0].event
              const dataCopy = JSON.parse(JSON.stringify(data));
              callback(dataCopy);
            }
            consultCalldata.response.dialog.callEndReason = null;
            consultCalldata = null;
            // clearTimeout(myTimeout);
          }
          var index = getCallIndex(dialogId);
          calls.splice(index, 1);
          if (calls.length != 0) {
            setupRemoteMedia(calls[0].session, callback);
          }
          break;
      }
    });

    //addsipcallback(sessionall, 'outbound', callback);
  } else {
    error('invalidState', loginid, "invalid action makeCall", callback);
  }
}

  //sessionall.refer(consultSessioin);
/**
 * Initiate a consult call with queue.
 * This function allows an agent to initiate a consult call with the specified destination number and queue.
 *
 * @param {string} numberToTransfer - The number or extension to which the consult call is initiated (99887766).
 * @param {string} queue - The queue to which the call will be transferred.
 * @param {string} queuetype - The type of the queue.
 * @param {function} callback - The callback function to execute after initiating the consult call.
 * @returns {void}
 */
function makeConsultCall_queue(numberToTransfer, queue, queuetype, callback) {
  var res = lockFunction("makeConsultCall_queue", 500); // --- seconds cooldown
  if (!res) return;
  const undefinedParams = checkUndefinedParams(makeConsultCall_queue, [numberToTransfer, queue, queuetype, callback]);

  if (undefinedParams.length > 0) {
    // console.log(`Error: The following parameter(s) are undefined or null: ${undefinedParams.join(', ')}`);
    error("generalError", loginid, `Error: The following parameter(s) are undefined or null or empty: ${undefinedParams.join(', ')}`, callback);
    return;
  }
  var _mainSessionCallType = calls[0].response.dialog.callType
  if (_mainSessionCallType == "CONFERENCE" || _mainSessionCallType == "CONSULT") {
    error('generalError', loginid, `Cannot consult on ${_mainSessionCallType}`, callback);
    return
  }
  if (calls && calls[1] && calls[1].session && calls[1].session.state == SIP.SessionState.Established) {
    error('generalError', loginid, "Cannot consult when Consult Call already Exists", callback);
    return;
  }

  if (userAgent !== null && userAgent !== undefined) {
    // Target URI
    var sip_uri = SIP.UserAgent.makeURI('sip:' + numberToTransfer + "-" + queue + "@" + sipconfig.uriFs);
    // var sip_uri = SIP.UserAgent.makeURI('sip:' + calledNumber + "@" + sipconfig.uri);
    if (!sip_uri) {
      // console.error("Failed to create target URI.");
      error("generalError", loginid, "Invalid target Uri:" + sip_id, callback);
      return;
    }
    // Create new Session instance in "initial" state
    consultSessioin = new SIP.Inviter(userAgent, sip_uri);
    const request = consultSessioin.request;

    request.extraHeaders.push('X-Calltype: CONSULT');


    let firstsesion = calls[0].session
    let customerNumber = ""
    if (typeof firstsesion.incomingInviteRequest !== 'undefined') {
      customerNumber = firstsesion.incomingInviteRequest.message.from.uri.normal.user
    }

    let destinationNumber = firstsesion.incomingInviteRequest.message.headers["X-Destination-Number"];
    destinationNumber = destinationNumber != undefined ? destinationNumber[0].raw : "0000";

    request.extraHeaders.push('X-CustomerNumber: ' + customerNumber);
    request.extraHeaders.push('X-Destination-Number: ' + destinationNumber);


    // Options including delegate to capture response messages
    const inviteOptions1 = {
      requestDelegate: {
        onAccept: (response) => {
          console.log("onAccept response = ", response);
        },
        onReject: (response) => {
          console.log("onReject response = ", response);
          error("generalError", loginid, response.message.reasonPhrase, callback);
        },
        onCancel: (response) => {
          console.log("onCancel response = ", response);
          error("generalError", loginid, response.message.reasonPhrase, callback);
        },
        onBye: (response) => {
          console.log("onBye response = ", response);
          error("generalError", loginid, response.message.reasonPhrase, callback);
        },
        onTerminate: (response) => {
          console.log("onTerminate response = ", response);
          error("generalError", loginid, response.message.reasonPhrase, callback);
          document.getElementById("call_2".innerText = "CALL TERMINATED")
        },
        onProgress: (response) => {
          console.log("INITIATED response = onProgress", response);
          const sysdate = new Date();
          var datetime = sysdate.toISOString();
          consultCalldata.response.dialog.participants[0].state = "INITIATED";
          consultCalldata.response.dialog.state = "INITIATED";
          consultCalldata.response.dialog.participants[0].startTime = datetime;
          consultCalldata.response.dialog.participants[0].state = "INITIATED";
          consultCalldata.response.dialog.state = "INITIATED";
          // var { session, ...dataToPass } = consultCalldata;
          // callback(dataToPass);
          var data = {}
          data.response = consultCalldata.response
          data.event = consultCalldata.event
          const consultCalldataCopy = JSON.parse(JSON.stringify(data));
          callback(consultCalldataCopy);
          SendPostMessage(consultCalldata);
        },
        onTrying: (response) => {
          console.log("INITIATING response = onTrying", response);
          if (response.message) {
            consultCalldata = null;
            consultCalldata = ConsultCalldata1;
            const sysdate = new Date();
            var datetime = sysdate.toISOString();
            var dialedNumber = response.message.to.uri.raw.user;
            consultCalldata.response.loginId = loginid;
            consultCalldata.response.dialog.fromAddress = loginid;
            consultCalldata.response.dialog.callType = 'CONSULT';
            consultCalldata.response.dialog.ani = dialedNumber;
            consultCalldata.response.dialog.dnis = dialedNumber;
            consultCalldata.response.dialog.serviceIdentifier = dialedNumber;
            consultCalldata.response.dialog.id = response.message.callId;
            consultCalldata.response.dialog.dialedNumber = dialedNumber;
            consultCalldata.response.dialog.customerNumber = dialedNumber;
            consultCalldata.response.dialog.participants[0].mediaAddress = loginid;
            consultCalldata.response.dialog.participants[0].startTime = datetime;
            consultCalldata.response.dialog.participants[0].stateChangeTime = datetime;
            consultCalldata.response.dialog.participants[0].startTime = datetime;
            consultCalldata.response.dialog.participants[0].state = "INITIATING";
            consultCalldata.response.dialog.state = "INITIATING";
            consultCalldata.response.dialog.mediaType = "audio"
            consultCalldata.response.dialog.callOriginator = "normal"
            // var { session, ...dataToPass } = consultCalldata;
            // callback(dataToPass);
            var data = {}
            data.response = consultCalldata.response
            data.event = consultCalldata.event
            const consultCalldataCopy = JSON.parse(JSON.stringify(data));
            callback(consultCalldataCopy);
            SendPostMessage(consultCalldata)
            var index = getCallIndex(consultCalldata.response.dialog.id);
            if (index == -1) {
              consultCalldata.session = consultSessioin;
              calls.push(consultCalldata);
            }
            phone_hold(callback, calls[0].response.dialog.id);
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
          video: false
        }
      },
      earlyMedia: true,
      requestOptions: {
        extraHeaders: [
          'X-Referred-By-Someone: Username'
        ]
      },
    };

    // Send initial INVITE
    consultSessioin.invite(inviteOptions1)
      .then((request) => {
        console.log("Successfully sent INVITE");
        console.log("INVITE request = ", request);

        if (consultSessioin.outgoingRequestMessage) {

        }
      })
      .catch((errorr) => {
        console.log("Failed to send INVITE", errorr.message);
        error("generalError", loginid, errorr.message, callback);


      });

    consultSessioin.delegate = {
      onBye(bye) {
        console.log(`we received a bye message!`, bye);
        const match = bye.incomingByeRequest.message.data.match(/text="([^"]+)"/);

        if (match && match[1]) {
          // if(consultCalldata.response.dialog.callEndReason != "consult-transfer"){
          consultCalldata.response.dialog.callEndReason = match[1];
          // }
        }
        console.log(consultCalldata.response.dialog.callEndReason)
      },
      onCancel: (invitation) => {
        console.log("we received a onCancel received", invitation);
        //invitation.accept();
      },
    };

    consultSessioin.stateChange.addListener((newState) => {
      console.log(newState);
      var dialogId;
      if (consultSessioin.incomingInviteRequest) {
        dialogId = consultSessioin.incomingInviteRequest.message.headers["X-Call-Id"] != undefined ? consultSessioin.incomingInviteRequest.message.headers["X-Call-Id"][0]['raw'] : consultSessioin.incomingInviteRequest.message.headers["Call-ID"][0]['raw'];
      } else {
        dialogId = consultSessioin.outgoingRequestMessage.headers["X-Call-Id"] != undefined ? consultSessioin.outgoingRequestMessage.headers["X-Call-Id"][0]['raw'] : consultSessioin.outgoingRequestMessage.headers["Call-ID"][0];
      }
      var index = getCallIndex(dialogId);
      switch (newState) {
        case SIP.SessionState.Establishing:
          console.log("Ringing");

          break;
        case SIP.SessionState.Established:
          console.log("consult call Answered");
          setupRemoteMedia(consultSessioin, callback);


          var call_type1;
          if (consultSessioin.incomingInviteRequest) {

            if (consultSessioin.incomingInviteRequest.message.from._displayName === 'conference') {
              call_type1 = 'conference'
            } else {
              call_type1 = 'incoming'
            }
          } else {
            call_type1 = 'outbound'
          }
          const sysdate = new Date();
          var datetime = sysdate.toISOString();
          consultSessioin.startTime = datetime;

          // console.log(event);
          if (call_type1 != 'inbound') {
            call_variable_array = [];
            if (consultSessioin.outgoingRequestMessage.headers['X-Call-Variable0']) {
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
              if (consultSessioin.outgoingRequestMessage.headers['X-Call-Variable' + index]) {
                call_variable_array.push({
                  "name": 'callVariable' + index,
                  "value": data.headers['X-Call-Variable' + index]
                })
              }
            }
            consultCalldata.response.dialog.callVariables.CallVariable = call_variable_array;
          }
          consultCalldata.response.dialog.participants[0].stateChangeTime = datetime;
          consultCalldata.response.dialog.participants[0].state = "ACTIVE";
          consultCalldata.response.dialog.state = "ACTIVE";
          consultCalldata.response.dialog.isCallEnded = 0;
          consultCalldata.response.dialog.participants[0].mute = false;
          var { session, ...dataToPass } = consultCalldata;
          var data = {}
          data.response = consultCalldata.response
          data.event = consultCalldata.event
          const dataToPassCopy = JSON.parse(JSON.stringify(data));
          callback(dataToPassCopy);
          SendPostMessage(dataToPass);
          if (index != -1) {
            calls[index].response = consultCalldata.response;
          }
          break;
        case SIP.SessionState.Terminated:
          console.log("Consult Call Ended");
          document.getElementById("call_2").innerText = "Terminated"
          var sysdate1 = new Date();
          var datetime = sysdate1.toISOString();
          if (consultCalldata != null) {
            consultCalldata.response.dialog.participants[0].mute = false;
            consultCalldata.response.dialog.participants[0].stateChangeTime = datetime;
            consultCalldata.response.dialog.participants[0].state = "DROPPED";
            if (consultCalldata.response.dialog.callEndReason == "direct-transfered" || consultCalldata.response.dialog.callEndReason == "ATTENDED_TRANSFER") {
              consultCalldata.response.dialog.isCallEnded = 0;
            } else {
              consultCalldata.response.dialog.isCallEnded = 1;
            }
            consultCalldata.response.dialog.state = "DROPPED";
            consultCalldata.response.dialog.isCallAlreadyActive = false;
            console.log("callEndReason ====> " + consultCalldata.response.dialog.callEndReason)
            var data = {}
            data.response = consultCalldata.response
            data.event = consultCalldata.event
            const consultCalldataCopy = JSON.parse(JSON.stringify(data));
            callback(consultCalldataCopy);
            SendPostMessage(consultCalldata);
            consultCalldata.response.dialog.callEndReason = null;
            consultCalldata = null;
            // clearTimeout(myTimeout);
          }
          calls.splice(index, 1);
          if (calls.length != 0) {
            setupRemoteMedia(calls[0].session, callback);
          }
          break;
      }
    });

    //addsipcallback(sessionall, 'outbound', callback);
  } else {
    error('invalidState', loginid, "invalid action makeConsultCall_queue", callback);
  }
}
/**
 * Initiate a consult transfer call.
 * This function allows an agent to transfer a customer call to a consulted agent.
 *
 * @param {function} callback - The callback function to execute after initiating the consult transfer call.
 * @returns {void}
 */
function makeConsultTransferCall(callback) {
  //Consult call end reason = ATTENDED_TRANSFER

  var res = lockFunction("makeConsultTransferCall", 500); // --- seconds cooldown
  if (!res) return;
  sessionall = calls[0].session;
  consultSessioin = calls[1].session;
  if (!sessionall || !consultSessioin) {
    return
  }
  if (sessionall.state === SIP.SessionState.Terminated) {
    console.log("C1 and A1 sesison is terminated so we cannot initiate Consult Trasfer")
    error('invalidState', loginid, `Customer Call is terminated so we cannot initiate Consult Trasfer`, callback);
    return
  }
  if (consultSessioin.state === SIP.SessionState.Terminated) {
    console.log("A2 and A1 sesison is terminated so we cannot initiate Consult Trasfer")
    error('invalidState', loginid, `Consult Call is terminated so we cannot initiate Consult Trasfer`, callback);
    return
  }

  var members = []
  for (var i = 0; i < calls[0].response.dialog.participants.length; i++) {
    var _member = calls[0].response.dialog.participants[i].mediaAddress
    members.push(_member)
  }
  for (var i = 0; i < calls[1].response.dialog.participants.length; i++) {
    var _member = calls[1].response.dialog.participants[i].mediaAddress
    members.push(_member)
  }


  let uniqueMembers = [...new Set(members)];
  if (uniqueMembers.length > 4) {
    error('generalError', loginid, `Consult Transfer Failed due to LIMIT REACHED of 4 unique members`, callback);
    return
  }

  var dialogId = calls[1].response.dialog.id
  sendDtmf("*", dialogId, callback)
  sendDtmf("7", dialogId, callback)

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
  if (_tempSession.response.dialog.callType == "CONSULT" || _tempSession.response.dialog.callType == "CONFERENCE") {
    error("generalError", loginid, `Convert turn stream on/off when call is ${_tempSession.response.dialog.callType}`, callback);
    return;
  }
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

    setupRemoteMedia(sessionall, callback)
    generateConversionEvent(dialogId, streamType, streamStatus, callback)
    return
  }

  senders.forEach(async sender => {
    if (sender && sender.track && sender.track.kind && sender.track.kind === "video") {
      videoTrackcheck = true
      if (sender.track.readyState === "live") {
        sender.track.stop()
      }
      if (streamType === "video") {
        await navigator.mediaDevices.getUserMedia({ video: true }).then(async (videoStream) => {
          let videoTrack = videoStream.getVideoTracks()[0]
          await sender.replaceTrack(videoTrack)
          setupRemoteMedia(sessionall, callback)
        })
      }
      else if (streamType === "screenshare") {
        await navigator.mediaDevices.getDisplayMedia({ video: true }).then(async (videoStream) => {
          let videoTrack = videoStream.getVideoTracks()[0]
          await sender.replaceTrack(videoTrack);
          setupRemoteMedia(sessionall, callback)
        })
      }

      generateConversionEvent(dialogId, streamType, streamStatus, callback)

    }
  })

  if (!videoTrackcheck) {
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
          console.log("Ringing");

          break;
        case SIP.SessionState.Established:
          console.log("Answered");
          setupRemoteMedia(temp_session, callback);


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
            dialogStatedata.response.dialog.participants[0].state = "ACTIVE";
            dialogStatedata.response.dialog.state = "ACTIVE";
            dialogStatedata.response.dialog.isCallEnded = 0;
          } else {
            dialogStatedata.response.dialog.participants[0].stateChangeTime = datetime;
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

          }
          break;
        case SIP.SessionState.Terminated:
          console.log("Ended");
          var sysdate1 = new Date();
          var datetime = sysdate1.toISOString();
          if (dialogStatedata != null) {
            dialogStatedata.response.dialog.participants[0].mute = false;
            dialogStatedata.response.dialog.participants[0].stateChangeTime = datetime;
            dialogStatedata.response.dialog.participants[0].state = "DROPPED";
            if (dialogStatedata.response.dialog.callEndReason == "direct-transfered" || dialogStatedata.response.dialog.callEndReason == "ATTENDED_TRANSFER") {
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
            console.log('call end reason :', dialogStatedata.response.dialog.callEndReason);
            SendPostMessage(dialogStatedata);
            dialogStatedata.response.dialog.callEndReason = null;
            // clearTimeout(myTimeout);
          }
          // End All Calls if C1 Leaves 
          await terminateAllRemainingCalls(dialogId).then(() => {
            calls.splice(index, 1)
          })
          break;
      }
    });
    temp_session.delegate = {
      onCancel: (invitation) => {
        console.log("onCancel received", invitation);
        var dialogId;
        if (temp_session.incomingInviteRequest) {
          dialogId = temp_session.incomingInviteRequest.message.headers["X-Call-Id"] != undefined ? temp_session.incomingInviteRequest.message.headers["X-Call-Id"][0]['raw'] : temp_session.incomingInviteRequest.message.headers["Call-ID"][0]['raw'];
        } else {
          dialogId = temp_session.outgoingRequestMessage.message.headers["X-Call-Id"] != undefined ? temp_session.outgoingRequestMessage.message.headers["X-Call-Id"][0]['raw'] : temp_session.outgoingRequestMessage.message.headers["Call-ID"][0]['raw'];
        }
        var index = getCallIndex(dialogId);
        var sessionall = null
        if (index != -1) {
          dialogStatedata.response = calls[index].response;
        }
        const match = invitation.incomingCancelRequest.data.match(/text="([^"]+)"/);

        if (match && match[1]) {
          dialogStatedata.response.dialog.callEndReason = match[1];
        } else {
          dialogStatedata.response.dialog.callEndReason = "Canceled";
        }
        //invitation.accept();
      },
      onFailed: (invitation) => {
        console.log("onFailed received", invitation);
        //invitation.accept();
      },
      onAccepted: (invitation) => {
        console.log("onAccepted received", invitation);
        //invitation.accept();
      },
      onrejectionhandled: (invitation) => {
        console.log("onrejectionhandled received", invitation);
        //invitation.accept();
      },
      onunhandledrejection: (invitation) => {
        console.log("onunhandledrejection received", invitation);
        //invitation.accept();
      },

      onTerminated: (invitation) => {
        console.log("onTerminated received", invitation);
        //invitation.accept();
      },
      onTerminate: (invitation) => {
        console.log("onTerminate received", invitation);
        //invitation.accept();
      },
      onRefer: (refer) => {
        console.log('onRefer received : ', refer)
      }

    };
    //

  } catch (e) {
    console.log(e);
    error('generalError', loginid, "e", callback);
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
    sessionall = calls[index].session;
    if (sessionall.state !== SIP.SessionState.Established) {
      if (typeof callback === "function")
        error('invalidState', loginid, "invalid action SendDtmf", callback);
      return;
    }
    const options = {
      requestOptions: {
        body: {
          contentDisposition: "render",
          contentType: "application/dtmf-relay",
          content: "Signal=" + message + "\r\nDuration=1000"
        }
      }
    };
    sessionall.info(options)
      .then((request) => {
        // Actions when DTMF is successful
        console.log("send dtmf :", request);
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
      })
      .catch((error) => {
        // Actions when DTMF fails
        console.log("send dtmf :", error);
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
      });;
  }
}

window.addEventListener('beforeunload', (event) => {
  //need to check here.
  terminateAllCalls();
  call_variable_array = {};
  dialogStatedata = null;
  invitedata = null;
  outboundDialingdata = null;
});
if (window.addEventListener)
  window.addEventListener("message", function (e) {
    if (e.data.SourceType == 'CTI' && e.data.calledNumber) {
      initiate_call(e.data.calledNumber, e.data.Destination_Number, e.data.callType, callbackFunction);
    }
  });
function loader3(callback) {
  if (!userAgent || !registerer) {
    error("invalidState", '', 'Invalid action logout', callback);
  } else {
    // Send un-REGISTER
    console.log(registerer.state);
    registerer.unregister()
      .then((request) => {
        console.log("Successfully sent un-REGISTER");
        console.log("Sent request = " + request);
      })
      .catch((error) => {
        console.error("Failed to send un-REGISTER", error);
        console.log("Failed to send un-REGISTER", error);
      });
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
}
var errorsList = {

  Forbidden: "Invalid Credentials.Plese provide valid credentials.",
  Busy: "Device is busy",
  Redirected: "Redirected",
  Unavailable: "Unavailable",
  "Not Found": "Not Found",
  "Address Incomplete": "Address Incomplete",
  "Incompatible SDP": "Incompatible SDP",
  "Authentication Error": "Authentication Error",
  "Request Timeout": "The timeout expired for the client transaction before a response was received.",
  "Connection Error": "WebSocket connection error occurred.",
  "Invalid target": "The specified target can not be parsed as a valid SIP.URI",
  "SIP Failure Code": "A negative SIP response was received which is not part of any of the groups defined in the table below.",
  Terminated: "Session terminated normally by local or remote peer.",
  Canceled: "Session canceled by local or remote peer",
  "No Answer": "Incoming call was not answered in the time given in the configuration no_answer_timeout parameter.",
  Expires: "Incoming call contains an Expires header and the local user did not answer within the time given in the header",
  "No ACK": "An incoming INVITE was replied to with a 2XX status code, but no ACK was received.",
  "No PRACK": "An incoming iNVITE was replied to with a reliable provisional response, but no PRACK was received",
  "User Denied Media Access": "Local user denied media access when prompted for audio/video devices.",
  "WebRTC not supported": "The browser or device does not support the WebRTC specification.",
  "RTP Timeout": "There was an error involving the PeerConnection associated with the call.",
  "Bad Media Description": "Received SDP is wrong.",
  "‘Dialog Error": "	An in-dialog request received a 408 or 481 SIP error.",
};



// Number of times to attempt reconnection before giving up
const reconnectionAttempts = 10;
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
        console.log('error  ', error)
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
function setupRemoteMedia(session, callback) {
  var pc = session.sessionDescriptionHandler.peerConnection;
  var remoteStream;
  remoteStream = new MediaStream();
  var size = pc.getReceivers().length;
  console.log('size is ', size);
  var receiver = pc.getReceivers()[0];
  var receivervideo = pc.getReceivers()[1];
  remoteStream.addTrack(receiver.track);
  if (receivervideo) {
    console.log('vdieo found');
    remoteStream.addTrack(receivervideo.track);
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
  }, 4000)


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
      if (track && track.kind === "video") {
        localStream_1.addTrack(track);

        //trigger when user press browser button of Stop Sharing
        track.addEventListener('ended', () => {
          console.log("Screen Sharing is Tured off")
          if (typeof session.incomingInviteRequest !== 'undefined') {
            let _dialogId = session.incomingInviteRequest.message.headers["X-Call-Id"] != undefined ? session.incomingInviteRequest.message.headers["X-Call-Id"][0]['raw'] : session.incomingInviteRequest.message.headers["Call-ID"][0]['raw'];
            generateConversionEvent(_dialogId, "screenshare", "off", callback)
          }
          else if (typeof session.outgoingInviteRequest !== 'undefined') {
            let _dialogId = session.outgoingInviteRequest.message.headers["Call-ID"][0]
            generateConversionEvent(_dialogId, "screenshare", "off", callback)
          }
        });
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

// function testing(dialogId, callback) {
//   console.log("dialogueID is coming into the SDK now", dialogId)
//   var index = getCallIndex(dialogId);
//   console.log("here is the index in testing>>>>>>", index)
//   var sessionall = null
//   if (index !== -1) {
//     sessionall = calls[index].session;
//   }
//   console.log("here is the sessionll", sessionall)
//   callback(sessionall);
// }

function registrationFailed(response) {
  //console.log('helo ',msg);
  error("subscriptionFailed", loginid, errorsList[response.message.reasonPhrase], callbackFunction);
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
      window.postMessage(obj, "*"); // "*" means sending to all origins
    }
  } catch (e) {
    console.log("Exception: ", e);
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

function terminateAllCalls() {
  if (calls.length > 0)
    for (let index = 0; index < calls.length; index++) {
      var element = calls[index];
      if (element.response.dialog.id) {
        terminate_call(element.response.dialog.id);
      }
    }
  userAgent.stop();
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

function attendedTransferEvent(someMessage, callback) {
  var index = getCallIndex(someMessage.dialog.id);
  var sessionall = null
  if (index !== -1) {
    sessionall = calls[index];
  }

  if (!sessionall) {
    error('invalidState', loginid, "invalid action attendedTransferEvent", callback);
    return;
  }
  dialogStatedata = sessionall

  if (sessionall.response && sessionall.response.dialog && sessionall.response.dialog.callType == "OUT") {
    return
  }


  // End Consult Call
  console.log("Consult Call Ended");

  var sysdate1 = new Date();
  var datetime = sysdate1.toISOString();
  if (dialogStatedata && dialogStatedata.response && dialogStatedata.response.dialog) {
    dialogStatedata.response.dialog.callEndReason = "ATTENDED_TRANSFER";
    dialogStatedata.response.dialog.participants[0].mute = false;
    dialogStatedata.response.dialog.participants[0].stateChangeTime = datetime;
    dialogStatedata.response.dialog.participants[0].state = "DROPPED";
    if (dialogStatedata.response.dialog.callEndReason == "direct-transfered" || dialogStatedata.response.dialog.callEndReason == "ATTENDED_TRANSFER") {
      dialogStatedata.response.dialog.isCallEnded = 0;
    } else {
      dialogStatedata.response.dialog.isCallEnded = 1;
    }
    dialogStatedata.response.dialog.state = "DROPPED";
    dialogStatedata.response.dialog.isCallAlreadyActive = false;
    // console.log("callEndReason ===> "+ dialogStatedata.response.dialog.callEndReason)
    // console.log(JSON.stringify(dialogStatedata.response.dialog))
    var data = {}
    data.response = dialogStatedata.response
    data.event = dialogStatedata.event
    const dialogStatedataCopy = JSON.parse(JSON.stringify(data));
    callback(dialogStatedataCopy);
    SendPostMessage(dialogStatedata);
    dialogStatedata.response.dialog.callEndReason = null;
    // dialogStatedata = null;
    // clearTimeout(myTimeout);
  }

  // Active Dialog state
  dialogStatedata.event = "dialogState"
  var sysdate1 = new Date();
  var datetime = sysdate1.toISOString();
  if (dialogStatedata && dialogStatedata.response && dialogStatedata.response.dialog) {
    dialogStatedata.response.dialog.callType = "OTHER_IN"
    dialogStatedata.response.dialog.participants[0].mute = false;
    dialogStatedata.response.dialog.participants[0].stateChangeTime = datetime;
    dialogStatedata.response.dialog.participants[0].state = "ACTIVE";
    // if (dialogStatedata.response.dialog.callEndReason == "direct-transfered" || consultCalldata.response.dialog.callEndReason == "ATTENDED_TRANSFER") {
    //     dialogStatedata.response.dialog.isCallEnded = 0;
    // } else {
    //     dialogStatedata.response.dialog.isCallEnded = 1;
    // }
    dialogStatedata.response.dialog.state = "ACTIVE";
    dialogStatedata.response.dialog.isCallAlreadyActive = true;
    // console.log("callEndReason ===> "+ dialogStatedata.response.dialog.callEndReason)
    // console.log(JSON.stringify(dialogStatedata.response.dialog))
    var data = {}
    data.response = dialogStatedata.response
    data.event = dialogStatedata.event
    const dialogStatedataCopy = JSON.parse(JSON.stringify(data));
    callback(dialogStatedataCopy);
    SendPostMessage(dialogStatedata);
    dialogStatedata.response.dialog.callEndReason = null;
    // dialogStatedata = null;
    // clearTimeout(myTimeout);
  }
}

// function attendedTransferMessage(dialogId){
//     let message = {
//         event : "Transfer",
//         dialog : {
//             id : dialogId,
//             message : "A1 has initiated Attended Transfer (Consult Transfer) between C1 and A2",
//             call1 : calls[0].response.dialog.id,
//             call2 : calls[1].response.dialog.id,
//         }
//     }
//     sendMessage(message , dialogId)
// }

function sendMessage(message, dialogId) {
  var destination = 0
  var index = getCallIndex(dialogId);
  var sessionall = null
  if (index !== -1) {
    sessionall = calls[index];
  }
  if (!sessionall) {
    return
  }
  //callType = "OUT" means its a Customer Call and we are on Customer Widget
  if (sessionall.response.dialog.callType == "OUT") {
    // if (dialogStatedata && dialogStatedata.response && dialogStatedata.response.dialog) {
    destination = sessionall.additionalDetail.agentExt
    // }
  }
  else {
    if (typeof sessionall.session.incomingInviteRequest !== 'undefined') {
      destination = sessionall.session.incomingInviteRequest.message.from.uri.normal.user
    }
    else if (typeof sessionall.session.outgoingInviteRequest !== 'undefined') {
      destination = sessionall.session.outgoingInviteRequest.message.to.uri.normal.user
    }
  }

  // if(sessionall.response.dialog.callType !== "OUT"){
  //     if (typeof sessionall.session.incomingInviteRequest !== 'undefined'){
  //         destination = sessionall.session.incomingInviteRequest.message.from.uri.normal.user
  //     }
  //     else if (typeof sessionall.session.outgoingInviteRequest !== 'undefined'){
  //         destination = sessionall.session.outgoingInviteRequest.message.to.uri.normal.user
  //     }
  // }

  // else if(sessionall.response.dialog.callType == "OUT"){

  // }

  const message_targetUri_value = new SIP.URI("sip", destination, sipconfig.uriFs)
  messager = new SIP.Messager(userAgent, message_targetUri_value, JSON.stringify(message));
  messager.message();
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
    error('invalidState', loginid, "invalid action sendingReInvite", callback);
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

    }
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
    sessionDescriptionHandlerOptions: sessionDescriptionHandlerOption
  };

  sessionall.invite(updateCallOptions)
    .then(() => {
      console.log("Session converted successfully.");
      const sysdate = new Date();
      var datetime = sysdate.toISOString();
      if (_functionCallerName !== "mediaConversionEvent") {
        console.log("Call is converting, Manually triggered")
        var data = {}
        data.response = calls[index].response;
        data.event = calls[index].event;
        data.response.dialog.participants[0].stateChangeTime = datetime;
        data.response.dialog.isCallAlreadyActive = true;
        if (typeof callback === 'function') {
          const dataCopy = JSON.parse(JSON.stringify(data));
          callback(dataCopy);
          SendPostMessage(data);
        }

        setupRemoteMedia(sessionall, callback)
        generateConversionEvent(dialogId, streamType, "on", callback)
      }
      else {
        console.log("Call is converting, Automatic triggered")
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

    })
    .catch((errorr) => {
      console.error("Failed to Convert the session:", errorr);
      error('generalError', loginid, errorr.message, callback);
    });
}

async function permissionDenied(error, constraints) {
  if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
    const permissions = await Promise.all([
      navigator.permissions.query({ name: 'camera' }),
      navigator.permissions.query({ name: 'microphone' })
    ]);

    permissions.forEach((permission) => {
      console.log(permission)
      console.log(constraints)
      let denied_component = ""
      if (permission.state === 'denied') {

        if (permission.name === "audio_capture") { denied_component = "audio" }
        if (permission.name === "video_capture") { denied_component = "video" }
        alert(`Access to ${denied_component} is denied. Please enable it in your browser settings.`);
      }
      if (permission.state === 'prompt' && permission.name === "video_capture") {
        denied_component = "Screen-share"
        alert(`Access to ${denied_component} is denied. Please enable it in your browser settings.`);
      }
    });
  }
  if (error.name === "NotFoundError") {
    alert(`Audio/Video Device Not Found. Please make sure your Audio/Video Device are working`);
  }
}

function agentDetailsToOtherParticiapnt(dialogId) {
  var index = getCallIndex(dialogId);
  var sessionall = null
  if (index !== -1) {
    sessionall = calls[index];
  }
  if (!sessionall) {
    error('invalidState', loginid, "invalid action agentDetailsToOtherParticiapnt", callback);
    return;
  }
  if (sessionall.response && sessionall.response.dialog && (sessionall.response.dialog.callType == "OTHER_IN" /*|| sessionall.response.dialog.callType == "CONSULT" */)) {
    let customEvent = {
      "event": "agentDetails",
      "dialog": {
        "id": dialogId,
        "agentExt": loginid,
        "callType": sessionall.response.dialog.callType == "OTHER_IN" ? "OUT" : "CONSULT"
      }
    }
    sendMessage(customEvent, dialogId)
    // sendCallMessage(customEvent, dialogId)
  }
}

function updateAgentDetails(message) {
  var index = getCallIndex(message.dialog.id);
  var sessionall = null
  if (index !== -1) {
    sessionall = calls[index];
  }
  if (!sessionall) {
    error('invalidState', loginid, "invalid action updateAgentDetails", callback);
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
    // console.log("DIALOG STATE =======>", dialogStatedata)
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
function generateConversionEvent(dialogId, streamType, streamStatus, callback) {
  const sysdate = new Date();
  var datetime = sysdate.toISOString();
  mediaConversion.loginId = loginid
  mediaConversion.status = "success"
  mediaConversion.dialog.id = dialogId
  mediaConversion.dialog.eventRequest = "local"
  mediaConversion.dialog.stream = streamType
  mediaConversion.dialog.streamStatus = streamStatus
  mediaConversion.dialog.timeStamp = datetime
  const mediaConversionCopy = JSON.parse(JSON.stringify(mediaConversion));
  callback(mediaConversionCopy);

  // other party

  mediaConversion.loginId = ""
  mediaConversion.status = "success"
  mediaConversion.dialog.id = dialogId
  mediaConversion.dialog.eventRequest = "remote"
  mediaConversion.dialog.stream = streamType
  mediaConversion.dialog.streamStatus = streamStatus
  mediaConversion.dialog.timeStamp = datetime
  sendMessage(mediaConversion, dialogId)
}


/**
 * Terminates all remaining calls when an agent or customer leaves the call.
 * 
 * @returns {Promise} - A promise that resolves after all remaining calls are terminated.
 */
async function terminateAllRemainingCalls(dialogId) {
  console.log("TERMINATING ALL REMAINING CALLS")
  var index = getCallIndex(dialogId);
  var sessionall = null
  if (index !== -1) {
    sessionall = calls[index];
  }
  if (!sessionall) {
    console.log("ERROR : invalid action terminateAllRemainingCalls");
    return;
  }

  /**
   * A1C1 & A1A2
   * If C1 leaves the A1-C1 call, the call is ended for A1 as well, automatically ending the consult call.
   *  
   * A1C1A2
   * If C1 Leaves the A1-C1-A2 call, the call is ended for A1 & A2
   * If A1 Leaves the A1-C1-A2 call, the call is ended for A1 only and if a consult call is ACTIVE that call is also Ended
   * If A2 Leaves the A1-C1-A2 call, the call is ended for A2 only and if a consult call is ACTIVE that call is also Ended
   */
  terminateIndexOneCall()
}

function terminateIndexOneCall() {
  if (calls && calls[1] && calls[1].session && calls[1].session.state == SIP.SessionState.Established) {
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
function terminateIndexZeroCall() {
  if (calls && calls[0] && calls[0].session && calls[0].session.state == SIP.SessionState.Established) {
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

var errorMediaDevice = {
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
}


/**
 * Function used to identify what kind of media device error occurred.
 * 
 * @param {string} errorName - The name of the media device error.
 * @param {Object} constraints - The constraints related to the media device.
 * @returns {Promise<void>} - A promise that resolves once the error is handled.
 */
async function mediaDeviceErrors(errorName) {
  if (errorName === 'NotAllowedError' || errorName === 'PermissionDeniedError') {
    const permissions = await Promise.all([
      navigator.permissions.query({ name: 'camera' }),
      navigator.permissions.query({ name: 'microphone' })
    ]);
    var _alert = ""

    permissions.forEach((permission) => {
      console.log(permission)
      let denied_component = ""
      if (permission.state === 'denied') {
        if (permission.name === "audio_capture") { denied_component = "audio" }
        if (permission.name === "video_capture") { denied_component = "video" }
        _alert = `Access to ${denied_component} is denied. Please enable it in your browser settings.`;
      }
      if (permission.state === 'prompt' && permission.name === "video_capture") {
        denied_component = "Screen-share"
        _alert = `Access to ${denied_component} is denied. Please enable it in your browser settings.`;
      }
    });
    return {
      reason: "Permission Deined !!",
      alert: _alert
    };
  }
  else {
    if (errorMediaDevice.hasOwnProperty(errorName)) {
      return errorMediaDevice[errorName];
    } else {
      return {
        reason: "Unknown error occurred.",
        alert: "An unknown error occurred. Please try again."
      };
    }
  }
}


/**
 * Handles mediaConversion event received by the user.
 *
 * @param {Object} eventData - Data associated with the mediaConversion event.
 * @param {Function} callback - Callback function to execute after handling the event.
 */
function mediaConversionEvent(someMessage, callback) {

  var _event = JSON.parse(JSON.stringify(someMessage))
  if (_event.status == "success" && _event.dialog.eventRequest == "remote") {
    var index = getCallIndex(_event.dialog.id);
    var sessionall = null
    if (index !== -1) {
      sessionall = calls[index];
    }
    if (!sessionall) {
      error('invalidState', loginid, "invalid action mediaConversionEvent", callback);
      return;
    }

    if (sessionall.response.dialog.mediaType == "audio") {
      if (sessionall.additionalDetail) {
        if (!sessionall.additionalDetail.remoteVideoDisplay) {
          // False, meaning  current Call is in Audio so convert the call
          sendingReInvite(_event.dialog.id, callback, "video")
          callback(_event)
          return
        }
      }
    }
  }
}
