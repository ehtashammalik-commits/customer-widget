const params = new URLSearchParams(window.location.search);

const ccm_url = decodeURIComponent(params.get('ccmUrl'));
const customer_channel_identifier = decodeURIComponent(params.get('customerIdentifier'));
const service_identifier = decodeURIComponent(params.get('serviceIdentifier'));
const clickState = decodeURIComponent(params.get('state'));
const conversation_id = decodeURIComponent(params.get('conversationId'));
const browserLang = decodeURIComponent(params.get('browserLang'));

console.log("configurations :", ccm_url, conversation_id, clickState, browserLang, service_identifier, customer_channel_identifier);
var messages = [];

// Chat API Call
const request = new XMLHttpRequest();
request.open("GET", `${ccm_url}/message/?customerChannelIdentifier=${customer_channel_identifier}&serviceIdentifier=${service_identifier}&conversationId=${conversation_id}`);
request.send();
request.onload = () => {
  if (request.status === 200) {
    messages = JSON.parse(request.response);
    console.log("Messages :", messages);
    rtlLanguage();
    messageFunction();
  } else {
    console.log(`error ${request.status} ${request.status} ${request.statusText}`)
  }
}

// RTL Language Direction
function rtlLanguage() {
  if (browserLang == 'ar') {
    document.getElementById("conversation-area").classList.add("right-direction");
  }
}

//Function for Chat Messages Of BOT , AGENT and CUSTOMER
function messageFunction() {
  let chatDiv = `<div>`;
  for (const msg in messages) {

    const message = messages[msg];
    let date = message.header.timestamp.slice(0, 10).replace(/-/g, "/");
    let dateTime = new Date(message.header.timestamp); //Convert UTC without GMT dateTime to Locale with GMT
    let min = `${dateTime.getMinutes()}` <= 9 ? `0${dateTime.getMinutes()}` : `${dateTime.getMinutes()}`;
    let time = timeConvert(`${dateTime.getHours()}:${min}`);
    document.getElementById("chatDate").innerHTML = date;

    if (message.header.sender.type == 'BOT') {

      if (message.body.type == 'BUTTON') {
        chatDiv += `
          <div class="chat-message agent-message bot-message">
            <div class="profile-pic">
              <div class="profile-pic-area user-img"> <img src="./images/robot-dark.svg" alt="Bot"> </div>
            </div>
            <div class="chat-message-content structured-message">
              <p><b>${message.body.additionalDetails.interactive.header.text}</b>
              <span>${message.body.additionalDetails.interactive.body.text}</span></p>`;
        chatDiv += `<ul class="structured-actions">`;
        for (const btn in message.body.buttons) {
          const button = message.body.buttons[btn];
          chatDiv += `<li class="">${button.title}</li>`;
        }
        chatDiv += `</ul><span class="message-stamp"><span class="chat-time">${time}</span></span></div></div>`;
      }

      if (message.body.type == 'URL') {
        chatDiv += `
          <div class="chat-message agent-message">
            <div class="profile-pic">
              <div class="profile-pic-area user-img">
                <img src="./images/robot-dark.svg" alt="bot"/>
              </div>
            </div>
            <div class="chat-message-content">
              <p>
                <span>${message.body.markdownText}</span>
                <a href="${message.body.mediaUrl}"><span>${message.body.mediaUrl}</span></a>
                <span class="message-stamp">
                  <span class="chat-time">${time}</span>
                </span>
              </p>
            </div>
          </div>`;
      }

      if (message.body.type == 'VIDEO') {
        chatDiv += `
          <div class="chat-message user-message ">
            <div class="profile-pic">
                <div class="profile-pic-area user-img">
                  <img src="./images/robot-dark.svg" alt="bot"/>
                </div>
            </div>
            <div class="chat-message-content file-type-message image-type">
              <p>
                <span>
                  <video class="videoPlayer" autoplay>
                    <source src="${message.body.attachment.mediaUrl}" type="video/mp4">
                  Your browser does not support the video tag.
                  </video>
                </span>
                <span class="message-stamp">
                  <span class="chat-time">${time}</span>
                </span></p>

          </div>
      </div>`;
      }

      if (message.body.type == 'IMAGE') {
        chatDiv += `
          <div class="chat-message agent-message">
            <div class="profile-pic">
              <div class="profile-pic-area user-img">
                <img src="./images/robot-dark.svg" alt="bot"/>
              </div>
            </div>
            <div class="chat-message-content">
              <p>
                <span>${message.body.caption}</span>
                <a target="_blank"
                href="${message.body.attachment.mediaUrl}"><img
                src="${message.body.attachment.mediaUrl}"
                class="imageViewer">
              </a>
                <span class="message-stamp">
                  <span class="chat-time">${time}</span>
                </span>
              </p>
            </div>
          </div>`;
      }

      if (message.body.type == 'FILE') {
        chatDiv += `
          <div class="chat-message agent-message">
            <div class="profile-pic">
              <div class="profile-pic-area user-img">
                <img src="./images/robot-dark.svg" alt="bot"/>
              </div>
            </div>
            <div class="chat-message-content file-type-message contact-type">
            <span class="display-file contact-logo file-message">
            <img src="./images/file-type.svg" alt="${message.body.additionalDetails.fileName}">
            <span class="file-ext-main">${message.body.attachment.mimeType.split('/')[1] == 'vnd.openxmlformats-officedocument.wordprocessingml.document' ? 'DOCX' : message.body.attachment.mimeType.split('/')[1]}</span>
            </span>
            <div class="contact-inner">
                <span class="card-label">${message.body.additionalDetails.fileName}</span>
                <span class="card-description">
                    <a class="file-download" href="${message.body.attachment.mediaUrl}"> Download </a> </span>
            </div>
            <span class="message-stamp"><span class="chat-time">${time}</span></span>
        </div>
          </div>`;
      }

      if (message.body.type == 'LOCATION') {
        chatDiv += `
          <div class="chat-message agent-message">
            <div class="profile-pic">
              <div class="profile-pic-area user-img">
                <img src="./images/robot-dark.svg" alt="bot"/>
              </div>
            </div>
            <div class="chat-message-content">
              <p><b>${message.body.additionalDetails.name}</b></p>
              <div class="mapouter">
                <div class="gmap_canvas"><iframe width="235" height="190" id="gmap_canvas"
                        src="https://maps.google.com/maps?q=${message.body.location.latitude},${message.body.location.longitude}&t=&z=15&ie=UTF8&iwloc=&output=embed"
                        frameborder="0" scrolling="no" marginheight="0" marginwidth="0"></iframe><br>
                    <a href="https://www.embedgooglemap.net">google maps api html</a>
                </div>
            </div>
            <p>
                <span class="message-stamp"><span class="chat-time">${time}</span></span>
            </p>
            </div>
          </div>`;
      }

      if (message.body.type == 'CONTACT') {
        chatDiv += `
          <div class="chat-message agent-message bot-message">
            <div class="profile-pic">
                <div class="profile-pic-area user-img"> <img src="./images/robot-dark.svg" alt="Bot"> </div>
            </div>
            <div class="chat-message-content file-type-message contact-type">
                <span class="display-file contact-logo">
                    <img src="/assets/images/dummy-user.svg"></span>
                    <div class="contact-inner">`;
        for (const phone in message.body.contacts) {
          const contact = message.body.contacts[phone];
          chatDiv += `<span class="card-label">${contact.name.formattedName}</span>
                        <span class="card-description"><a href="https://api.whatsapp.com/send?phone=${contact.phones[0].phone}&text=Hello%2C%20I%20want%20more%20info%20about%20the%20product." target="_blank">
                        ${contact.phones[0].phone}</a></span>`;
        }
        chatDiv += `</div>
                <span class="message-stamp"><span class="chat-time">${time}</span></span>
            </div>
          </div>`;
      }

      if (message.body.type == 'PLAIN') {
        chatDiv += `
          <div class="chat-message agent-message bot-message">
            <div class="profile-pic">
              <div class="profile-pic-area user-img">
                <img src="./images/robot-dark.svg" alt="bot"/>
              </div>
            </div>
            <div class="chat-message-content">
              <p><span>${message.body.markdownText}</span>
                <span class="message-stamp"><span class="chat-time">${time}</span></span></p>
            </div>
          </div>`;
      }
    }
    if (message.header.sender.type == 'AGENT') {
      let agentIcon = iconAgent(message.header.sender.senderName);
      if (message.body.type == 'NOTIFICATION') {
        if (message.body.notificationType == 'AGENT_UNSUBSCRIBED') {
          chatDiv += `
              <div class="line-info"><span>${message.header.sender.senderName} left the Conversation</span></div>
              `;
        }
        if (message.body.notificationType == 'AGENT_SUBSCRIBED') {
          chatDiv += `
              <div class="line-info"><span>${message.header.sender.senderName} joined the Conversation</span></div>
              `;
        }
      }

      if (message.body.type == 'PLAIN') {
        chatDiv += `
          <div class="chat-message agent-message">
            <div class="profile-pic">
            <div class="active-channel channel-icon web">
              <img src="https://cim-dev.expertflow.com/file-engine/api/downloadFileStream?filename=_WEB.svg" width="20" class="ng-star-inserted">
            </div>
            <div class="profile-pic-area user-img"> ${agentIcon} </div>
            </div>
            <div class="chat-message-content">
              <div class="user-name"><span>${message.header.sender.senderName}</span></div>
              <p><span>${message.body.markdownText}</span>
                <span class="message-stamp"><span class="chat-time">${time}</span></span></p>
            </div>
          </div>`;
      }

      if (message.body.type == 'VIDEO') {
        chatDiv += `
          <div class="chat-message user-message ">
            <div class="profile-pic">
            <div class="active-channel channel-icon web">
              <img src="https://cim-dev.expertflow.com/file-engine/api/downloadFileStream?filename=_WEB.svg" width="20" class="ng-star-inserted">
            </div>
            <div class="profile-pic-area user-img"> ${agentIcon} </div>
            </div>
            <div class="chat-message-content file-type-message image-type">
              <div class="user-name"><span>${message.header.sender.senderName}</span></div>
              <p>
                <span>
                  <video class="videoPlayer" autoplay="false">
                    <source src="${message.body.attachment.mediaUrl}" type="video/mp4">
                  Your browser does not support the video tag.
                  </video>
                </span>
                <span class="message-stamp">
                  <span class="chat-time">${time}</span>
                </span></p>

          </div>
      </div>`;
      }

      if (message.body.type == 'AUDIO') {
        chatDiv += `
          <div class="chat-message user-message ">
            <div class="profile-pic">
            <div class="active-channel channel-icon web">
              <img src="https://cim-dev.expertflow.com/file-engine/api/downloadFileStream?filename=_WEB.svg" width="20" class="ng-star-inserted">
            </div>
            <div class="profile-pic-area user-img"> ${agentIcon} </div>
            </div>
            <div class="chat-message-content file-type-message image-type">
              <div class="user-name"><span>${message.header.sender.senderName}</span></div>
              <p>
                <span>
                  <audio class="audioPlayer" controls>
                    <source src="${message.body.attachment.mediaUrl}" type="audio/mpeg">
                  Your browser does not support the video tag.
                  </audio>
                </span>
                <span class="message-stamp">
                  <span class="chat-time">${time}</span>
                </span></p>

          </div>
      </div>`;
      }

      if (message.body.type == 'IMAGE') {
        chatDiv += `
          <div class="chat-message agent-message">
            <div class="profile-pic">
            <div class="active-channel channel-icon web">
              <img src="https://cim-dev.expertflow.com/file-engine/api/downloadFileStream?filename=_WEB.svg" width="20" class="ng-star-inserted">
            </div>
            <div class="profile-pic-area user-img"> ${agentIcon} </div>
            </div>
            <div class="chat-message-content">
              <div class="user-name"><span>${message.header.sender.senderName}</span></div>
              <p><a target="_blank" href="${message.body.attachment.mediaUrl}"><img src="${message.body.attachment.mediaUrl}" class="imageViewer"></a>
              <span>${message.body.caption}</span>
              <span class="message-stamp"><span class="chat-time">${time}</span></span></p>
            </div>
          </div>`;
      }

      if (message.body.type == 'FILE') {
        chatDiv += `
          <div class="chat-message agent-message">
          <div class="profile-pic">
          <div class="active-channel channel-icon web">
            <img src="https://cim-dev.expertflow.com/file-engine/api/downloadFileStream?filename=_WEB.svg" width="20" class="ng-star-inserted">
          </div>
          <div class="profile-pic-area user-img"> ${agentIcon} </div>
          </div>
          <div class="chat-message-content file-type-message contact-type">
            <div class="user-name"><span>${message.header.sender.senderName}</span></div>
            <span class="display-file contact-logo file-message">
            <img src="./images/file-type.svg" alt="${message.body.additionalDetails.fileName}">
              <span class="file-ext-main">${message.body.attachment.mimeType.split('/')[1] == 'vnd.openxmlformats-officedocument.wordprocessingml.document' ? 'DOCX' : message.body.attachment.mimeType.split('/')[1]}</span>
              </span>
              <div class="contact-inner">
                  <span class="card-label">${message.body.additionalDetails.fileName}</span>
                  <span class="card-description">
                      <a class="file-download" href="${message.body.attachment.mediaUrl}"> Download </a> </span>
              </div>
              <span class="message-stamp"><span class="chat-time">${time}</span></span>
            </div>
          </div>`;
      }
    }
    if (message.header.sender.type == 'CONNECTOR') {
      let customerIcon = iconCustomer(message.header.customer.firstName);
      if (message.body.type == 'PLAIN') {

        chatDiv += `
          <div class="chat-message user-message ">
            <div class="profile-pic">
                <div class="active-channel channel-icon web">
                  <img src="https://cim-dev.expertflow.com/file-engine/api/downloadFileStream?filename=_WEB.svg" width="20" class="ng-star-inserted">
                </div>
              <div class="profile-pic-area user-img"> ${customerIcon} </div>
            </div>
            <div class="chat-message-content">
              <p><span>${message.body.markdownText}</span>
                <span class="message-stamp"><span class="chat-time">${time}</span></span></p>
            </div>
          </div>`;

      }

      if (message.body.type == 'VIDEO') {
        chatDiv += `
          <div class="chat-message user-message ">
            <div class="profile-pic">
              <div class="active-channel channel-icon web">
                <img src="https://cim-dev.expertflow.com/file-engine/api/downloadFileStream?filename=_WEB.svg" width="20" class="ng-star-inserted">
              </div>
              <div class="profile-pic-area user-img"> ${customerIcon} </div>
            </div>
            <div class="chat-message-content file-type-message image-type">
              <p>
                <span>
                  <video class="videoPlayer" autoplay>
                    <source src="${message.body.attachment.mediaUrl}" type="video/mp4">
                  Your browser does not support the video tag.
                  </video>
                </span>
                <span class="message-stamp">
                  <span class="chat-time">${time}</span>
                </span></p>

          </div>
      </div>`;
      }

      if (message.body.type == 'AUDIO') {
        chatDiv += `
          <div class="chat-message user-message ">
            <div class="profile-pic">
            <div class="active-channel channel-icon web">
              <img src="https://cim-dev.expertflow.com/file-engine/api/downloadFileStream?filename=_WEB.svg" width="20" class="ng-star-inserted">
            </div>
              <div class="profile-pic-area user-img"> ${customerIcon} </div>
            </div>
            <div class="chat-message-content file-type-message image-type">
              <p>
                <span>
                  <audio class="audioPlayer" controls>
                    <source src="${message.body.attachment.mediaUrl}" type="audio/mpeg">
                  Your browser does not support the video tag.
                  </audio>
                </span>
                <span class="message-stamp">
                  <span class="chat-time">${time}</span>
                </span></p>

          </div>
      </div>`;
      }

      if (message.body.type == 'IMAGE') {
        chatDiv += `
          <div class="chat-message user-message ">
            <div class="profile-pic">
            <div class="active-channel channel-icon web">
              <img src="https://cim-dev.expertflow.com/file-engine/api/downloadFileStream?filename=_WEB.svg" width="20" class="ng-star-inserted">
            </div>
              <div class="profile-pic-area user-img"> ${customerIcon} </div>
            </div>
            <div class="chat-message-content">
              <p><a target="_blank" href="${message.body.attachment.mediaUrl}"><img src="${message.body.attachment.mediaUrl}" class="imageViewer"></a>
              <span>${message.body.caption}</span>
              <span class="message-stamp"><span class="chat-time">${time}</span></span></p>
            </div>
          </div>`;
      }

      if (message.body.type == 'FILE') {
        chatDiv += `
          <div class="chat-message user-message ">
          <div class="profile-pic">
          <div class="active-channel channel-icon web">
            <img src="https://cim-dev.expertflow.com/file-engine/api/downloadFileStream?filename=_WEB.svg" width="20" class="ng-star-inserted">
          </div>
            <div class="profile-pic-area user-img"> ${customerIcon} </div>
          </div>
          <div class="chat-message-content file-type-message contact-type">
            <span class="display-file contact-logo file-message">
              <img src="./images/file-type.svg" alt="${message.body.additionalDetails.fileName}">
                <span class="file-ext-main">${message.body.attachment.mimeType.split('/')[1] == 'vnd.openxmlformats-officedocument.wordprocessingml.document' ? 'DOCX' : message.body.attachment.mimeType.split('/')[1]}</span>
                </span>
                <div class="contact-inner">
                    <span class="card-label">${message.body.additionalDetails.fileName}</span>
                    <span class="card-description">
                        <a class="file-download" href="${message.body.attachment.mediaUrl}"> Download </a> </span>
                </div>
              <span class="message-stamp"><span class="chat-time">${time}</span></span>
            </div>
          </div>`;
      }
    }
  }
  chatDiv += '</div>';
  document.getElementById("msg").innerHTML = chatDiv;

  setTimeout(function () {
    if (clickState == 'view') {
      return false;
    } else {
      window.print();
    }
  }, 2000);//wait 2 seconds
}
// Function for Converting Time in Message box
function timeConvert(time) {
  // Check correct time format and split into components
  time = time.toString().match(/^([01]\d|2[0-3])(:)([0-5]\d)(:[0-5]\d)?$/) || [time];

  if (time.length > 1) { // If time format correct
    time = time.slice(1);  // Remove full string match value
    time[5] = +time[0] < 12 ? ' AM' : ' PM'; // Set AM/PM
    time[0] = +time[0] % 12 || 12; // Adjust hours
  }
  return time.join(''); // return adjusted time or original string
}
// Function for Customer Message Icon
// function iconCustomer(name) {
//   const [firstLetter, secondLetter] = name.split(' ').map(s => s.charAt(0));
//   return firstLetter + "" + secondLetter;
// }
function iconCustomer(name) {
  const nameParts = name.split(' ');
  if (nameParts.length > 1) {
    // If there is more than one part to the name (i.e. a space), use the first letters of each part
    const [firstLetter, secondLetter] = nameParts.map(s => s.charAt(0));
    return firstLetter + "" + secondLetter;
  } else {
    // If there is only one part to the name (i.e. no space), use the first and last letters of the word
    return name.charAt(0) + "" + name.charAt(name.length - 1);
  }
}
// Function for Agent Message Icon
function iconAgent(name) {
  const [firstLetter, secondLetter] = [name.charAt(0), name.charAt(name.length - 1)];
  return firstLetter + "" + secondLetter;
}