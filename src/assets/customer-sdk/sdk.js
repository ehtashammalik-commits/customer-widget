var wssServerIp;
var wssServerPort;
var diallingURI;
var sipExtension;
var extensionPassword;
var IP;
var wssPort;
var dialerURI;
var sipPassword;
var enableLogs;
var chatWebhook;
var preChatForm;

var session;
var mediaElement;
var mediaLocal;
var userAgent;
var ext;
var register = false;
let displayMediaStream;
var toggleVideo;
var video;
var audio;
var screen;
var mediaAcquire = 'end';
var endCallBtn = false;

const getDynamicExt = () => new Promise((resolve, reject) => {
  resolve(sipExtension);
});

// /* Function to Include js files in the customer application*/
// function include(file) {
//   var script = document.createElement('script');
//   script.src = file;
//   script.type = 'text/javascript';
//   script.defer = true;
//   document.getElementsByTagName('head').item(0).appendChild(script);
// }
// // /* Include js files */
// include('https://cdn.socket.io/4.5.4/socket.io.min.js');
// include('https://cdnjs.cloudflare.com/ajax/libs/sip.js/0.15.11/sip-0.15.11.min.js');

// console.log("socket url :", libConfig.socket_url);
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
      wssServerIp = data.webRtc.wssServerIp;
      wssServerPort = data.webRtc.wssServerPort;
      diallingURI = data.webRtc.diallingUri;
      sipExtension = data.webRtc.sipExtension;
      extensionPassword = data.webRtc.extensionPassword;
      enable_sip_logs = data.webRtc.enabledSipLogs;
      enableLogs = enable_sip_logs;
      IP = wssServerIp;
      wssPort = wssServerPort;
      dialerURI = 'sip:' + diallingURI + '@' + wssServerIp;
      sipPassword = extensionPassword;

      chatWebhook = data.webhook_url;
      preChatForm = data.form;
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
 *
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
    // console.log("Socket ", this.socket);
    // console.log("Socket connected ", this.socket.connected);
    // console.log("this.config.SocketUrl ", socket_url);
    if (this.socket === undefined || !this.socket.connected) {
      if (socket_url !== '') {
        console.log("going new connection");
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
      let error = localStorage.getItem("error");
      if (error) {
        console.log(`${error}`);
        resumeChat({
          serviceIdentifier: this.socket.auth.serviceIdentifier,
          channelCustomerIdentifier: this.socket.auth.channelCustomerIdentifier
        });
      }
      callback({ type: "SOCKET_CONNECTED", data: this.socket });
    }
  });
  this.socket.on('CHANNEL_SESSION_STARTED', (data) => {
    console.log(`Channel Session Started Data: `, data);
    callback({ type: "CHANNEL_SESSION_STARTED", data: data });
  });
  this.socket.on('MESSAGE_RECEIVED', (message) => {
    console.log(`MESSAGE_RECEIVED received: `, message);
    callback({ type: "MESSAGE_RECEIVED", data: message });
  });
  this.socket.on('disconnect', (reason) => {
    console.error(`Connection lost with the server: `, reason);
    callback({ type: "SOCKET_DISCONNECTED", data: reason });
  });
  this.socket.on('connect_error', (error) => {
    console.log(`unable to establish connection with the server: `, error.message);
    localStorage.setItem("error", "1");
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
      // webhookNotifications(data.data.formData);
      this.socket.emit('CHAT_REQUESTED', obj);
      console.log(`SEND CHAT_REQUESTED DATA:`, obj);
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
 *
 * @param {*} data
 */
function resumeChat(data, callback) {
  this.socket.emit("CHAT_RESUMED", data, (res) => {
    if (res) {
      console.log(res, 'resume chat response in sdk.');
      callback(res);
    }
  });
}

function sendJoinConversation(data) {
  this.socket.emit("joinConversation", data, (res) => {
    console.log("[sendJoinConversation] ", data);
    return res;
  });
}

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
      console.error('Error: ', error);
      callback(error);
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
 * Webhook Notifications Functions
 * @param {*} data
 */
function webhookNotifications(url,data) {
  let notifications = {};
  notifications['text'] = `Name: ${data.attributes.name} Email: ${data.attributes.email} started a chat`
  fetch(`${url}`, {
    method: 'POST',
    body: JSON.stringify(notifications),
    headers: {
      "Content-Type": "application/json; charset=UTF-8"
    }
  })
    .then((response) => response.json())
    .then((result) => {
      console.log('Success: ', result);
      // callback(result);
    })
    .catch((error) => {
      console.error('Error: ', error);
      // callback(error);
    });
}

function endCall() {
  if (session === true) {
    closeSession();
    clearInterval(countervar);
  } else {
    toggleFab();
    hideChat(0);
  }
}

function dialCall(callType, userData) {
  getDynamicExt().then((extension) => {
    // Create a user agent named extension, connect, and register to receive invitations.
    ext = extension;
    console.log(wssServerIp, 'ip at call time');
    userAgent = new SIP.UA({
      uri: extension + '@' + wssServerIp,
      transportOptions: { wsServers: 'wss://' + wssServerIp + ':' + wssServerPort, traceSip: true },
      authorizationUser: extension,
      password: extensionPassword,
      log: {
        builtinEnabled: enableLogs,
        level: 3 // log log level
      },
      register: true
    });
    // Connect the user agent
    userAgent.start();
    if (typeof eventsCallback === "function") {
      let event = {
        event: 'get_dynamic_ext',
        response: extension,
        cause: ''
      };
      eventsCallback(event);
    }

    userAgent.on('unregistered', function (response, cause) {
      register = false;
      if (typeof eventsCallback === "function") {
        let event = {
          event: 'unregistered',
          response: response,
          cause: cause
        };
        eventsCallback(event);
      }

    });

    userAgent.on('registered', function () {
      register = true;
      if (typeof eventsCallback === "function") {
        let event = {
          event: 'registered',
          response: '',
          cause: ''
        };
        eventsCallback(event);
      }
    });

    userAgent.on('registrationFailed', function (response, cause) {
      if (typeof eventsCallback === "function") {
        let event = {
          event: 'registrationFailed',
          response: response,
          cause: cause
        };
        eventsCallback(event);
      }
    });
  })
    .catch((rej) => {
      if (typeof eventsCallback === "function") {
        let event = {
          event: 'get_dynamic_ext',
          response: '',
          cause: rej
        };
        eventsCallback(event);
      }
    });

}

const sendInvite = (mediaType, videoName, videoLocal, userData) => {
  return new Promise((resolve, reject) => {
    var mediaConstraints = { audio: true, video: true };
    toggleVideo = 'web_cam';
    mediaElement = document.getElementById(videoName);
    if (videoLocal === '') {
      mediaLocal = '';
    } else {
      mediaLocal = document.getElementById(videoLocal);
    }
    audio = 'true';
    if (mediaType === 'audio') {
      mediaConstraints = { audio: true, video: false };
      video = 'false';
    } else {
      mediaConstraints = { audio: true, video: true };
      video = 'true';
    }
    screen = 'false';

    console.log("invite function has been triggered");
    if (userData !== null) {
      var extraHeaderString = []
      var index = 0
      for (const key in userData) {
        var keyvalue = userData[key].trim();
        extraHeaderString.push('X-variable' + index + ":" + key + "|" + keyvalue);
        index++;
      }
    }
    session = userAgent.invite('sip:' + diallingURI + '@' + wssServerIp, {
      sessionDescriptionHandlerOptions: {
        constraints: mediaConstraints
      }
      , extraHeaders: extraHeaderString
    });
    if (typeof eventsCallback === "function") {
      let event = {
        event: 'Channel Creating',
        response: '',
        cause: ''
      };
      eventsCallback(event);
    }
    session.on('accepted', function () {
      // Assumes you have a media element on the DOM
      const remoteStream = new MediaStream();
      if (video === 'false') {
        console.log("closing video")
      }
      session.sessionDescriptionHandler.peerConnection.getReceivers().forEach((receiver) => {
        if (receiver.track) {
          console.log(receiver.track);
          remoteStream.addTrack(receiver.track);
        }
      });
      mediaElement.srcObject = remoteStream;
      if (mediaLocal !== '') {
        const localStream = new MediaStream();
        session.sessionDescriptionHandler.peerConnection.getSenders().forEach((sender) => {
          if (sender.track.kind === "video") {
            console.log(sender.track);
            localStream.addTrack(sender.track);
          }
        });
        mediaLocal.srcObject = localStream;
      }
      if (typeof eventsCallback === "function") {
        let event = {
          event: 'session-accepted',
          response: '',
          cause: ''
        };
        eventsCallback(event);
      }
    })
    session.on('progress', function (response) {
      if (typeof eventsCallback === "function") {
        let event = {
          event: 'session-progress',
          response: response,
          cause: ''
        };
        eventsCallback(event);
      }
    })
    session.on('rejected', function (response, cause) {
      if (typeof eventsCallback === "function") {
        let event = {
          event: 'session-rejected',
          response: response,
          cause: cause
        };
        eventsCallback(event);
      }
    })

    session.on('failed', function (response, cause) {
      if (typeof eventsCallback === "function") {
        let event = {
          event: 'session-failed',
          response: response,
          cause: cause
        };
        eventsCallback(event);
      }
      var options = {
        'all': true
      };

      userAgent.unregister(options);
    })
    session.on('terminated', function (message, cause) {
      closeSession();
      if (typeof eventsCallback === "function") {
        let event = {
          event: 'session-terminated',
          response: message,
          cause: cause
        };
        eventsCallback(event);
      }
    })
    session.on('bye', function (request) {
      if (typeof eventsCallback === "function") {
        let event = {
          event: 'session-bye',
          response: request,
          cause: ''
        };
        eventsCallback(event);
      }
    })
    session.on('iceConnectionDisconnected', function () {
      if (typeof eventsCallback === "function") {
        let event = {
          event: 'session-iceConnectionDisconnected',
          response: 'request',
          cause: ''
        };
        eventsCallback(event);
      }
    })
    session.on('SessionDescriptionHandler-created', function () {
      session.sessionDescriptionHandler.on('getDescription', function (sdpWrapper) {
        if (typeof eventsCallback === "function") {
          let event = {
            event: 'session-SessionDescriptionHandler-getDescription',
            response: sdpWrapper,
            cause: ''
          };
          eventsCallback(event);
        }
      })
      session.sessionDescriptionHandler.on('Media acquire start', function () {
        mediaAcquire = 'start';
        if (typeof eventsCallback === "function") {
          let event = {
            event: 'session-SessionDescriptionHandler-Media acquire start',
            response: '',
            cause: ''
          };
          eventsCallback(event);
        }
      })
      session.sessionDescriptionHandler.on('Media acquire end', function () {
        if (endCallBtn === true) {
          terminateCurrentSession();
          endCallBtn = false;
        }
        mediaAcquire = 'end';
        if (typeof eventsCallback === "function") {
          let event = {
            event: 'session-SessionDescriptionHandler-Media acquire end',
            response: '',
            cause: ''
          };
          eventsCallback(event);
        }
      })
      if (typeof eventsCallback === "function") {
        let event = {
          event: 'session-SessionDescriptionHandler-created',
          response: '',
          cause: ''
        };
        eventsCallback(event);
      }

    });
    resolve("successful");

  });

}


function closeVideo() {
  let pc = this.session.sessionDescriptionHandler.peerConnection;
  pc.getSenders().find(function (s) {
    if (s.track.readyState == 'live' && s.track.kind === 'video') {
      s.track.stop();
    }
  });
}
function terminateCurrentSession() {
  promise1.then((value) => {
    userAgent.stop();
  }).then(function (results) {
    userAgent.transport.disconnect();
  }).then(function (results) {
    var options = {
      'all': true
    };
    userAgent.unregister(options);
  }).then(function (results) {
    if (typeof eventsCallback === "function") {
      let event = {
        event: 'session-session_ended',
        response: 'userAgent unregistered',
        cause: ''
      };
      eventsCallback(event);
    }
  });

}
const promise1 = new Promise((resolve, reject) => {
  resolve('Success!');
});
function closeSession() {
  if (mediaAcquire === 'start') {
    endCallBtn = true;
  } else {
    terminateCurrentSession();
  }
}

function audioControl() {
  let pc = session.sessionDescriptionHandler.peerConnection;
  if (audio === 'true') {
    pc.getSenders().find(function (s) {
      console.log(s.track.kind + "--------------" + s.track.readyState);
      if (s.track.readyState == 'live' && s.track.kind === 'audio') {
        s.track.stop();
      }
    });

    audio = 'false';
  } else {
    navigator.mediaDevices
      .getUserMedia({
        audio: true
      })
      .then(function (stream) {
        let audioTrack = stream.getAudioTracks()[0];
        var sender = pc.getSenders().find(function (s) {

          return s.track.kind == audioTrack.kind;
        });
        console.log('found sender:', sender);
        sender.replaceTrack(audioTrack);
      })
      .catch(function (err) {
        console.error('Error happens:', err);
      });

    audio = 'true';
  }

}
function videoControl() {
  let pc = session.sessionDescriptionHandler.peerConnection;
  if (video === 'true') {
    pc.getSenders().find(function (s) {
      console.log(s.track.kind + "--------------" + s.track.readyState);
      if (s.track.readyState == 'live' && s.track.kind === 'video') {
        s.track.stop();
      }
    });
    video = 'false';
  } else {
    navigator.mediaDevices
      .getUserMedia({
        video: true
      })
      .then(function (stream) {
        let videoTrack = stream.getVideoTracks()[0];
        var sender = pc.getSenders().find(function (s) {
          return s.track.kind == videoTrack.kind;
        });
        console.log('found sender:', sender);
        sender.replaceTrack(videoTrack);
        mediaLocal.srcObject = stream;
        mediaLocal.play();

      })
      .catch(function (err) {
        console.error('Error happens:', err);
      });

    video = 'true';
  }

}
function screenControl() {
  if (screen === 'false') {
    screen = 'true';
  } else {
  }
}

window.dialCall = dialCall;
window.sendInvite = sendInvite;
window.closeSession = closeSession;
window.videoControl = videoControl;
window.audioControl = audioControl;
window.screenControl = screenControl;
