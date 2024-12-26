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
function widgetConfigs(ccmUrl, widgetIdentifier, callback) {
  fetch(`${ccmUrl}/widget-configs/${widgetIdentifier}`)
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
  fetch(`${formUrl}/forms/${formId}`)
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
  fetch(`${formUrl}/formValidation`)
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
function sendMessage(data) {
  data.timestamp = '';
  this.socket.emit('MESSAGE_RECEIVED', data, (res) => {
    console.log('[sendMessage] ', res);
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

  fetch(`${config.ServerUrl}/api/customer/init`, requestOptions)
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
  fetch(`${fileServerUrl}/api/uploadFileStream`, {
    method: 'POST',
    body: formData
  })
    .then((response) => response.json())
    .then((result) => {
      console.log('Success: ', result);
      callback(result);
    })
    .catch((error) => {
      console.error('Error: ', error.message);
      callback({ error, isFileInvalid: true, errorMesage: "The file name contains special characters. Only underscore, hyphen and space are allowed in file name." });
    });
}
/**
 * Set Conversation Data Api
 */
async function setConversationData(url, conversationId, data) {
  const response = await fetch(`${url}/${conversationId}/conversation-data`, {
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
    const response = await fetch(`${url}/${channelIdentifier}/conversation-data-by-identifier`, {
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
    const response = await fetch(`${url}/get/${channelIdentifier}`, {
      method: 'GET', // Specify the HTTP method as GET
      headers: {
        'Content-Type': 'application/json' // Set appropriate headers if needed
      }
    });

    if (response.status === 403) {
      console.error('Forbidden: The server returned a 403 Forbidden response.');
      callback(response);
    } else if (!response.ok) {
      console.error(`Failed to fetch data from ${url}/get/${channelIdentifier}: ${response.status} ${response.statusText}`);
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
  const response = await fetch(`${url}/${conversationId}/conversation-data`);
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
  fetch(`${authenticatorUrl}/verifySecureLink`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(authData)
  })
    .then(async (response) => {
      const contentType = response.headers.get("content-type");
      if (!response.ok) {
        let errorMessage = 'Network response was not ok';
        if (response.status === 400) {
          // Handle the 400 Bad Request error here
          const errorData = await response.json();
          errorMessage = '400 Bad Request';
          // Custom handling for the error response
          callback({ error: true, message: errorMessage, data: errorData });
          throw new Error(errorMessage); // Stop the promise chain
        } else if (response.status === 500) {
          errorMessage = '500 Internal Server Error';
        }
        callback({ error: true, message: errorMessage });
        throw new Error(errorMessage); // Stop the promise chain
      }
      if (contentType && contentType.includes("application/json")) {
        return response.json();
      } else {
        return response.text(); // Handle plain text response
      }
    })
    .then((result) => {
      // This will not be executed if an error was thrown in the previous block
      // console.log('Authentication Api Success: ', result);
      // Check for the presence of reasonCode and message fields
      if ('reasonCode' in result && 'message' in result) {
        console.log('Authentication Api Error: ', result);
        callback({ status: 400, error: true, data: result, message: 'Something went wrong!!' });
      } else {
        console.log('Authentication Api Success: ', result);
        callback({ status: 200, error: false, data: result, message: 'Authentication Successful!!!' });
      }
    })
    .catch((error) => {
      // If an error is thrown in any of the previous blocks, it will be caught here
      console.error('Authentication Api Error: ', error);
      // Optionally, call the callback with an error if not already done
      // callback({ error: true, message: 'Something went wrong, please try again!' });
      // Since we're handling specific errors earlier, this catch might only be for unexpected errors
    });
}
/**
 * IP Data Request
 */
function getBrowserInfo(apiKey, callback) {
  // const apiKey = '5c8c5a26decc9b30da07abf360b73256faa5b00c59b32689c9860a84';
  try {
    fetch(`https://api.ipdata.co?api-key=${apiKey}`, {
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
    fetch(`${url}`, {
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
  fetch(`${url}/channels/service-identifier/${serviceIdentifier}`)
    .then(response => response.json())
    .then((data) => {
      callback(data);
    });
}

function getCalendarEvents(calendarId,url, startTime,endTime,callback) {
  fetch(`${url}/calendars/events?&calendarId=${calendarId}&startTime=${startTime}&endTime=${endTime}`)
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
 */
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
var mySessionDescriptionHandlerFactory = null

// Number of times to attempt reconnection before giving up
const reconnectionAttempts = 10;
// Number of seconds to wait between reconnection attempts
const reconnectionDelay = 5;
// Used to guard against overlapping reconnection attempts
let attemptingReconnection = false;
// If false, reconnection attempts will be discontinued or otherwise prevented
let shouldBeConnected = true;

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

let mediaConversion = {
  "event": "mediaConversion",
  "status": null, // error , success
  "loginId": "",
  "dialog": {
    "id": null,
    "eventRequest": null, //local , remote
    "stream": null, // video , screenshare
    "streamStatus": null,   //on , off 
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

function postMessages(obj, callback) {
  console.log(obj);
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
  }
}

function connect_useragent(extension, sip_uri, sip_password, wssFs, sip_log, callback) {

  var res = lockFunction("connect_useragent", 500); // --- seconds cooldown
  if (!res) return;
  const undefinedParams = checkUndefinedParams(connect_useragent, [extension, sip_uri, sip_password, wssFs, sip_log, callback]);

  if (undefinedParams.length > 0) {
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
      server: wssFs, // wss Protocol
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
          registerer.register()
            .then((request) => {
              console.log("Successfully sent REGISTER");
              console.log("Sent request = ", request);
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
        endCall = true;
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

        var incomingCallSource = ""
        var incomingMediaType = invitation.incomingInviteRequest.message.headers["X-Media-Type"];
        if (incomingMediaType != undefined) {
          incomingMediaType = incomingMediaType[0].raw;
          incomingCallSource = "webrtc"
        } else {
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
              setTimeout(respond_call, sipConfig.autoCallAnswer * 1000, callback);
            } else if (calltype == "CONSULT") {
              dialogStatedata.response.dialog.callType = "CONSULT";
              invitedata.response.dialog.callType = "CONSULT";
              dialogStatedata.event = "ConsultCall";
              invitedata.event = "ConsultCall";
            }
          } else {
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
        dialogStatedata.response.dialog.serviceIdentifer = dialedNumber;
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
        invitedata.response.dialog.serviceIdentifer = dialedNumber;
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

        if (calltype == "CONSULT") {
          dialogStatedata.response.dialog.customerNumber = invitation.incomingInviteRequest.message.headers["X-Customernumber"] != undefined ? invitation.incomingInviteRequest.message.headers["X-Customernumber"][0]['raw'] : "0000";
          dialogStatedata.response.dialog.serviceIdentifer = invitation.incomingInviteRequest.message.headers["X-Destination-Number"] != undefined ? invitation.incomingInviteRequest.message.headers["X-Destination-Number"][0]['raw'] : "0000";
          dialogStatedata.response.dialog.dialedNumber = invitation.incomingInviteRequest.message.headers["X-Destination-Number"] != undefined ? invitation.incomingInviteRequest.message.headers["X-Destination-Number"][0]['raw'] : "0000";
          dialogStatedata.response.dialog.callOriginator = "normal"
          dialogStatedata.response.dialog.mediaType = "audio"

          invitedata.response.dialog.customerNumber = invitation.incomingInviteRequest.message.headers["X-Customernumber"] != undefined ? invitation.incomingInviteRequest.message.headers["X-Customernumber"][0]['raw'] : "0000";
          invitedata.response.dialog.serviceIdentifer = invitation.incomingInviteRequest.message.headers["X-Destination-Number"] != undefined ? invitation.incomingInviteRequest.message.headers["X-Destination-Number"][0]['raw'] : "0000";
          invitedata.response.dialog.dialedNumber = invitation.incomingInviteRequest.message.headers["X-Destination-Number"] != undefined ? invitation.incomingInviteRequest.message.headers["X-Destination-Number"][0]['raw'] : "0000";
          invitedata.response.dialog.callOriginator = "normal"
          invitedata.response.dialog.mediaType = "audio"
        }

        const invitedataCopy = JSON.parse(JSON.stringify(invitedata));
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
      },
      onMessage: (message) => {
        let someMesage = JSON.parse(message.request.body)
        if (someMesage.event && someMesage.dialog.id) {
          var index = getCallIndex(someMesage.dialog.id);
          var someSession;
          if (index !== -1) {
            someSession = calls[index].session;
          }
          if (!someSession) {
            return;
          }
          switch (someMesage.event) {
            case "Transfer":
              attendedTransferEvent(callback)
              break
            case "mediaConversion":
              someMesage.loginId = loginid
              callback(JSON.parse(JSON.stringify(someMesage)))
              break
            case "agentDetails":
              updateAgentDetails(someMesage)
              break
            default:
              break
          }
        }
      },
      onNotify: (notification) => {
        console.log("NOTIFY received", notification);
      },
      onRefer: (referral) => {
        console.log("REFER onRefer received");
      },
      onSubscribe: (subscription) => {
        console.log("SUBSCRIBE received");
      },
      onReject: (response) => {
        console.log("onReject response = ", response);
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
            if (dialogStatedata.response.dialog.state == "ACTIVE" && endCall == true) {
              //need to setup for loop here . 
              setTimeout(terminateAllCalls, 5000);
              endCall = false;
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

function initiate_call(calledNumber, DN, mediaType, authData, callback, callType) {
  var res = lockFunction("initiate_call", 500); // --- seconds cooldown
  if (!res) return;
  const undefinedParams = checkUndefinedParams(initiate_call, [calledNumber, DN, mediaType, authData, callback, callType]);

  if (undefinedParams.length > 0) {
    error("generalError", loginid, `Error: The following parameter(s) are undefined or null or empty: ${undefinedParams.join(', ')}`, callback);
    return;
  }

  if (userAgent !== null && userAgent !== undefined) {
    var sip_uri = SIP.UserAgent.makeURI('sip:' + calledNumber + "@" + sipconfig.uriFs);
    if (!sip_uri) {
      error("generalError", loginid, "Invalid target Uri:" + calledNumber, callback);
      return;
    }
    // Create new Session instance in "initial" state
    sessionall = new SIP.Inviter(userAgent, sip_uri);
    const request = sessionall.request;

    // request.extraHeaders.push('X-Agent-Id:' + authData.agentId);
    // request.extraHeaders.push('X-Agent-Name:' + authData.agentName);
    // request.extraHeaders.push('X-Agent-Extension:' + authData.agentExtension);
    // request.extraHeaders.push('X-Customer-Number:' + authData.customerNumber);
    // request.extraHeaders.push('X-Channel:' + authData.channel);
    // request.extraHeaders.push('X-Customer-Id:' + authData.customerId);
    // request.extraHeaders.push('X-Service-Identifier:' + authData.serviceIdentifier);

    // request.extraHeaders.push('X-Destination-Number:' + DN);
    // request.extraHeaders.push('X-Media-Type:' + calltype)
    // request.extraHeaders.push('Another-Header: Value2');

    request.extraHeaders.push('X-Destination-Number:' + DN);
    request.extraHeaders.push('X-Media-Type:' + mediaType)
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

            outboundDialingdata.response.loginId = loginid;
            outboundDialingdata.response.dialog.fromAddress = loginid;
            outboundDialingdata.response.dialog.callType = callType == "MONITORING" ? "MONITORING" : "OUT";
            outboundDialingdata.response.dialog.ani = dialedNumber;
            outboundDialingdata.response.dialog.dnis = dialedNumber;
            outboundDialingdata.response.dialog.serviceIdentifer = dialedNumber;
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
            outboundDialingdata.response.dialog.callOriginator = "webrtc"

            dialogStatedata.response.dialog.mediaType = mediaType
            dialogStatedata.response.dialog.callOriginator = "webrtc"

            var data = {}
            data.event = outboundDialingdata.event
            data.response = outboundDialingdata.response
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
          var dialogstatemedia = JSON.parse(JSON.stringify(dialogStatedata));
          dialogstatemedia.response.dialog.participants[0].mute = false;
          callback(dialogstatemedia);
          SendPostMessage(dialogstatemedia);
          if (index != -1) {
            calls[index].response = dialogStatedata.response;
            calls[index].event = "dialogState";
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
            if (dialogStatedata.response.dialog.callEndReason == "direct-transfered") {
              dialogStatedata.response.dialog.isCallEnded = 0;
            } else {
              dialogStatedata.response.dialog.isCallEnded = 1;
            }
            dialogStatedata.response.dialog.state = "DROPPED";
            dialogStatedata.response.dialog.isCallAlreadyActive = false;
            const dialogStatedataCopy = JSON.parse(JSON.stringify(dialogStatedata));
            callback(dialogStatedataCopy);
            console.log('call end reason :', dialogStatedata.response.dialog.callEndReason);
            SendPostMessage(dialogStatedata);
            dialogStatedata.response.dialog.callEndReason = null;
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
  } else {
    error('invalidState', loginid, "invalid action rejectCall", callback);
  }
}

function phone_hold(callback, dialogId) {
  var res = lockFunction("phone_hold", 500); // --- seconds cooldown
  if (!res) return;
  var index = getCallIndex(dialogId);
  if (index !== -1) {
    sessionall = calls[index].session;
  }
  if (!sessionall || dialogStatedata.response.dialog.state == "HELD") {
    error('invalidState', loginid, "invalid action holdCall", callback);
    return;
  }
  //for mute/unmute
  let peer = sessionall.sessionDescriptionHandler.peerConnection;
  let senders = peer.getSenders();

  if (!senders.length) return;

  // Hold the session by sending a re-INVITE with hold session description
  const holdOptions = {
    sessionDescriptionHandlerOptions: {
      hold: true,
    }
  };

  sessionall.invite(holdOptions)
    .then(() => {
      console.log("Session held successfully.");
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
        const dataCopy = JSON.parse(JSON.stringify(data));
        callback(dataCopy);
        SendPostMessage(data);
      }
    })
    .catch((errorr) => {
      console.error("Failed to hold the session:", errorr);
      error('generalError', loginid, errorr.message, callback);
    });

}

function phone_unhold(callback, dialogId) {
  var res = lockFunction("phone_unhold", 500); // --- seconds cooldown
  if (!res) return;
  var index = getCallIndex(dialogId);
  if (index !== -1) {
    sessionall = calls[index].session;
  }
  if (!sessionall || dialogStatedata.response.dialog.state == "ACTIVE") {
    error('invalidState', loginid, "invalid action unholdCall", callback);
    return;
  }
  //for mute/unmute
  let peer = sessionall.sessionDescriptionHandler.peerConnection;
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

  sessionall.invite(holdOptions)
    .then(() => {
      console.log("Session unhold successfully.");
      const sysdate = new Date();
      var datetime = sysdate.toISOString();
      var data = {}
      data.response = calls[index].response;
      data.event = calls[index].event;
      data.response.dialog.participants[0].stateChangeTime = datetime;
      data.response.dialog.participants[0].state = "ACTIVE";
      data.response.dialog.state = "ACTIVE";
      data.response.dialog.isCallAlreadyActive = true;
      if (typeof callback === 'function') {
        const dataCopy = JSON.parse(JSON.stringify(data));
        callback(dataCopy);
        SendPostMessage(data);
      }
    })
    .catch((errorr) => {
      console.error("Failed to unhold the session:", errorr);
      error('generalError', loginid, errorr.message, callback);
    });
}

function phone_mute(callback, dialogId) {
  var res = lockFunction("phone_mute", 500); // --- seconds cooldown
  if (!res) return;
  var index = getCallIndex(dialogId);
  if (index !== -1) {
    sessionall = calls[index].session;
  }
  if (!sessionall) {
    error('invalidState', loginid, "invalid action mute_call", callback);
    return;
  }
  //for mute/unmute
  let peer = sessionall.sessionDescriptionHandler.peerConnection;
  let senders = peer.getSenders();

  if (!senders.length) return;

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
    const dataCopy = JSON.parse(JSON.stringify(data));
    callback(dataCopy);
    SendPostMessage(data);
  }
}

function phone_unmute(callback, dialogId) {
  var res = lockFunction("phone_unmute", 500); // --- seconds cooldown
  if (!res) return;
  var index = getCallIndex(dialogId);
  if (index !== -1) {
    sessionall = calls[index].session;
  }
  if (!sessionall) {
    error('invalidState', loginid, "invalid action unmute_call", callback);
    return;
  }
  //for mute/unmute
  let peer = sessionall.sessionDescriptionHandler.peerConnection;
  let senders = peer.getSenders();

  if (!senders.length) return;

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
    const dataCopy = JSON.parse(JSON.stringify(data));
    callback(dataCopy);
    SendPostMessage(dialogStatedata);    // consult Jazeb on this 
  }
}

function respond_call(callback, dialogId, type) {
  var res = lockFunction("respond_call", 500); // --- seconds cooldown
  if (!res) return;
  var index = getCallIndex(dialogId);
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
          if (sender.track.kind === "video") {
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

function callConvert(dialogId, callback, streamType, streamStatus) {
  var res = lockFunction("callConvert", 500); // --- seconds cooldown
  if (!res) return;
  const undefinedParams = checkUndefinedParams(callConvert, [streamType, streamStatus, callback, dialogId]);

  if (undefinedParams.length > 0) {
    error("generalError", loginid, `Error: The following parameter(s) are undefined or null or empty: ${undefinedParams.join(', ')}`, callback);
    return;
  }
  var index = getCallIndex(dialogId);
  if (index !== -1) {
    sessionall = calls[index].session;
  }

  if (!sessionall) {
    error('invalidState', loginid, "invalid action ConvertCall", callback);
    return;
  }

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

  // var remoteVideo = document.getElementById('remoteVideo');
  setTimeout(() => {
    if (document.getElementById('remoteVideo')) document.getElementById('remoteVideo').srcObject = remoteStream;

    console.log('<== remote Stream Audio Track:', remoteStream.getAudioTracks());
    console.log('<== remote Video Tag:', document.getElementById('remoteVideo'));
    console.log('<== remote Stream Video Track:', remoteStream.getVideoTracks());
  }, 2000)

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

function attendedTransferEvent(callback) {
  // End Consult Call
  console.log("Consult Call Ended");

  var sysdate1 = new Date();
  var datetime = sysdate1.toISOString();
  if (dialogStatedata && dialogStatedata.response && dialogStatedata.response.dialog) {
    dialogStatedata.response.dialog.callEndReason = "consult-transfer";
    dialogStatedata.response.dialog.participants[0].mute = false;
    dialogStatedata.response.dialog.participants[0].stateChangeTime = datetime;
    dialogStatedata.response.dialog.participants[0].state = "DROPPED";
    if (dialogStatedata.response.dialog.callEndReason == "direct-transfered" || dialogStatedata.response.dialog.callEndReason == "consult-transfer") {
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
    // if (dialogStatedata.response.dialog.callEndReason == "direct-transfered" || consultCalldata.response.dialog.callEndReason == "consult-transfer") {
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

function attendedTransferMessage(dialogId) {
  let message = {
    event: "Transfer",
    dialog: {
      id: dialogId,
      message: "A1 has initiated Attended Transfer (Consult Transfer) between C1 and A2",
      call1: calls[0].response.dialog.id,
      call2: calls[1].response.dialog.id,
    }
  }
  sendCallMessage(message, dialogId)
}

function sendCallMessage(message, dialogId) {
  var destination = 0
  var index = getCallIndex(dialogId);
  var _sessionall = null
  if (index !== -1) {
    _sessionall = calls[index];
  }

  if (_sessionall.response.dialog.callType == "OUT") {
    if (dialogStatedata && dialogStatedata.response && dialogStatedata.response.dialog) {
      destination = dialogStatedata.additionalDetail.agentExt
    }
  } else if (_sessionall.response.dialog.callType == "CONSULT") {
    if (dialogStatedata && dialogStatedata.response && dialogStatedata.response.dialog && dialogStatedata.response.dialog.callType == "CONSULT") {
      // This is true when A2 receive a Consult Call from A1 
      if (typeof _sessionall.session.incomingInviteRequest !== 'undefined') {
        destination = _sessionall.session.incomingInviteRequest.message.from.uri.normal.user
      } else if (typeof _sessionall.session.outgoingInviteRequest !== 'undefined') {
        destination = _sessionall.session.outgoingInviteRequest.message.to.uri.normal.user
      }
    } else if (consultCalldata && consultCalldata.response && consultCalldata.response.dialog && consultCalldata.response.dialog.callType == "CONSULT") {
      // This is true when A1 initaite a Consult call with A2
      destination = consultCalldata.additionalDetail.agentExt
    }
  } else {
    if (typeof _sessionall.session.incomingInviteRequest !== 'undefined') {
      destination = _sessionall.session.incomingInviteRequest.message.from.uri.normal.user
    } else if (typeof _sessionall.session.outgoingInviteRequest !== 'undefined') {
      destination = _sessionall.session.outgoingInviteRequest.message.to.uri.normal.user
    }
  }
  const message_targetUri_value = new SIP.URI("sip", destination, sipconfig.uri)
  messager = new SIP.Messager(userAgent, message_targetUri_value, JSON.stringify(message));
  messager.message();
}

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
    sendCallMessage(customEvent, dialogId)
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
    let additionalDetails = {
      "agentExt": message.dialog.agentExt
    }
    sessionall.additionalDetail = additionalDetails
    // console.log("DIALOG STATE =======>", dialogStatedata)
    // }


  }
}

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
  sendCallMessage(mediaConversion, dialogId)
}

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

  if (sessionall.response.dialog.callType == "CONFERENCE") {
    console.log("CALLTYPE is CONFERENCE, Need work on this")
    return
  }
  // OUT, OTHER_IN,CONSULT(A2)
  if (index == 0) {
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
}